import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
  type SessionPayload,
} from '../../src/lib/session';

// 測試專用假密鑰（長度大於等於 32 字元，嚴禁使用正式金鑰）
const DUMMY_AUTH_SECRET = 'unit-test-dummy-auth-secret-32-chars-minimum!';
const OTHER_DUMMY_SECRET = 'different-dummy-secret-32-chars-long!';

describe('session: JWT 與 Cookie 契約純邏輯測試', { concurrency: false }, () => {
  let savedAuthSecret: string | undefined;

  beforeEach(() => {
    savedAuthSecret = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = DUMMY_AUTH_SECRET;
  });

  afterEach(() => {
    if (savedAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = savedAuthSecret;
    }
  });

  it('OWNER Session 簽署後可成功驗證並還原正確 payload', async () => {
    const payload: SessionPayload = { uid: 'dummy-owner-uid-001', role: 'OWNER' };
    const token = await signSession(payload);
    assert.ok(typeof token === 'string' && token.length > 0);

    const verified = await verifySession(token);
    assert.deepStrictEqual(verified, payload);
  });

  it('EDITOR Session 簽署後可成功驗證並還原正確 payload', async () => {
    const payload: SessionPayload = { uid: 'dummy-editor-uid-002', role: 'EDITOR' };
    const token = await signSession(payload);
    assert.ok(typeof token === 'string' && token.length > 0);

    const verified = await verifySession(token);
    assert.deepStrictEqual(verified, payload);
  });

  it('未提供 Token 時回傳 null', async () => {
    assert.strictEqual(await verifySession(undefined), null);
    assert.strictEqual(await verifySession(''), null);
  });

  it('被竄改的 Token 回傳 null', async () => {
    const payload: SessionPayload = { uid: 'dummy-uid-003', role: 'OWNER' };
    const validToken = await signSession(payload);

    // 破壞簽章部分
    const tamperedSignature = validToken.slice(0, -6) + 'xyz123';
    assert.strictEqual(await verifySession(tamperedSignature), null);

    // 格式完全錯誤的 Token
    assert.strictEqual(await verifySession('invalid.jwt.token'), null);
    assert.strictEqual(await verifySession('random-malformed-string'), null);
  });

  it('使用不同密鑰簽署的 Token 驗證時回傳 null', async () => {
    const otherKey = new TextEncoder().encode(OTHER_DUMMY_SECRET);
    const tokenWithOtherKey = await new SignJWT({ uid: 'dummy-uid-004', role: 'OWNER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE}s`)
      .sign(otherKey);

    const result = await verifySession(tokenWithOtherKey);
    assert.strictEqual(result, null);
  });

  it('不合法角色的 Token 不得通過驗證並回傳 null', async () => {
    const key = new TextEncoder().encode(DUMMY_AUTH_SECRET);

    // 角色為非授權之任意值（例如 ADMIN、USER 或空值）
    const invalidRoleToken = await new SignJWT({ uid: 'dummy-uid-005', role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE}s`)
      .sign(key);

    assert.strictEqual(await verifySession(invalidRoleToken), null);

    const missingRoleToken = await new SignJWT({ uid: 'dummy-uid-006' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE}s`)
      .sign(key);

    assert.strictEqual(await verifySession(missingRoleToken), null);

    // uid 非 string
    const nonStringUidToken = await new SignJWT({ uid: 12345, role: 'OWNER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE}s`)
      .sign(key);

    assert.strictEqual(await verifySession(nonStringUidToken), null);
  });

  it('缺少 AUTH_SECRET 時簽署 Session 必須拋出錯誤失敗', async () => {
    delete process.env.AUTH_SECRET;
    const payload: SessionPayload = { uid: 'dummy-uid-007', role: 'OWNER' };

    await assert.rejects(
      async () => {
        await signSession(payload);
      },
      (err: Error) => {
        assert.match(err.message, /AUTH_SECRET 未設定或長度不足 32 字元/);
        return true;
      }
    );
  });

  it('AUTH_SECRET 少於 32 字元時簽署 Session 必須拋出錯誤失敗', async () => {
    process.env.AUTH_SECRET = 'short-secret-less-than-32-chars';
    const payload: SessionPayload = { uid: 'dummy-uid-008', role: 'OWNER' };

    await assert.rejects(
      async () => {
        await signSession(payload);
      },
      (err: Error) => {
        assert.match(err.message, /AUTH_SECRET 未設定或長度不足 32 字元/);
        return true;
      }
    );

    // 剛好 31 個字元
    process.env.AUTH_SECRET = '1234567890123456789012345678901';
    await assert.rejects(
      async () => {
        await signSession(payload);
      },
      (err: Error) => {
        assert.match(err.message, /AUTH_SECRET 未設定或長度不足 32 字元/);
        return true;
      }
    );
  });

  it('SESSION_COOKIE 與 SESSION_MAX_AGE 維持既有公開契約', () => {
    assert.strictEqual(SESSION_COOKIE, 'lc_session');
    assert.strictEqual(SESSION_MAX_AGE, 60 * 60 * 24 * 7); // 7 天（604800 秒）
  });

  it('Cookie 設定選項包含 httpOnly、sameSite: lax、根路徑與既有有效期限', () => {
    assert.strictEqual(sessionCookieOptions.httpOnly, true);
    assert.strictEqual(sessionCookieOptions.sameSite, 'lax');
    assert.strictEqual(sessionCookieOptions.path, '/');
    assert.strictEqual(sessionCookieOptions.maxAge, SESSION_MAX_AGE);
    assert.strictEqual(typeof sessionCookieOptions.secure, 'boolean');
  });
});
