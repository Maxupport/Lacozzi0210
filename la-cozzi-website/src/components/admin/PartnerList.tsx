"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Music,
  User,
} from 'lucide-react';
import { savePartner, deletePartner, type SavePartnerInput } from '@/app/admin/actions/partners';

export type AdminPartnerItem = {
  id: string;
  name: string;
  role: string;
  description: string[];
  photo: string | null;
  content: string | null;
  order: number;
  isPublished: boolean;
};

export default function PartnerList({ partners }: { partners: AdminPartnerItem[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<AdminPartnerItem[]>(partners);

  useEffect(() => {
    setItems(partners);
  }, [partners]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [photo, setPhoto] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(true);

  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const openNew = () => {
    setEditingId(null);
    setName('');
    setRole('');
    setDescriptionText('');
    setPhoto('');
    setContent('');
    setOrder(partners.length);
    setIsPublished(true);
    setShowModal(true);
  };

  const openEdit = (p: AdminPartnerItem) => {
    setEditingId(p.id);
    setName(p.name);
    setRole(p.role);
    setDescriptionText(p.description.join('\n'));
    setPhoto(p.photo || '');
    setContent(p.content || '');
    setOrder(p.order);
    setIsPublished(p.isPublished);
    setShowModal(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'partners');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || '照片上傳失敗');
      } else {
        setPhoto(data.url);
      }
    } catch {
      setErrorMsg('照片上傳失敗');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setBusy(true);

    const description = descriptionText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const input: SavePartnerInput = {
      id: editingId || undefined,
      name,
      role,
      description,
      photo,
      content,
      order: Number(order) || 0,
      isPublished,
    };

    const res = await savePartner(input);
    setBusy(false);

    if (!res.ok) {
      setErrorMsg(res.error || '儲存失敗');
      return;
    }

    setSuccessMsg(`✨ 夥伴「${name}」資料已成功儲存！`);
    setShowModal(false);
    router.refresh();
  };

  const handleDelete = async (p: AdminPartnerItem) => {
    if (!confirm(`確定要刪除夥伴「${p.name}」嗎？此動作無法復原。`)) return;
    setErrorMsg('');
    setSuccessMsg('');
    // 0ms 樂觀移除
    setItems((prev) => prev.filter((x) => x.id !== p.id));
    const res = await deletePartner(p.id);
    if (!res.ok) {
      setItems(partners);
      setErrorMsg('刪除失敗');
    } else {
      setSuccessMsg(`夥伴「${p.name}」已刪除`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-3xl font-black font-serif text-stone-100 tracking-tight flex items-center space-x-2">
            <span>夥伴管理</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              前台 /partners
            </span>
          </h1>
          <p className="text-stone-400 text-sm mt-1 font-light">
            維護 La Cozzi 合作夥伴、樂團藝術家與專業團隊陣容
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>新增夥伴</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-organic bg-rose-500/10 border-2 border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-organic bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 夥伴卡片列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-stone-900/50 border-2 border-stone-800 rounded-organic p-5 flex flex-col justify-between group hover:border-amber-500/40 transition-all space-y-4"
          >
            <div className="flex items-start space-x-4">
              {/* 照片 */}
              <div className="w-16 h-16 rounded-organic-2 overflow-hidden bg-stone-800 border-2 border-stone-700 shrink-0 relative flex items-center justify-center">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-stone-600" />
                )}
              </div>

              {/* 姓名與身分 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[11px] font-bold font-serif px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {p.role || '夥伴'}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    p.isPublished ? 'text-emerald-400' : 'text-stone-500'
                  }`}>
                    {p.isPublished ? '● 公開' : '○ 隱藏'}
                  </span>
                </div>
                <h3 className="font-bold font-serif text-stone-100 text-lg truncate">
                  {p.name}
                </h3>
                <span className="text-xs text-stone-500 font-mono">排序：{p.order}</span>
              </div>
            </div>

            {/* 說明要點 */}
            {p.description.length > 0 && (
              <ul className="text-xs text-stone-400 space-y-1 font-light line-clamp-3">
                {p.description.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            )}

            {/* 操作按鈕 */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-800/80">
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-organic bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit size={13} />
                <span>編輯</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(p)}
                className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-organic transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 新增 / 編輯 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-800 rounded-organic p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95">
            <h2 className="text-xl font-bold font-serif text-stone-100 mb-4 flex items-center space-x-2">
              <Music size={20} className="text-amber-400" />
              <span>{editingId ? '編輯夥伴資料' : '新增夥伴'}</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    夥伴姓名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="佳霖 Lynn"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    角色稱號 *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="主唱 / 婚禮顧問"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              {/* 照片上傳 */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  夥伴照片
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="圖片網址或由右側上傳..."
                    className="flex-1 px-3.5 py-2 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-xs font-mono focus:outline-none"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-organic bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={13} />
                    <span>{uploadingPhoto ? '上傳中...' : '上傳'}</span>
                  </button>
                </div>
              </div>

              {/* 簡介要點 */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  簡介要點（一行一項）
                </label>
                <textarea
                  rows={3}
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  placeholder="每行一個特點或經歷，例如：&#10;十餘年婚禮與商演主持經歷&#10;嗓音甜美溫暖，擅長中英流行曲目"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-xs focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* 詳細 Markdown 自我介紹 */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  詳細自介 (Markdown，可選)
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="展開更多關於此夥伴的故事與經歷..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-xs font-mono focus:outline-none"
                />
              </div>

              {/* 排序與是否公開 */}
              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    排序 (由小到大)
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none"
                  />
                </div>

                <div className="pt-5">
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-stone-300">公開顯示在前台</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-organic text-xs font-bold text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-serif font-black transition-all cursor-pointer disabled:opacity-50"
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
