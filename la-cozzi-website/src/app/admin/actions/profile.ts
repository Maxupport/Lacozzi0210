'use server';

import { prisma } from '@/lib/db';
import { assertUser, verifyPassword, hashPassword, validatePassword } from '@/lib/auth';

export async function updateProfile(data: {
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const user = await assertUser();

  const displayName = data.displayName?.trim();
  const updateData: { displayName?: string; passwordHash?: string } = {};

  if (displayName) {
    updateData.displayName = displayName;
  }

  // 若要更換密碼
  if (data.newPassword) {
    if (!data.currentPassword) {
      return { ok: false, error: '請輸入目前的舊密碼以進行驗證' };
    }

    const passErr = validatePassword(data.newPassword);
    if (passErr) return { ok: false, error: passErr };

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!dbUser) return { ok: false, error: '帳號不存在' };

    const valid = await verifyPassword(data.currentPassword, dbUser.passwordHash);
    if (!valid) {
      return { ok: false, error: '目前密碼輸入錯誤' };
    }

    updateData.passwordHash = await hashPassword(data.newPassword);
  }

  if (Object.keys(updateData).length === 0) {
    return { ok: true };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return { ok: true };
}
