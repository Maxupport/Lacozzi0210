import { prisma } from './db';

export interface PublicPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  cover: string;
  date: string; // ISO
  youtubeUrl?: string;
  externalUrl?: string;
  authorName?: string;
}

export interface PublicPartner {
  id: string;
  name: string;
  role: string;
  description: string[];
  photo: string;
  content?: string;
}

type PostRow = Awaited<ReturnType<typeof findPublished>>[number];

function findPublished() {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      tags: true,
      cover: true,
      youtubeUrl: true,
      externalUrl: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { displayName: true } },
    },
  });
}

function toPublic(p: PostRow): PublicPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    tags: p.tags,
    cover: p.cover ?? '',
    date: (p.publishedAt ?? p.createdAt).toISOString(),
    youtubeUrl: p.youtubeUrl ?? undefined,
    externalUrl: p.externalUrl ?? undefined,
    authorName: p.author?.displayName
      ? p.author.displayName.replace(/\s*[(（]管理員[)）]/g, '').trim()
      : undefined,
  };
}

/** 前台用：已發布文章（資料庫暫時無法連線時回傳空陣列，避免整站掛掉） */
export async function getPublishedPosts(): Promise<PublicPost[]> {
  try {
    return (await findPublished()).map(toPublic);
  } catch (error) {
    console.error('Failed to load posts', error);
    return [];
  }
}

export async function getPublishedPostsWithUpdatedAt() {
  try {
    return (await findPublished()).map((p) => ({ ...toPublic(p), updatedAt: p.updatedAt.toISOString() }));
  } catch (error) {
    console.error('Failed to load posts', error);
    return [];
  }
}

export async function getPostBySlug(rawSlug: string) {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // 保留原值
  }
  slug = slug.trim();

  const post = await prisma.post.findFirst({
    where: { status: 'PUBLISHED', slug: { equals: slug, mode: 'insensitive' } },
    include: { author: { select: { displayName: true } } },
  });
  if (!post) return null;

  const all = await getPublishedPosts();
  const index = all.findIndex((p) => p.id === post.id);
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;

  return {
    post: {
      ...toPublic(post),
      updatedAt: post.updatedAt.toISOString(),
    },
    markdown: post.content,
    nextPost: next ? { slug: next.slug, title: next.title, externalUrl: next.externalUrl } : null,
  };
}

export async function getPublishedPartners(): Promise<PublicPartner[]> {
  try {
    const rows = await prisma.partner.findMany({
      where: { isPublished: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      description: r.description,
      photo: r.photo ?? '',
      content: r.content ?? undefined,
    }));
  } catch (error) {
    console.error('Failed to load partners', error);
    return [];
  }
}
