import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import UserList from '@/components/admin/UserList';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const currentOwner = await requireOwner();

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'asc' }],
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    isActive: u.isActive,
    failedLogins: u.failedLogins,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    postCount: u._count.posts,
  }));

  return <UserList users={serialized} currentOwner={currentOwner} />;
}
