import { requireUser } from '@/lib/auth';
import PostEditor from '@/components/admin/PostEditor';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  await requireUser();
  return <PostEditor />;
}
