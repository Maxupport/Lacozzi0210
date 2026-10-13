"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Users, UserCheck, Settings, LogOut, ExternalLink, Music, MessageSquare } from 'lucide-react';
import type { CurrentUser } from '@/lib/auth';

export default function AdminNav({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // 忽略
    }
    router.push('/admin');
    router.refresh();
  };

  const navItems = [
    { href: '/admin/posts', label: '文章管理', icon: FileText },
    { href: '/admin/reviews', label: '好評管理', icon: MessageSquare },
    ...(user.role === 'OWNER'
      ? [
          { href: '/admin/partners', label: '夥伴管理', icon: Music },
          { href: '/admin/users', label: '帳號管理', icon: Users },
        ]
      : []),
    { href: '/admin/profile', label: '個人設定', icon: Settings },
  ];

  return (
    <header className="border-b-2 border-stone-800 bg-stone-950/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* 左側：品牌與回前台 */}
        <div className="flex items-center space-x-6">
          <Link href="/admin/posts" className="flex items-center space-x-3 group">
            <div className="w-7 h-7 rounded-organic border-2 border-amber-400 flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform bg-amber-500/10">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-0.5 -mt-0.5"></div>
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
            </div>
            <span className="font-serif font-black tracking-wider text-stone-100 text-lg">
              La Cozzi <span className="text-xs text-amber-400 font-sans font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 ml-1">後台管理</span>
            </span>
          </Link>

          {/* 導覽列 */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-organic text-sm font-bold transition-all ${
                    active
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 右側：使用者資訊與登出 */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center space-x-1 text-xs text-stone-400 hover:text-amber-400 px-3 py-1.5 rounded-organic border border-stone-800 hover:border-amber-500/40 transition-colors"
          >
            <span>檢視前台</span>
            <ExternalLink size={12} />
          </Link>

          <div className="flex items-center space-x-2 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-organic text-xs">
            <UserCheck size={14} className="text-amber-400 shrink-0" />
            <span className="font-bold text-stone-200">{user.displayName}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
              user.role === 'OWNER'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-stone-800 text-stone-400'
            }`}>
              {user.role === 'OWNER' ? '管理員' : '夥伴'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="登出"
            className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-organic transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* 手機版底部導覽 */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-stone-800 bg-stone-950/95">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center space-x-1 px-2.5 py-1 text-xs rounded font-bold ${
                active ? 'text-amber-300 bg-amber-500/10' : 'text-stone-400'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
