"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { updateProfile } from '@/app/admin/actions/profile';

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('兩次輸入的新密碼不一致');
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      displayName: displayName.trim() || undefined,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });
    setSaving(false);

    if (!res.ok) {
      setErrorMsg(res.error || '更新失敗');
      return;
    }

    setSuccessMsg('✨ 個人資料與設定更新成功！');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-stone-800 pb-4">
        <h1 className="text-3xl font-black font-serif text-stone-100 tracking-tight">
          個人設定
        </h1>
        <p className="text-stone-400 text-sm mt-1 font-light">
          管理您的文章作者顯示名稱與登入密碼
        </p>
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

      <form onSubmit={handleSubmit} className="bg-stone-900/50 border-2 border-stone-800 rounded-organic p-6 md:p-8 space-y-6">
        {/* 顯示名稱 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1.5">
            <User size={14} className="text-amber-400" />
            <span>修改顯示名稱（文章作者欄位）</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="若不修改請留空"
            className="w-full px-4 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
          />
        </div>

        <div className="pt-4 border-t border-stone-800 space-y-4">
          <h2 className="text-sm font-bold font-serif text-stone-200 flex items-center space-x-1.5">
            <Lock size={15} className="text-amber-400" />
            <span>更換密碼</span>
          </h2>

          <div className="space-y-2">
            <label className="block text-xs text-stone-400">目前舊密碼</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="若要更換密碼請輸入舊密碼"
              className="w-full px-4 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs text-stone-400">新密碼（至少 8 字元）</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-stone-400">確認新密碼</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-sm flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.45)] cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? '儲存中...' : '儲存變更'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
