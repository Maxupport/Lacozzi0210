import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, canEditPost } from '@/lib/auth';
import PostEditor from '@/components/admin/PostEditor';

export const dynamic = 'force-dynamic';

export default async function EditPostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await props.params;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  if (!canEditPost(user, post)) {
    redirect('/admin/posts');
  }

  return (
    <PostEditor
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content,
        cover: post.cover || '',
        youtubeUrl: post.youtubeUrl || '',
        tags: post.tags,
        status: post.status,
      }}
    />
  );
}
