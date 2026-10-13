'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { assertOwner } from '@/lib/auth';

export type SavePartnerInput = {
  id?: string;
  name: string;
  role: string;
  description: string[];
  photo?: string;
  content?: string;
  order?: number;
  isPublished?: boolean;
};

export async function savePartner(input: SavePartnerInput) {
  await assertOwner();

  const name = input.name?.trim();
  if (!name) return { ok: false, error: '請填寫夥伴姓名' };

  const data = {
    name,
    role: input.role?.trim() || '',
    description: input.description || [],
    photo: input.photo?.trim() || null,
    content: input.content || null,
    order: typeof input.order === 'number' ? input.order : 0,
    isPublished: input.isPublished ?? true,
  };

  let saved;
  if (input.id) {
    saved = await prisma.partner.update({
      where: { id: input.id },
      data,
    });
  } else {
    saved = await prisma.partner.create({ data });
  }

  revalidatePath('/partners');
  revalidatePath('/admin/partners');
  return { ok: true, partner: saved };
}

export async function deletePartner(id: string) {
  await assertOwner();
  await prisma.partner.delete({ where: { id } });
  revalidatePath('/partners');
  revalidatePath('/admin/partners');
  return { ok: true };
}
