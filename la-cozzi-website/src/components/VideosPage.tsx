"use client";

import { ListMusic, Sparkles, ExternalLink, Music2, Mic2, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface VideosPageProps {
  /** 
   * YouTube 播放清單 ID (例如 PLxxxxxxxxxxxxxxxxx)
   * 可透過 prop 傳入，或透過環境變數 NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID 設定
   */
  playlistId?: string;
}

export default function VideosPage({ playlistId }: VideosPageProps) {
  const activePlaylistId = playlistId?.trim() || "";
  const youtubePlaylistUrl = activePlaylistId ? `https://www.youtube.com/playlist?list=${activePlaylistId}` : null;

  return (
    <div className="animate-in fade-in duration-700 pb-24">
      {/* 1. Hero 區塊 */}
      <section className="py-20 md:py-24 px-6 text-center relative overflow-hidden">
        {/* 背景光暈效果 */}
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* 小標籤 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs md:text-sm font-serif font-semibold tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <ListMusic size={15} />
            <span>La Cozzi Live & Acoustic Session</span>
          </div>

          {/* 主標題 */}
          <h1 className="text-3xl md:text-5xl font-black font-serif text-stone-100 tracking-tight leading-tight mb-6">
            現場演出 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">影音精選</span>
          </h1>

          <div className="w-16 h-1 bg-gradient-to-r from-amber-500/60 to-rose-500/60 mx-auto mb-8 rounded-full" />

          {/* 簡介說明 */}
          <p className="text-base md:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed font-light">
            全程真實演奏、絕不使用預錄伴奏。
            帶您親耳感受婚禮誓詞、迎賓歡聚與重要時刻裡，最溫暖動人的手作音樂現場。
          </p>
        </div>
      </section>

      {/* 2. 主播放器專區 */}
      <section className="px-4 md:px-6 max-w-5xl mx-auto relative z-10 -mt-6">
        <div className="bg-stone-900/80 backdrop-blur-xl border-2 border-amber-500/30 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden">
          {/* 播放器上方工具列 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-800 text-xs md:text-sm">
            <div className="flex items-center gap-2 text-stone-300 font-medium">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activePlaylistId ? 'bg-rose-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activePlaylistId ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="font-serif tracking-wide text-amber-200">
                {activePlaylistId ? 'YouTube 官方播放清單' : '影音專區建置中'}
              </span>
            </div>

            {youtubePlaylistUrl && (
              <a
                href={youtubePlaylistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-300 transition-colors py-1 px-3 rounded-lg bg-stone-800/60 hover:bg-stone-800 border border-stone-700/50"
              >
                <span>在 YouTube 開啟清單</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* 播放器容器（有 ID 則顯示播放器，沒有則顯示優雅的建置中狀態） */}
          {activePlaylistId ? (
            <div className="aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-inner relative group">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${activePlaylistId}&rel=0`}
                title="La Cozzi YouTube Playlist"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden bg-stone-950/80 border-2 border-dashed border-amber-500/30 flex flex-col items-center justify-center p-8 text-center relative group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 animate-pulse">
                <Music2 size={32} />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-serif font-bold tracking-wider mb-3">
                <Sparkles size={13} />
                <span>內容整理中 • 敬請期待</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black font-serif text-stone-100 mb-3 tracking-tight">
                現場演出影音紀錄籌備中
              </h3>
              <p className="text-stone-400 text-sm md:text-base font-light max-w-md leading-relaxed mb-6">
                我們正在為您挑選與剪輯最動人的現場演出精華。<br className="hidden sm:inline" />
                影音專區即將上線，為您呈現最具溫度的手作音樂！
              </p>
              <a
                href="https://www.instagram.com/lacozzi_1314/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-500/30 hover:border-amber-400 px-5 py-2.5 rounded-organic-2 text-xs md:text-sm font-serif transition-all"
              >
                <span>搶先至 Instagram 觀看最新短片</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* 播放清單操作提示 */}
          <div className="mt-5 pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-stone-400 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>
                {activePlaylistId ? (
                  <><strong>操作提示：</strong>點選播放器右上角的清單圖示 <span className="text-amber-300 font-mono font-bold">☰</span>，即可展開瀏覽並切換所有演出影片！</>
                ) : (
                  <><strong>影音專區建置中：</strong>官方 YouTube 演出精選播放清單即將同步上線。</>
                )}
              </span>
            </div>
            <span className="text-stone-500 text-xs whitespace-nowrap">
              La Cozzi 手作音樂
            </span>
          </div>
        </div>
      </section>

      {/* 3. 現場演出特色 */}
      <section className="py-20 px-6 max-w-5xl mx-auto relative z-10">
        <h2 className="text-2xl md:text-3xl font-black font-serif text-stone-100 text-center mb-12 tracking-tight">
          為什麼選擇 La Cozzi 現場演奏？
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-stone-900/50 p-6 md:p-8 rounded-2xl border-2 border-stone-800/80 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <Mic2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-100 mb-3 font-serif">100% 真實手作演奏</h3>
            <p className="text-stone-400 text-sm leading-relaxed font-light">
              堅持不使用預編音軌伴奏，所有樂音與人聲皆由現場團員同步演奏，能依現場氣氛靈活微調呼吸與節奏。
            </p>
          </div>

          <div className="bg-stone-900/50 p-6 md:p-8 rounded-2xl border-2 border-stone-800/80 backdrop-blur-sm hover:border-rose-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
              <Music2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-100 mb-3 font-serif">多元曲風與專屬客製</h3>
            <p className="text-stone-400 text-sm leading-relaxed font-light">
              涵蓋清新民謠、經典爵士、華語流行與英美抒情情歌，可配合新人故事或活動主題量身挑選關鍵曲目。
            </p>
          </div>

          <div className="bg-stone-900/50 p-6 md:p-8 rounded-2xl border-2 border-stone-800/80 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <Heart size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-100 mb-3 font-serif">恰到好處的情緒襯托</h3>
            <p className="text-stone-400 text-sm leading-relaxed font-light">
              不喧賓奪主、不浮誇造作。15 年以上婚禮與商業演出經驗，讓溫暖的音樂成為您重要日子最安心的依靠。
            </p>
          </div>
        </div>
      </section>

      {/* 4. 行動呼籲 (CTA) */}
      <section className="px-6 max-w-4xl mx-auto relative z-10 text-center">
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border-2 border-amber-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-black font-serif text-stone-100 mb-4 tracking-tight">
              想為您的重要日子，預約專屬音樂氛圍嗎？
            </h3>
            <p className="text-stone-300 text-sm md:text-base font-light max-w-xl mx-auto mb-8 leading-relaxed">
              填寫線上表單，系統將於 3 分鐘內自動將詳細演出編制與報價方案寄送至您的信箱。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black font-serif px-7 py-3.5 rounded-organic-2 shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all text-sm md:text-base"
              >
                <span>索取演出報價單</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://ig.me/m/lacozzi_1314"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 font-serif px-6 py-3.5 rounded-organic-2 transition-all text-sm md:text-base"
              >
                <span>私訊聊聊曲目想法</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
