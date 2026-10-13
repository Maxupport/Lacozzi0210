"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Music, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('Lacozzi0210@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '登入失敗，請確認帳號與密碼');
        setLoading(false);
        return;
      }

      router.push('/admin/posts');
      router.refresh();
    } catch {
      setError('連線失敗，請檢查網路連線或稍後再試');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 relative">
      {/* 背景柔和光暈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
        {/* Header 標誌 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 group mb-4">
            <div className="w-12 h-12 rounded-organic border-2 border-stone-200 flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform bg-stone-900/60 shadow-lg">
              <div className="w-2 h-2 bg-amber-400 rounded-full mr-1 -mt-1"></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold font-serif text-stone-100 tracking-tight mb-2">
            La Cozzi 後台管理
          </h1>
          <p className="text-stone-400 text-sm font-light">
            樂團文章發布與內容維護中心
          </p>
        </div>

        {/* 登入卡片 */}
        <div className="bg-stone-900/60 backdrop-blur-xl border-2 border-stone-800 p-8 md:p-10 rounded-organic shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl rounded-full pointer-events-none"></div>

          {error && (
            <div className="mb-6 p-4 rounded-organic bg-rose-500/10 border-2 border-rose-500/30 text-rose-300 text-sm flex items-start space-x-3 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* 帳號 */}
            <div className="space-y-2">
              <label className="block text-stone-300 text-xs font-bold tracking-wider uppercase font-sans">
                登入帳號 / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3.5 bg-stone-950/80 border-2 border-stone-800 rounded-organic-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 text-sm transition-all"
                />
              </div>
            </div>

            {/* 密碼 */}
            <div className="space-y-2">
              <label className="block text-stone-300 text-xs font-bold tracking-wider uppercase font-sans">
                登入密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3.5 bg-stone-950/80 border-2 border-stone-800 rounded-organic-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 text-sm transition-all"
                />
              </div>
            </div>

            {/* 送出按鈕 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-organic-2 font-serif font-black text-stone-950 bg-amber-500 border-2 border-amber-400 hover:bg-amber-400 transition-all duration-300 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>登入後台</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-800/80 text-center text-xs text-stone-500 font-light flex items-center justify-center space-x-1.5">
            <Music size={14} className="text-amber-500/60" />
            <span>La Cozzi 拉釦子樂團內部管理入口</span>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-stone-400 hover:text-amber-400 transition-colors">
            ← 返回前台首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
