import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import PartnerList from '@/components/admin/PartnerList';

export const dynamic = 'force-dynamic';

export default async function AdminPartnersPage() {
  await requireOwner();

  const partners = await prisma.partner.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  const serialized = partners.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    description: p.description,
    photo: p.photo,
    content: p.content,
    order: p.order,
    isPublished: p.isPublished,
  }));

  return <PartnerList partners={serialized} />;
}
