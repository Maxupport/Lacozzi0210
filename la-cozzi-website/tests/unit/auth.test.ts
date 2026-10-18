import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUsername,
  validatePassword,
  hashPassword,
  verifyPassword,
  canEditPost,
  MAX_FAILED_LOGINS,
  LOCK_MINUTES,
  type CurrentUser,
} from '../../src/lib/auth';

describe('auth: normalizeUsername 純邏輯測試', () => {
  it('移除帳號名稱前後的空白字元', () => {
    assert.strictEqual(normalizeUsername('  testuser  '), 'testuser');
    assert.strictEqual(normalizeUsername('\tadmin\n'), 'admin');
    assert.strictEqual(normalizeUsername('  lacozzi  '), 'lacozzi');
  });

  it('將帳號名稱中的英文字母轉換為小寫', () => {
    assert.strictEqual(normalizeUsername('AdminUser'), 'adminuser');
    assert.strictEqual(normalizeUsername('LA_COZZI'), 'la_cozzi');
    assert.strictEqual(normalizeUsername('UserName123'), 'username123');
  });

  it('已經正規化的帳號名稱維持相同結果', () => {
    assert.strictEqual(normalizeUsername('testuser'), 'testuser');
    assert.strictEqual(normalizeUsername('lacozzi_editor'), 'lacozzi_editor');
    assert.strictEqual(normalizeUsername('editor.2026'), 'editor.2026');
  });

  it('前後空白與大小寫混合時同時被正規化', () => {
    assert.strictEqual(normalizeUsername('   Admin_Band_2026   '), 'admin_band_2026');
  });
});

describe('auth: validatePassword 密碼長度契約驗證', () => {
  it('密碼少於 8 個字元時回傳既有錯誤訊息', () => {
    assert.strictEqual(validatePassword(''), '密碼至少需要 8 個字元');
    assert.strictEqual(validatePassword('1234567'), '密碼至少需要 8 個字元');
    assert.strictEqual(validatePassword('short'), '密碼至少需要 8 個字元');
  });

  it('密碼正好為 8 個字元時驗證通過回傳 null', () => {
    assert.strictEqual(validatePassword('12345678'), null);
    assert.strictEqual(validatePassword('password'), null);
    assert.strictEqual(validatePassword('abcdefgh'), null);
  });

  it('一般常見合法長度密碼驗證通過回傳 null', () => {
    assert.strictEqual(validatePassword('dummy-test-password-123'), null);
    assert.strictEqual(validatePassword('correct-horse-battery-staple'), null);
    assert.strictEqual(validatePassword('a'.repeat(32)), null);
    assert.strictEqual(validatePassword('a'.repeat(64)), null);
  });

  it('密碼長度正好為 128 個字元時驗證通過回傳 null', () => {
    const exactly128Chars = 'k'.repeat(128);
    assert.strictEqual(validatePassword(exactly128Chars), null);
  });

  it('密碼長度超過 128 個字元時回傳既有錯誤訊息', () => {
    const chars129 = 'k'.repeat(129);
    assert.strictEqual(validatePassword(chars129), '密碼過長');

    const chars200 = 'x'.repeat(200);
    assert.strictEqual(validatePassword(chars200), '密碼過長');
  });
});

describe('auth: hashPassword 與 verifyPassword 密碼雜湊與比對測試', () => {
  // 明確標記僅供單元測試使用的假密碼，禁止使用正式密碼
  const dummyPlainPassword = 'dummy-unit-test-password-only-1234!';
  const wrongPlainPassword = 'dummy-wrong-password-for-testing-5678!';

  it('雜湊結果不得等於明文字串', async () => {
    const hash = await hashPassword(dummyPlainPassword);
    assert.notStrictEqual(hash, dummyPlainPassword);
    assert.ok(typeof hash === 'string' && hash.length > 20);
    // 確認符合標準 bcrypt 格式開頭
    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
  });

  it('正確的密碼可成功通過 verifyPassword 驗證', async () => {
    const hash = await hashPassword(dummyPlainPassword);
    const result = await verifyPassword(dummyPlainPassword, hash);
    assert.strictEqual(result, true);
  });

  it('錯誤的密碼無法通過 verifyPassword 驗證', async () => {
    const hash = await hashPassword(dummyPlainPassword);
    const result = await verifyPassword(wrongPlainPassword, hash);
    assert.strictEqual(result, false);
  });

  it('同一明文多次雜湊產生不同鹽值，不得以固定字串比對但皆能成功比對', async () => {
    const hash1 = await hashPassword(dummyPlainPassword);
    const hash2 = await hashPassword(dummyPlainPassword);

    // 每次雜湊應含有不同隨機鹽值，因此兩者字串不相同
    assert.notStrictEqual(hash1, hash2);

    // 兩個不同雜湊皆應能驗證原密碼
    assert.strictEqual(await verifyPassword(dummyPlainPassword, hash1), true);
    assert.strictEqual(await verifyPassword(dummyPlainPassword, hash2), true);
  });
});

describe('auth: canEditPost 權限判斷測試', () => {
  const dummyOwner: CurrentUser = {
    id: 'mock-user-owner-001',
    username: 'owner_mock',
    displayName: 'Mock Owner',
    role: 'OWNER',
  };

  const dummyEditor1: CurrentUser = {
    id: 'mock-user-editor-002',
    username: 'editor1_mock',
    displayName: 'Mock Editor 1',
    role: 'EDITOR',
  };

  const dummyEditor2: CurrentUser = {
    id: 'mock-user-editor-003',
    username: 'editor2_mock',
    displayName: 'Mock Editor 2',
    role: 'EDITOR',
  };

  it('OWNER 角色可編輯其他作者發布的文章', () => {
    const postByEditor = { authorId: dummyEditor1.id };
    assert.strictEqual(canEditPost(dummyOwner, postByEditor), true);
  });

  it('OWNER 角色可編輯未指定作者（authorId 為 null）的文章', () => {
    const postWithoutAuthor = { authorId: null };
    assert.strictEqual(canEditPost(dummyOwner, postWithoutAuthor), true);
  });

  it('OWNER 角色可編輯自己發布的文章', () => {
    const postByOwner = { authorId: dummyOwner.id };
    assert.strictEqual(canEditPost(dummyOwner, postByOwner), true);
  });

  it('EDITOR 角色可編輯自己建立的文章', () => {
    const postBySelf = { authorId: dummyEditor1.id };
    assert.strictEqual(canEditPost(dummyEditor1, postBySelf), true);
  });

  it('EDITOR 角色不可編輯其他作者建立的文章', () => {
    const postByOther = { authorId: dummyEditor2.id };
    assert.strictEqual(canEditPost(dummyEditor1, postByOther), false);

    const postByOwner = { authorId: dummyOwner.id };
    assert.strictEqual(canEditPost(dummyEditor1, postByOwner), false);
  });

  it('EDITOR 角色不可編輯作者為 null 的文章', () => {
    const postWithoutAuthor = { authorId: null };
    assert.strictEqual(canEditPost(dummyEditor1, postWithoutAuthor), false);
  });
});

describe('auth: 安全常數契約鎖定', () => {
  it('最大登入失敗嘗試次數 MAX_FAILED_LOGINS 維持為 5', () => {
    assert.strictEqual(MAX_FAILED_LOGINS, 5);
  });

  it('帳號鎖定時間 LOCK_MINUTES 維持為 15 分鐘', () => {
    assert.strictEqual(LOCK_MINUTES, 15);
  });
});
