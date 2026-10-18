'use client';

import Link from 'next/link';

export default function ErrorBoundary({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative z-10 overflow-x-hidden">
      <div className="w-full max-w-md text-center bg-stone-900/80 border border-stone-800 rounded-2xl p-8 sm:p-10 backdrop-blur-md shadow-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6 font-mono text-2xl font-bold select-none">
          !
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight mb-3">
          頁面暫時無法顯示
        </h1>
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed mb-8">
          可能只是暫時性的狀況，請重新嘗試或先回到首頁。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-900"
          >
            重新載入內容
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-colors text-center focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 focus:ring-offset-stone-900"
          >
            回到首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
