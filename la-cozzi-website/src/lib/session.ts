import { SignJWT, jwtVerify } from 'jose';

// 只依賴 jose，可同時在 proxy.ts 與 server 端使用（不可 import prisma）

export const SESSION_COOKIE = 'lc_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export type SessionPayload = {
  uid: string;
  role: 'OWNER' | 'EDITOR';
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET 未設定或長度不足 32 字元');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (typeof payload.uid !== 'string') return null;
    if (payload.role !== 'OWNER' && payload.role !== 'EDITOR') return null;
    return { uid: payload.uid, role: payload.role };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};
