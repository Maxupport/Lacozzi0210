"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Columns,
  Edit3,
  Image as ImageIcon,
  Upload,
  Youtube,
  Tag,
  AlertCircle,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Link2,
} from 'lucide-react';
import { savePost } from '@/app/admin/actions/posts';
import MarkdownContent from '@/components/MarkdownContent';
import { slugify } from '@/lib/utils';
import type { PostStatus } from '@prisma/client';

export type PostEditorInitial = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  youtubeUrl: string;
  tags: string[];
  status: PostStatus;
};

export default function PostEditor({
  initial,
}: {
  initial?: PostEditorInitial;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [cover, setCover] = useState(initial?.cover || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl || '');
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<PostStatus>(initial?.status || 'DRAFT');

  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 當使用者輸入標題且 slug 尚未手動自訂時，自動帶入 slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initial?.id && (!slug || slug === slugify(title))) {
      setSlug(slugify(val));
    }
  };

  // 標籤新增
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // 封面圖上傳
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'covers');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || '封面圖上傳失敗');
      } else {
        setCover(data.url);
      }
    } catch {
      setErrorMsg('上傳失敗，請檢查網路連線');
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 內文圖片上傳並插入游標處
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'articles');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || '圖片上傳失敗');
      } else {
        insertText(`\n![${file.name.replace(/\.[^.]+$/, '')}](${data.url})\n`);
      }
    } catch {
      setErrorMsg('圖片上傳失敗');
    } finally {
      setUploadingInline(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = '';
    }
  };

  // 插入文字至 Markdown 游標處
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = before + (selected || '') + after;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  // 儲存
  const handleSave = async (targetStatus?: PostStatus) => {
    const finalStatus = targetStatus || status;
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    const res = await savePost({
      id: initial?.id,
      title,
      slug,
      excerpt,
      content,
      cover,
      youtubeUrl,
      tags,
      status: finalStatus,
    });

    setSaving(false);

    if (!res.ok) {
      setErrorMsg(res.error || '儲存失敗');
      return;
    }

    setSuccessMsg(finalStatus === 'PUBLISHED' ? '✨ 文章已成功發布！' : '草稿已儲存');
    setStatus(finalStatus);

    if (!initial?.id && res.post?.id) {
      router.push(`/admin/posts/${res.post.id}`);
      router.refresh();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* 頂部導航列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/posts"
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-900 rounded-organic transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black font-serif text-stone-100">
              {initial?.id ? '編輯文章' : '撰寫新文章'}
            </h1>
            <p className="text-xs text-stone-500 font-mono">
              {slug ? `網址：/blog/${slug}` : '尚未指定代稱'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {initial?.slug && status === 'PUBLISHED' && (
            <Link
              href={`/blog/${initial.slug}`}
              target="_blank"
              className="px-3.5 py-2 rounded-organic border border-stone-800 text-stone-300 hover:text-amber-300 hover:border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <span>前台檢視</span>
              <ExternalLink size={13} />
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="px-4 py-2 rounded-organic border-2 border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>儲存草稿</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="px-5 py-2 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-xs flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer disabled:opacity-50"
          >
            <Send size={14} />
            <span>{saving ? '處理中...' : status === 'PUBLISHED' ? '更新發布' : '立即發布'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-organic bg-rose-500/10 border-2 border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-organic bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-2">
          <span>{successMsg}</span>
        </div>
      )}

      {/* 主要中繼資訊欄位 */}
      <div className="bg-stone-900/40 border-2 border-stone-800 rounded-organic p-6 space-y-5">
        {/* 文章標題 */}
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
            文章標題 *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="請輸入吸引人的文章標題..."
            className="w-full px-4 py-3 bg-stone-950/80 border-2 border-stone-800 rounded-organic text-stone-100 font-serif font-black text-xl md:text-2xl placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* 網址代稱與 YouTube 影音 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              網址代稱 (Slug) *
            </label>
            <div className="flex items-center bg-stone-950/80 border-2 border-stone-800 rounded-organic px-3">
              <span className="text-xs text-stone-500 font-mono select-none">/blog/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="howtochooseurweddingband"
                className="w-full py-2.5 px-1 bg-transparent text-stone-100 text-sm font-mono placeholder-stone-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Youtube size={14} className="text-rose-500" />
              <span>YouTube 影片連結（可選）</span>
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 bg-stone-950/80 border-2 border-stone-800 rounded-organic text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* 封面圖片 */}
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <ImageIcon size={14} className="text-amber-400" />
            <span>封面圖片</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="輸入圖片公開網址，或點右側上傳..."
              className="flex-1 px-3.5 py-2.5 bg-stone-950/80 border-2 border-stone-800 rounded-organic text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500/60 font-mono text-xs"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />

            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-organic bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Upload size={14} />
              <span>{uploadingCover ? '上傳中...' : '上傳封面'}</span>
            </button>

            {cover && (
              <button
                type="button"
                onClick={() => setCover('')}
                className="text-xs text-rose-400 hover:underline px-2"
              >
                清除
              </button>
            )}
          </div>

          {cover && (
            <div className="mt-3 relative w-full max-w-sm h-36 rounded-organic overflow-hidden border border-stone-800 bg-stone-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="封面預覽" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* 標籤 */}
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Tag size={14} className="text-amber-400" />
            <span>標籤</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-400 transition-colors ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="輸入標籤後按 Enter（例如：婚禮音樂）"
              className="flex-1 px-3.5 py-2 bg-stone-950/80 border-2 border-stone-800 rounded-organic text-stone-100 text-xs placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-organic transition-colors cursor-pointer"
            >
              新增
            </button>
          </div>
        </div>

        {/* 摘要 */}
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
            文章摘要 (Excerpt)
          </label>
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="簡短描述文章重點，會顯示在文章卡片與 SEO 預覽中..."
            className="w-full px-3.5 py-2.5 bg-stone-950/80 border-2 border-stone-800 rounded-organic text-stone-200 text-xs placeholder-stone-600 focus:outline-none focus:border-amber-500/60 resize-none font-light leading-relaxed"
          />
        </div>
      </div>

      {/* 編輯器工具列與視圖切換 */}
      <div className="border-2 border-stone-800 rounded-organic bg-stone-900/60 overflow-hidden">
        {/* 工具列 Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-900 border-b border-stone-800">
          {/* 排版快捷工具 */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              title="粗體"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*')}
              title="斜體"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <Italic size={15} />
            </button>
            <span className="w-px h-4 bg-stone-800 mx-1"></span>
            <button
              type="button"
              onClick={() => insertText('\n## ', '\n')}
              title="二級標題"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <Heading2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertText('\n### ', '\n')}
              title="三級標題"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <Heading3 size={15} />
            </button>
            <span className="w-px h-4 bg-stone-800 mx-1"></span>
            <button
              type="button"
              onClick={() => insertText('\n> ', '\n')}
              title="引言"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <Quote size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertText('\n- ', '\n')}
              title="項目清單"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertText('\n1. ', '\n')}
              title="編號清單"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <ListOrdered size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertText('\n---\n\n')}
              title="分隔線"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <Minus size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertText('[連結文字](', ')')}
              title="連結"
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
            >
              <Link2 size={15} />
            </button>

            <span className="w-px h-4 bg-stone-800 mx-1"></span>

            {/* 插入圖片 */}
            <input
              ref={inlineImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInlineImageUpload}
            />
            <button
              type="button"
              disabled={uploadingInline}
              onClick={() => inlineImageInputRef.current?.click()}
              title="插入圖片"
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/10 rounded transition-colors border border-amber-500/30"
            >
              <ImageIcon size={14} />
              <span>{uploadingInline ? '上傳中...' : '插入圖片'}</span>
            </button>
          </div>

          {/* 視圖切換 */}
          <div className="inline-flex p-1 bg-stone-950 border border-stone-800 rounded-organic text-xs">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'edit' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
              }`}
              title="純編輯器"
            >
              <Edit3 size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'split' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
              }`}
              title="雙欄預覽"
            >
              <Columns size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'preview' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
              }`}
              title="純預覽"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        {/* 編輯與預覽區塊 */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-800 min-h-[600px]">
          {/* 左欄：Markdown 輸入區 */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className={`p-4 ${viewMode === 'edit' ? 'col-span-2' : ''}`}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在此開始撰寫 Markdown 內文...&#10;&#10;支援：&#10;• 二級標題 (## 標題)&#10;• 圖片 (![說明](url))&#10;• 粗體 (**文字**)&#10;• 只要一行貼上 YouTube 網址，前台會自動嵌入影片！"
                className="w-full h-full min-h-[560px] bg-transparent text-stone-100 placeholder-stone-600 focus:outline-none font-mono text-sm resize-none leading-relaxed"
              />
            </div>
          )}

          {/* 右欄：即時預覽 */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div
              className={`p-6 bg-stone-950/40 overflow-y-auto max-h-[700px] ${
                viewMode === 'preview' ? 'col-span-2' : ''
              }`}
            >
              <div className="text-xs font-mono text-amber-500/80 mb-4 pb-2 border-b border-stone-800 uppercase tracking-widest flex items-center justify-between">
                <span>即時排版預覽</span>
                <span className="text-stone-600 font-sans">（與前台呈現一致）</span>
              </div>

              {content ? (
                <article className="prose prose-invert prose-stone max-w-none prose-headings:font-serif prose-headings:font-black prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-img:rounded-organic-2 text-stone-300">
                  <MarkdownContent>{content}</MarkdownContent>
                </article>
              ) : (
                <div className="text-center py-24 text-stone-600 text-sm font-light">
                  在左側輸入文字即可在此即時預覽排版效果...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
