import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative z-10 overflow-x-hidden">
      <div className="w-full max-w-lg text-center bg-stone-900/80 border border-stone-800 rounded-2xl p-8 sm:p-12 backdrop-blur-md shadow-2xl">
        <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-sm sm:text-base font-bold tracking-wider mb-5 select-none">
          404
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-stone-100 tracking-tight mb-3">
          找不到這個頁面
        </h1>
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed mb-8">
          這個網址可能已變更，或頁面暫時不存在。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-900"
          >
            回到首頁
          </Link>
          <Link
            href="/videos"
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-colors text-center focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 focus:ring-offset-stone-900"
          >
            查看演出影音
          </Link>
        </div>
      </div>
    </main>
  );
}
