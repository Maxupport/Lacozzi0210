import { getCurrentUser } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = {
  title: '網站管理後台 | La Cozzi 拉釦子樂團',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 flex flex-col">
      {user && <AdminNav user={user} />}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
