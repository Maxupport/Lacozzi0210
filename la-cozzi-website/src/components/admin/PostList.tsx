"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  Clock,
  Youtube,
  AlertCircle,
} from 'lucide-react';
import { deletePost, togglePostStatus } from '@/app/admin/actions/posts';
import { formatDate } from '@/lib/utils';
import type { CurrentUser } from '@/lib/auth';

export type AdminPostItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover: string | null;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  youtubeUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  authorId: string | null;
  authorName: string | null;
};

export default function PostList({
  posts,
  currentUser,
}: {
  posts: AdminPostItem[];
  currentUser: CurrentUser;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [onlyMine, setOnlyMine] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = posts.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (onlyMine && p.authorId !== currentUser.id) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (post: AdminPostItem) => {
    if (!confirm(`確定要刪除文章「${post.title}」嗎？此動作無法復原。`)) return;
    setBusyId(post.id);
    setErrorMsg('');
    const res = await deletePost(post.id);
    setBusyId(null);
    if (!res.ok) {
      setErrorMsg(res.error || '刪除失敗');
    } else {
      router.refresh();
    }
  };

  const handleToggle = async (post: AdminPostItem) => {
    setBusyId(post.id);
    setErrorMsg('');
    const res = await togglePostStatus(post.id);
    setBusyId(null);
    if (!res.ok) {
      setErrorMsg(res.error || '狀態更新失敗');
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頂部操作與標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-3xl font-black font-serif text-stone-100 tracking-tight">
            文章管理
          </h1>
          <p className="text-stone-400 text-sm mt-1 font-light">
            管理樂團官方部落格專欄與幕後深度文章
          </p>
        </div>

        <Link
          href="/admin/posts/new"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>撰寫新文章</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-organic bg-rose-500/10 border-2 border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 搜尋與篩選列 */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋標題、代稱、標籤或摘要..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-900/80 border-2 border-stone-800 rounded-organic text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 狀態切換 */}
          <div className="inline-flex p-1 bg-stone-900 border border-stone-800 rounded-organic text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                statusFilter === 'ALL' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              全部 ({posts.length})
            </button>
            <button
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                statusFilter === 'PUBLISHED' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              已發布 ({posts.filter((p) => p.status === 'PUBLISHED').length})
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                statusFilter === 'DRAFT' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              草稿 ({posts.filter((p) => p.status === 'DRAFT').length})
            </button>
          </div>

          {/* 僅自己 */}
          <button
            onClick={() => setOnlyMine(!onlyMine)}
            className={`px-3.5 py-1.5 rounded-organic border text-xs font-bold transition-colors ${
              onlyMine
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            只看我的文章
          </button>
        </div>
      </div>

      {/* 文章清單 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-stone-800 rounded-organic bg-stone-900/30">
          <p className="text-stone-400 font-serif font-bold text-lg mb-2">沒有找到相符的文章</p>
          <p className="text-stone-500 text-xs font-light mb-6">點擊上方按鈕開始撰寫第一篇文章！</p>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-organic bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
          >
            <Plus size={14} />
            <span>開始寫作</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => {
            const canManage = currentUser.role === 'OWNER' || post.authorId === currentUser.id;
            const isBusy = busyId === post.id;

            return (
              <div
                key={post.id}
                className="bg-stone-900/50 border-2 border-stone-800 hover:border-stone-700/80 rounded-organic p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* 左側資訊 */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 狀態標籤 */}
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono tracking-wider ${
                        post.status === 'PUBLISHED'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {post.status === 'PUBLISHED' ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>已發布</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          <span>草稿</span>
                        </>
                      )}
                    </span>

                    {/* YouTube 影片標示 */}
                    {post.youtubeUrl && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
                        <Youtube size={12} />
                        <span>影音</span>
                      </span>
                    )}

                    {/* Slug */}
                    <span className="text-xs font-mono text-stone-500">
                      /{post.slug}
                    </span>
                  </div>

                  {/* 標題 */}
                  <h3 className="text-lg font-black font-serif text-stone-100 group-hover:text-amber-400 transition-colors">
                    <Link href={`/admin/posts/${post.id}`}>{post.title}</Link>
                  </h3>

                  {/* 摘要 */}
                  {post.excerpt && (
                    <p className="text-xs text-stone-400 line-clamp-1 font-light">
                      {post.excerpt}
                    </p>
                  )}

                  {/* 中繼資訊：作者、時間、標籤 */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <User size={13} className="text-amber-500/70" />
                      <span>{post.authorName || '未指定'}</span>
                      {post.authorId === currentUser.id && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1 rounded">我</span>
                      )}
                    </span>

                    <span className="flex items-center space-x-1">
                      <Calendar size={13} />
                      <span>
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                    </span>

                    {post.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag size={13} />
                        <span>{post.tags.slice(0, 3).join(', ')}</span>
                        {post.tags.length > 3 && <span>+{post.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* 右側操作按鈕 */}
                <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
                  {/* 前台預覽 */}
                  {post.status === 'PUBLISHED' && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      title="在新分頁檢視前台"
                      className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-organic transition-colors"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  )}

                  {/* 切換發布狀態 */}
                  {canManage && (
                    <button
                      onClick={() => handleToggle(post)}
                      disabled={isBusy}
                      title={post.status === 'PUBLISHED' ? '轉為草稿（下架）' : '立即發布'}
                      className={`px-3 py-1.5 rounded-organic text-xs font-bold border transition-colors cursor-pointer ${
                        post.status === 'PUBLISHED'
                          ? 'border-stone-700 text-stone-400 hover:text-amber-300 hover:border-amber-500/40'
                          : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isBusy ? '更新中...' : post.status === 'PUBLISHED' ? '轉草稿' : '發布'}
                    </button>
                  )}

                  {/* 編輯 */}
                  {canManage && (
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-organic bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
                    >
                      <Edit size={14} />
                      <span>編輯</span>
                    </Link>
                  )}

                  {/* 刪除 */}
                  {canManage && (
                    <button
                      onClick={() => handleDelete(post)}
                      disabled={isBusy}
                      title="刪除文章"
                      className="p-2 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-organic transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
