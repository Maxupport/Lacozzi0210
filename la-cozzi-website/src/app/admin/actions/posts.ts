'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { assertUser, canEditPost } from '@/lib/auth';
import { slugify, isValidSlug } from '@/lib/utils';
import type { PostStatus } from '@prisma/client';

export type SavePostInput = {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  cover?: string;
  youtubeUrl?: string;
  tags?: string[];
  status?: PostStatus;
};

export async function savePost(input: SavePostInput) {
  const user = await assertUser();

  const title = input.title?.trim();
  if (!title) {
    return { ok: false, error: '請填寫文章標題' };
  }

  // 自動產生或驗證 slug
  let slug = input.slug?.trim() ? slugify(input.slug) : slugify(title);
  if (!isValidSlug(slug)) {
    slug = `post-${Date.now()}`;
  }

  // 檢查 slug 是否已被其他文章使用
  const existingWithSlug = await prisma.post.findFirst({
    where: {
      slug,
      ...(input.id ? { id: { not: input.id } } : {}),
    },
    select: { id: true },
  });

  if (existingWithSlug) {
    return { ok: false, error: `網址別名「${slug}」已被使用，請指定其他代稱` };
  }

  const status: PostStatus = input.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
  const publishedAt = status === 'PUBLISHED' ? new Date() : null;

  if (input.id) {
    // 編輯現有文章
    const current = await prisma.post.findUnique({
      where: { id: input.id },
      select: { id: true, authorId: true, publishedAt: true, slug: true },
    });

    if (!current) {
      return { ok: false, error: '文章不存在' };
    }

    if (!canEditPost(user, current)) {
      return { ok: false, error: '權限不足：您只能編輯自己撰寫的文章' };
    }

    const updated = await prisma.post.update({
      where: { id: input.id },
      data: {
        title,
        slug,
        excerpt: input.excerpt?.trim() || null,
        content: input.content || '',
        cover: input.cover?.trim() || null,
        youtubeUrl: input.youtubeUrl?.trim() || null,
        tags: input.tags || [],
        status,
        publishedAt: status === 'PUBLISHED' ? (current.publishedAt || publishedAt) : null,
      },
    });

    revalidatePath('/blog');
    revalidatePath(`/blog/${current.slug}`);
    if (current.slug !== slug) revalidatePath(`/blog/${slug}`);
    revalidatePath('/sitemap.xml');

    return { ok: true, post: updated };
  } else {
    // 新增文章
    const created = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: input.excerpt?.trim() || null,
        content: input.content || '',
        cover: input.cover?.trim() || null,
        youtubeUrl: input.youtubeUrl?.trim() || null,
        tags: input.tags || [],
        status,
        publishedAt,
        authorId: user.id,
      },
    });

    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/sitemap.xml');

    return { ok: true, post: created };
  }
}

export async function deletePost(id: string) {
  const user = await assertUser();

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, authorId: true },
  });

  if (!post) {
    return { ok: false, error: '文章不存在' };
  }

  if (!canEditPost(user, post)) {
    return { ok: false, error: '權限不足：您只能刪除自己撰寫的文章' };
  }

  await prisma.post.delete({ where: { id } });

  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath('/sitemap.xml');

  return { ok: true };
}

export async function togglePostStatus(id: string) {
  const user = await assertUser();

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, authorId: true, status: true, publishedAt: true },
  });

  if (!post) return { ok: false, error: '文章不存在' };
  if (!canEditPost(user, post)) return { ok: false, error: '權限不足' };

  const newStatus: PostStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  const publishedAt = newStatus === 'PUBLISHED' ? (post.publishedAt || new Date()) : null;

  await prisma.post.update({
    where: { id },
    data: { status: newStatus, publishedAt },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath('/sitemap.xml');

  return { ok: true, status: newStatus };
}
