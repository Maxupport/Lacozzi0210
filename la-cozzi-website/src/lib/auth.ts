import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from './db';
import { SESSION_COOKIE, verifySession } from './session';

export type CurrentUser = Pick<User, 'id' | 'username' | 'displayName' | 'role'>;

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return '密碼至少需要 8 個字元';
  if (password.length > 128) return '密碼過長';
  return null;
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

/**
 * 讀取目前登入者。每次都回資料庫確認帳號仍存在且為啟用狀態，
 * 所以帳號被停用或刪除後會立即失效（不用等 cookie 過期）。
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, username: true, displayName: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  const { isActive: _ignored, ...rest } = user;
  return rest;
});

/** 頁面用：未登入就導回登入頁（經由 logout 清除失效的 cookie） */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/api/auth/logout');
  return user;
}

/** 頁面用：非管理員導回文章列表 */
export async function requireOwner(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== 'OWNER') redirect('/admin/posts');
  return user;
}

export class AuthError extends Error {}

/** Server Action / Route Handler 用：不導頁，直接丟錯 */
export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('請重新登入');
  return user;
}

export async function assertOwner(): Promise<CurrentUser> {
  const user = await assertUser();
  if (user.role !== 'OWNER') throw new AuthError('只有管理員可以執行這個操作');
  return user;
}

export function canEditPost(user: CurrentUser, post: { authorId: string | null }) {
  return user.role === 'OWNER' || post.authorId === user.id;
}
