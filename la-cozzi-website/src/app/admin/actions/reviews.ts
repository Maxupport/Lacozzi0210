'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { assertUser } from '@/lib/auth';
import type { ReviewStatus } from '@prisma/client';

export type SaveReviewInput = {
  id?: string;
  name: string;
  email?: string;
  tag: string;
  stars: number;
  comment: string;
  date?: string;
  source?: string;
  status?: ReviewStatus;
};

/** 儲存好評（新增或編輯，管理員/夥伴皆可使用） */
export async function saveReview(input: SaveReviewInput) {
  await assertUser();

  const name = input.name?.trim();
  if (!name) return { ok: false, error: '請填寫客戶稱呼' };

  const comment = input.comment?.trim();
  if (!comment) return { ok: false, error: '請填寫評價內容' };

  const stars = Math.min(5, Math.max(1, Number(input.stars) || 5));
  const tag = input.tag?.trim() || '婚禮晚宴';
  const email = input.email?.trim() || null;
  const date = input.date?.trim() || new Date().toISOString().split('T')[0];
  const source = input.source?.trim() || (input.id ? undefined : 'MANUAL');
  const status: ReviewStatus = input.status || 'APPROVED';

  if (input.id) {
    const updated = await prisma.review.update({
      where: { id: input.id },
      data: {
        name,
        email,
        tag,
        stars,
        comment,
        date,
        ...(input.source ? { source } : {}),
        status,
      },
    });
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    return { ok: true, review: updated };
  }

  const created = await prisma.review.create({
    data: {
      name,
      email,
      tag,
      stars,
      comment,
      date,
      source: source || 'MANUAL',
      status,
    },
  });

  revalidatePath('/reviews');
  revalidatePath('/admin/reviews');
  return { ok: true, review: created };
}

/** 一鍵切換審核狀態（PENDING <-> APPROVED） */
export async function toggleReviewStatus(id: string) {
  await assertUser();

  const current = await prisma.review.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!current) return { ok: false, error: '找不到該筆評價' };

  const nextStatus: ReviewStatus = current.status === 'APPROVED' ? 'PENDING' : 'APPROVED';

  const updated = await prisma.review.update({
    where: { id },
    data: { status: nextStatus },
  });

  revalidatePath('/reviews');
  revalidatePath('/admin/reviews');
  return { ok: true, status: updated.status };
}

/** 刪除好評 */
export async function deleteReview(id: string) {
  await assertUser();

  await prisma.review.delete({
    where: { id },
  });

  revalidatePath('/reviews');
  revalidatePath('/admin/reviews');
  return { ok: true };
}
