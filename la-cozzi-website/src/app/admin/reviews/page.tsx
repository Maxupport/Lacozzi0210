import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ReviewList from '@/components/admin/ReviewList';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  await requireUser();

  const reviews = await prisma.review.findMany({
    orderBy: [{ createdAt: 'desc' }],
  });

  const serialized = reviews.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    tag: r.tag,
    stars: r.stars,
    comment: r.comment,
    status: r.status,
    source: r.source,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
  }));

  return <ReviewList reviews={serialized} />;
}
