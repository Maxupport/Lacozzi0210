import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import PostList from '@/components/admin/PostList';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const user = await requireUser();

  const posts = await prisma.post.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: {
      author: {
        select: { displayName: true },
      },
    },
  });

  const serialized = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover: p.cover,
    tags: p.tags,
    status: p.status,
    youtubeUrl: p.youtubeUrl,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    updatedAt: p.updatedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
    authorId: p.authorId,
    authorName: p.author?.displayName ?? null,
  }));

  return <PostList posts={serialized} currentUser={user} />;
}
