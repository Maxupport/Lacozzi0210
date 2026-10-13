'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import {
  assertOwner,
  hashPassword,
  validatePassword,
  normalizeUsername,
} from '@/lib/auth';
import type { Role } from '@prisma/client';

export type CreateUserInput = {
  username: string;
  displayName: string;
  password: string;
  role: Role;
};

export async function createUser(input: CreateUserInput) {
  await assertOwner();

  const username = normalizeUsername(input.username || '');
  const displayName = input.displayName?.trim() || '';

  if (!username) return { ok: false, error: '請填寫登入帳號' };
  if (!displayName) return { ok: false, error: '請填寫顯示名稱' };

  const passErr = validatePassword(input.password || '');
  if (passErr) return { ok: false, error: passErr };

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existing) {
    return { ok: false, error: `帳號「${username}」已存在，請使用其他帳號` };
  }

  const passwordHash = await hashPassword(input.password);
  const created = await prisma.user.create({
    data: {
      username,
      displayName,
      passwordHash,
      role: input.role === 'OWNER' ? 'OWNER' : 'EDITOR',
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  revalidatePath('/admin/users');
  return { ok: true, user: created };
}

export type UpdateUserInput = {
  id: string;
  displayName?: string;
  role?: Role;
  isActive?: boolean;
};

export async function updateUser(input: UpdateUserInput) {
  const currentOwner = await assertOwner();

  const target = await prisma.user.findUnique({
    where: { id: input.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!target) return { ok: false, error: '帳號不存在' };

  // 防止 OWNER 停用自己或將自己降級為 EDITOR
  if (target.id === currentOwner.id) {
    if (input.isActive === false) {
      return { ok: false, error: '不可將自己停用' };
    }
    if (input.role && input.role !== 'OWNER') {
      return { ok: false, error: '不可將自己降級為一般夥伴' };
    }
  }

  // 確保系統中隨時至少有一位啟用的 OWNER
  if (target.role === 'OWNER' && (input.role === 'EDITOR' || input.isActive === false)) {
    const activeOwnerCount = await prisma.user.count({
      where: { role: 'OWNER', isActive: true },
    });
    if (activeOwnerCount <= 1) {
      return { ok: false, error: '系統必須保留至少一位啟用的管理員' };
    }
  }

  const updated = await prisma.user.update({
    where: { id: input.id },
    data: {
      ...(input.displayName ? { displayName: input.displayName.trim() } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
    },
  });

  revalidatePath('/admin/users');
  return { ok: true, user: updated };
}

export async function resetUserPassword(id: string, newPassword: string) {
  await assertOwner();

  const passErr = validatePassword(newPassword);
  if (passErr) return { ok: false, error: passErr };

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!target) return { ok: false, error: '帳號不存在' };

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      failedLogins: 0,
      lockedUntil: null,
    },
  });

  return { ok: true };
}

export async function deleteUser(id: string) {
  const currentOwner = await assertOwner();

  if (id === currentOwner.id) {
    return { ok: false, error: '不可刪除自己目前的帳號' };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!target) return { ok: false, error: '帳號不存在' };

  if (target.role === 'OWNER') {
    const ownerCount = await prisma.user.count({ where: { role: 'OWNER' } });
    if (ownerCount <= 1) {
      return { ok: false, error: '系統必須保留至少一位管理員，無法刪除' };
    }
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
  return { ok: true };
}
