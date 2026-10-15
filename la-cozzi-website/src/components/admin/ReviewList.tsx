"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  Star,
  CheckCircle2,
  Trash2,
  Edit,
  AlertCircle,
  Facebook,
} from 'lucide-react';
import {
  saveReview,
  toggleReviewStatus,
  deleteReview,
  type SaveReviewInput,
} from '@/app/admin/actions/reviews';
import type { ReviewStatus } from '@prisma/client';

export type AdminReviewItem = {
  id: string;
  name: string;
  email: string | null;
  tag: string;
  stars: number;
  comment: string;
  status: ReviewStatus;
  source: string;
  date: string | null;
  createdAt: string;
};

export default function ReviewList({ reviews }: { reviews: AdminReviewItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<AdminReviewItem[]>(reviews);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal 狀態
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 表單欄位
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('婚禮晚宴');
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [date, setDate] = useState('');
  const [source, setSource] = useState('FACEBOOK');
  const [status, setStatus] = useState<ReviewStatus>('APPROVED');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setItems(reviews);
  }, [reviews]);

  const pendingCount = items.filter((r) => r.status === 'PENDING').length;

  const filtered = items.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  const openNew = (defaultSource = 'FACEBOOK') => {
    setEditingId(null);
    setName('');
    setEmail('');
    setTag(defaultSource === 'FACEBOOK' ? 'Facebook 好評' : '婚禮晚宴');
    setStars(5);
    setComment('');
    setDate(new Date().toISOString().split('T')[0]);
    setSource(defaultSource);
    setStatus('APPROVED');
    setShowModal(true);
    setErrorMsg('');
  };

  const openEdit = (r: AdminReviewItem) => {
    setEditingId(r.id);
    setName(r.name);
    setEmail(r.email || '');
    setTag(r.tag);
    setStars(r.stars);
    setComment(r.comment);
    setDate(r.date || r.createdAt.split('T')[0]);
    setSource(r.source);
    setStatus(r.status);
    setShowModal(true);
    setErrorMsg('');
  };

  // 0ms 樂觀切換審核狀態
  const handleToggle = async (r: AdminReviewItem) => {
    const nextStatus: ReviewStatus = r.status === 'APPROVED' ? 'PENDING' : 'APPROVED';
    setItems((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, status: nextStatus } : x))
    );
    setErrorMsg('');

    const res = await toggleReviewStatus(r.id);

    if (!res.ok) {
      setItems((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, status: r.status } : x))
      );
      setErrorMsg(res.error || '狀態更新失敗');
    } else {
      setSuccessMsg(`好評「${r.name}」已${nextStatus === 'APPROVED' ? '核准公開' : '改為待審核'}`);
      router.refresh();
    }
  };

  // 0ms 樂觀刪除
  const handleDelete = async (r: AdminReviewItem) => {
    if (!confirm(`確定要刪除「${r.name}」的評價嗎？此動作無法復原。`)) return;

    setItems((prev) => prev.filter((x) => x.id !== r.id));
    setErrorMsg('');

    const res = await deleteReview(r.id);

    if (!res.ok) {
      setItems(reviews);
      setErrorMsg('刪除失敗');
    } else {
      setSuccessMsg(`好評已刪除`);
      router.refresh();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setBusy(true);

    const input: SaveReviewInput = {
      id: editingId || undefined,
      name,
      email: email || undefined,
      tag,
      stars,
      comment,
      date,
      source,
      status,
    };

    const res = await saveReview(input);
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res.error || '儲存失敗');
      return;
    }

    setSuccessMsg(`✨ 好評「${name}」已成功儲存！`);
    setShowModal(false);
    router.refresh();
  };

  const renderStars = (count: number) => (
    <div className="flex space-x-0.5 text-amber-400">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < count ? 'currentColor' : 'none'}
          className={i < count ? 'text-amber-400' : 'text-stone-700'}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 標題與建立按鈕 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-3xl font-black font-serif text-stone-100 tracking-tight flex items-center space-x-2">
            <span>好評管理</span>
            {pendingCount > 0 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 animate-pulse">
                {pendingCount} 則待審核
              </span>
            )}
          </h1>
          <p className="text-stone-400 text-sm mt-1 font-light">
            審核新人前台回饋，或從 Facebook / IG 轉移顧客口碑評價
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => openNew('FACEBOOK')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-organic bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 transition-colors cursor-pointer"
          >
            <Facebook size={14} className="text-blue-400" />
            <span>轉移 Facebook 評價</span>
          </button>
          <button
            type="button"
            onClick={() => openNew('MANUAL')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer"
          >
            <Plus size={16} />
            <span>新增好評</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-organic bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-organic bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 篩選標籤 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-organic text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-amber-500 text-stone-950 font-black'
              : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          全部 ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3.5 py-1.5 rounded-organic text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500 text-stone-950 font-black'
              : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          <span>待審核</span>
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping"></span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-3.5 py-1.5 rounded-organic text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'APPROVED'
              ? 'bg-amber-500 text-stone-950 font-black'
              : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          已公開 ({items.filter((r) => r.status === 'APPROVED').length})
        </button>
      </div>

      {/* 列表清單 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-organic border-2 border-dashed border-stone-800 text-stone-500 text-sm">
            沒有符合條件的評價
          </div>
        ) : (
          filtered.map((r) => {
            const isPending = r.status === 'PENDING';
            return (
              <div
                key={r.id}
                className={`p-5 rounded-organic border-2 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  isPending
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                    : 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold font-serif text-stone-100 text-base">
                      {r.name}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {r.tag}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                      {r.source === 'FACEBOOK' ? 'Facebook 轉移' : r.source === 'WEBSITE' ? '官網問卷' : '手動錄入'}
                    </span>
                    {isPending ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ● 待審核
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ✓ 已在官網公開
                      </span>
                    )}
                    {r.email && (
                      <span className="text-[11px] text-stone-500 font-mono">
                        (Email: {r.email})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {renderStars(r.stars)}
                    <span className="text-xs text-stone-500 font-mono">
                      {r.date || r.createdAt.split('T')[0]}
                    </span>
                  </div>

                  <p className="text-stone-300 text-sm font-light leading-relaxed whitespace-pre-line">
                    {r.comment}
                  </p>
                </div>

                {/* 操作動作 */}
                <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
                  <button
                    type="button"
                    onClick={() => handleToggle(r)}
                    className={`px-3.5 py-1.5 rounded-organic text-xs font-bold transition-all cursor-pointer ${
                      isPending
                        ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                    }`}
                  >
                    {isPending ? '✓ 核准公開' : '取消公開'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-organic transition-colors cursor-pointer"
                    title="編輯"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-organic transition-colors cursor-pointer"
                    title="刪除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 新增 / 編輯 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-800 rounded-organic p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95">
            <h2 className="text-xl font-bold font-serif text-stone-100 mb-4 flex items-center space-x-2">
              <MessageSquare size={20} className="text-amber-400" />
              <span>{editingId ? '編輯客戶好評' : '新增客戶好評'}</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    客戶稱呼 *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：新人 Max & Claire"
                    className="w-full px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    來源管道
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  >
                    <option value="FACEBOOK">Facebook 評價</option>
                    <option value="INSTAGRAM">Instagram 回饋</option>
                    <option value="WEBSITE">官網問卷</option>
                    <option value="MANUAL">其他 / 手動建立</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    場合或來源標籤
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="例：婚禮晚宴、Facebook 推薦"
                    className="w-full px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    顯示日期
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="YYYY-MM-DD (例 2024-05-20)"
                    className="w-full px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* 星等評分 */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  滿意星等 (1~5)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <button
                      key={starNum}
                      type="button"
                      onClick={() => setStars(starNum)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        size={22}
                        fill={starNum <= stars ? '#fbbf24' : 'none'}
                        className={starNum <= stars ? 'text-amber-400' : 'text-stone-700'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-400 ml-2">
                    {stars} 顆星
                  </span>
                </div>
              </div>

              {/* 評價內容 */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  評價心得內容 *
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="輸入或貼上 Facebook 顧客的真實回饋..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none leading-relaxed"
                />
              </div>

              {/* 顧客 Email（選填） */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  顧客 Email (選填，前台不公開)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  className="w-full px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* 發布狀態 */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  發布狀態
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'APPROVED'}
                      onChange={() => setStatus('APPROVED')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-stone-200">立即公開於官網</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'PENDING'}
                      onChange={() => setStatus('PENDING')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-stone-200">存為待審核</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-stone-400 hover:text-stone-200 text-xs font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-organic bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] disabled:opacity-50"
                >
                  {busy ? '儲存中...' : '確認儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
