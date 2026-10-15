"use client";

import { useState } from 'react';
import { Star, Quote, UserCircle, CheckCircle2, AlertCircle, X, Sparkles, ChevronRight } from 'lucide-react';
import type { PublicReview } from '@/lib/content';

export default function ReviewsPage({ initialReviews }: { initialReviews: PublicReview[] }) {
  const [reviews] = useState<PublicReview[]>(initialReviews);
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PublicReview | null>(null);

  // 表單狀態
  const [name, setName] = useState('');
  const [tag, setTag] = useState('婚禮晚宴');
  const [customTag, setCustomTag] = useState('');
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const predefinedTags = ['婚禮晚宴', '婚禮午宴', '品牌發表會', '春酒尾牙', '私人派對'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const finalTag = tag === 'CUSTOM' ? customTag.trim() || '活動嘉賓' : tag;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tag: finalTag,
          stars,
          comment: comment.trim(),
          email: email.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || '送出失敗，請稍後再試');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
      // 清空表單
      setName('');
      setComment('');
      setEmail('');
    } catch {
      setErrorMsg('網路連線異常，請稍後再試');
      setSubmitting(false);
    }
  };

  const renderStars = (count: number) => (
    <div className="flex space-x-1 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < count ? "currentColor" : "none"}
          className={i < count ? "text-amber-400" : "text-stone-700"}
        />
      ))}
    </div>
  );

  return (
    <div className="pt-4 md:pt-8 pb-24 px-4 md:px-6 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-700">
      {/* 頁面標題區 */}
      <div className="text-center mb-8 md:mb-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[90px] bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        <h2 className="text-3xl md:text-4xl font-black font-serif text-stone-100 mb-2.5 relative z-10 tracking-tight">
          聽見感動的迴響
        </h2>
        <p className="text-stone-300 max-w-xl mx-auto font-light leading-relaxed text-sm md:text-base relative z-10 mb-5">
          每一次演出後收到最真實的回饋，都是我們繼續用音樂創造溫度的最強動力。
        </p>

        <div className="relative z-10">
          <button
            type="button"
            onClick={() => {
              setShowModal(true);
              setSubmitted(false);
              setErrorMsg('');
            }}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-2.5 rounded-organic font-black font-serif text-sm transition-all duration-300 inline-flex items-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>分享您的美好體驗</span>
          </button>
        </div>
      </div>

      {/* 好評卡片網格 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 mb-20 relative z-10">
        {reviews.length === 0 ? (
          <div className="col-span-full text-center py-20 text-stone-500">
            目前尚無公開評價，歡迎成為第一位留下感動回饋的朋友！
          </div>
        ) : (
          reviews.map((review) => {
            const isLong =
              review.comment.length > 85 ||
              review.comment.includes('\n\n') ||
              review.comment.split('\n').length > 3;

            return (
              <div
                key={review.id}
                className="bg-stone-900/60 p-6 rounded-organic border-2 border-stone-800 backdrop-blur-sm shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] relative hover:shadow-[0_20px_50px_-15px_rgba(245,158,11,0.15)] hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col justify-between h-[340px] md:h-[350px]"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all duration-500 group-hover:bg-amber-500/10 pointer-events-none"></div>
                <Quote
                  className="absolute top-5 right-5 text-stone-100/5 group-hover:text-amber-500/15 transition-colors duration-500 pointer-events-none"
                  size={32}
                  strokeWidth={1}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* 人名與分類標籤 */}
                  <div className="flex items-center space-x-3 mb-3 relative z-10 shrink-0">
                    <div className="p-2 bg-stone-800/80 rounded-organic-2 border-2 border-stone-700/50 text-amber-400">
                      <UserCircle size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold font-serif text-stone-100 text-base leading-tight">{review.name}</p>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 inline-block mt-1">
                        {review.tag}
                      </span>
                    </div>
                  </div>

                  {/* 星等 */}
                  <div className="mb-2.5 relative z-10 shrink-0">{renderStars(review.stars)}</div>

                  {/* 文字內容（統一截斷並留有展開按鈕） */}
                  <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden">
                    <p className="text-stone-300 text-sm leading-relaxed font-light line-clamp-4 whitespace-pre-line">
                      {review.comment}
                    </p>

                    {isLong ? (
                      <button
                        type="button"
                        onClick={() => setSelectedReview(review)}
                        className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center space-x-1 transition-colors cursor-pointer w-fit group/btn"
                      >
                        <span>點擊展開看更多</span>
                        <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>
                </div>

                {/* 底部時間 */}
                <div className="mt-3.5 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500 font-mono tracking-wider relative z-10 shrink-0">
                  <span>{review.date}</span>
                  <span className="text-[10px] text-stone-600">La Cozzi 樂團評價</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 新人填寫體驗 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-800 rounded-organic p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold font-serif text-stone-100">
                  感謝您的溫暖回饋！
                </h3>
                <p className="text-stone-300 text-sm leading-relaxed max-w-sm mx-auto font-light">
                  您的每一次讚美與建議都是 La Cozzi 樂團最珍貴的寶物。我們在後台審核核准後，就會將這段溫暖的話語刊登在官網上囉！
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-organic text-sm font-bold transition-colors"
                  >
                    關閉視窗
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-serif text-stone-100 flex items-center space-x-2">
                    <Sparkles size={22} className="text-amber-400" />
                    <span>分享您的美好體驗</span>
                  </h3>
                  <p className="text-stone-400 text-xs mt-1 font-light">
                    很高興能用音樂參與您的重要時刻，歡迎留下您想對我們說的話：
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 您的稱呼 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                      您的稱呼 *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例：新人 Max & Claire、陳小姐"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* 場合標籤 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      演出場合 *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {predefinedTags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTag(t)}
                          className={`text-xs px-3 py-1.5 rounded-organic border transition-all cursor-pointer ${
                            tag === t
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                              : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setTag('CUSTOM')}
                        className={`text-xs px-3 py-1.5 rounded-organic border transition-all cursor-pointer ${
                          tag === 'CUSTOM'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                            : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        其他場合...
                      </button>
                    </div>
                    {tag === 'CUSTOM' && (
                      <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder="請輸入演出場合或場合名稱"
                        className="w-full px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-amber-400 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* 星等評分 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      滿意度評分 *
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((starNum) => (
                        <button
                          key={starNum}
                          type="button"
                          onClick={() => setStars(starNum)}
                          className="p-1 text-stone-700 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star
                            size={28}
                            fill={starNum <= stars ? '#fbbf24' : 'none'}
                            className={starNum <= stars ? 'text-amber-400' : 'text-stone-700'}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono font-bold text-amber-400 ml-2">
                        {stars} 顆星 {stars === 5 ? '(完美滿意！)' : ''}
                      </span>
                    </div>
                  </div>

                  {/* 想對 La Cozzi 說的話 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                      想對 La Cozzi 說的話 *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="跟我們分享當天的感動、主唱樂手的互動，或是音樂為現場帶來的氛圍吧..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* 電子郵件（選填） */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                        電子郵件（選填）
                      </label>
                      <span className="text-[10px] text-stone-500 font-mono">
                        僅供樂團留存，絕不公開
                      </span>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* 送出按鈕 */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-organic bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? '送出中...' : '送出感動回饋 ✨'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 查看完整評價 Lightbox Modal */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="bg-stone-900 border-2 border-stone-800 rounded-organic p-6 md:p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedReview(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="關閉"
            >
              <X size={20} />
            </button>

            <Quote className="text-amber-500/20 mb-3" size={40} strokeWidth={1} />

            <div className="flex items-center space-x-3.5 mb-4">
              <div className="p-2.5 bg-stone-800/90 rounded-organic-2 border-2 border-stone-700/60 text-amber-400">
                <UserCircle size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-bold font-serif text-stone-100 text-lg leading-tight">{selectedReview.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {selectedReview.tag}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">{selectedReview.date}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">{renderStars(selectedReview.stars)}</div>

            <div className="text-stone-200 text-sm md:text-base leading-relaxed font-light whitespace-pre-line border-t border-stone-800/80 pt-4">
              {selectedReview.comment}
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500 font-mono">
              <span>La Cozzi 樂團 · 真實好評</span>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-organic text-xs font-bold transition-colors cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
