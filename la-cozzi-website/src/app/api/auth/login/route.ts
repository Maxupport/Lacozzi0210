import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyPassword,
  normalizeUsername,
  MAX_FAILED_LOGINS,
  LOCK_MINUTES,
} from '@/lib/auth';
import { signSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const usernameRaw = body.username;
    const password = body.password;

    if (!usernameRaw || !password) {
      return NextResponse.json({ ok: false, error: '請輸入帳號與密碼' }, { status: 400 });
    }

    const username = normalizeUsername(usernameRaw);
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: '帳號或密碼錯誤' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ ok: false, error: '此帳號已被停用，請聯絡管理員' }, { status: 403 });
    }

    // 檢查防暴破鎖定
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      return NextResponse.json(
        { ok: false, error: `密碼連續錯誤次數過多，帳號已鎖定，請於 ${waitMin} 分鐘後再試` },
        { status: 429 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const failed = user.failedLogins + 1;
      const willLock = failed >= MAX_FAILED_LOGINS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: failed,
          lockedUntil: willLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : undefined,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error: willLock
            ? `密碼連續錯誤 ${MAX_FAILED_LOGINS} 次，帳號已鎖定 ${LOCK_MINUTES} 分鐘`
            : '帳號或密碼錯誤',
        },
        { status: 401 }
      );
    }

    // 登入成功：清除錯誤計數與更新最後登入時間
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const token = await signSession({ uid: user.id, role: user.role });
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ ok: false, error: '伺服器內部錯誤，請稍後再試' }, { status: 500 });
  }
}
