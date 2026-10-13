"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  ShieldCheck,
  User,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from '@/app/admin/actions/users';
import { formatDate } from '@/lib/utils';
import type { CurrentUser } from '@/lib/auth';
import type { Role } from '@prisma/client';

export type AdminUserItem = {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  failedLogins: number;
  lastLoginAt: string | null;
  createdAt: string;
  postCount: number;
};

export default function UserList({
  users,
  currentOwner,
}: {
  users: AdminUserItem[];
  currentOwner: CurrentUser;
}) {
  const router = useRouter();
  const [items, setItems] = useState<AdminUserItem[]>(users);

  useEffect(() => {
    setItems(users);
  }, [users]);

  // 新增帳號表單狀態
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('EDITOR');

  // 重設密碼狀態
  const [resetTarget, setResetTarget] = useState<AdminUserItem | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 新增帳號
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setBusyId('create');

    const res = await createUser({
      username: newUsername,
      displayName: newDisplayName,
      password: newPassword,
      role: newRole,
    });

    setBusyId(null);

    if (!res.ok) {
      setErrorMsg(res.error || '新增帳號失敗');
      return;
    }

    setSuccessMsg(`✨ 帳號「${newUsername}」建立成功！`);
    setNewUsername('');
    setNewDisplayName('');
    setNewPassword('');
    setNewRole('EDITOR');
    setShowAddModal(false);
    router.refresh();
  };

  // 啟用 / 停用
  const handleToggleActive = async (u: AdminUserItem) => {
    setErrorMsg('');
    setSuccessMsg('');
    const nextActive = !u.isActive;
    // 0ms 樂觀更新
    setItems((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, isActive: nextActive } : x))
    );
    setBusyId(u.id);

    const res = await updateUser({
      id: u.id,
      isActive: nextActive,
    });

    setBusyId(null);

    if (!res.ok) {
      setItems((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: u.isActive } : x))
      );
      setErrorMsg(res.error || '狀態更新失敗');
    } else {
      setSuccessMsg(`帳號「${u.username}」已${nextActive ? '啟用' : '停用'}`);
      router.refresh();
    }
  };

  // 切換權限角色
  const handleToggleRole = async (u: AdminUserItem) => {
    setErrorMsg('');
    setSuccessMsg('');
    const nextRole: Role = u.role === 'OWNER' ? 'EDITOR' : 'OWNER';
    // 0ms 樂觀更新
    setItems((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x))
    );
    setBusyId(u.id);

    const res = await updateUser({
      id: u.id,
      role: nextRole,
    });

    setBusyId(null);

    if (!res.ok) {
      setItems((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role: u.role } : x))
      );
      setErrorMsg(res.error || '權限更新失敗');
    } else {
      setSuccessMsg(`帳號「${u.username}」權限已更新為 ${nextRole === 'OWNER' ? '管理員' : '夥伴'}`);
      router.refresh();
    }
  };

  // 重設密碼
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    setErrorMsg('');
    setSuccessMsg('');
    setBusyId(resetTarget.id);

    const res = await resetUserPassword(resetTarget.id, resetPasswordVal);
    setBusyId(null);

    if (!res.ok) {
      setErrorMsg(res.error || '密碼重設失敗');
      return;
    }

    setSuccessMsg(`帳號「${resetTarget.username}」密碼已成功重設！`);
    setResetTarget(null);
    setResetPasswordVal('');
    router.refresh();
  };

  // 刪除帳號
  const handleDelete = async (u: AdminUserItem) => {
    if (!confirm(`確定要刪除帳號「${u.displayName} (${u.username})」嗎？此帳號撰寫的文章將會保留作者留空。`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    // 0ms 樂觀移除
    setItems((prev) => prev.filter((x) => x.id !== u.id));
    setBusyId(u.id);

    const res = await deleteUser(u.id);
    setBusyId(null);

    if (!res.ok) {
      setItems(users);
      setErrorMsg(res.error || '刪除失敗');
    } else {
      setSuccessMsg(`帳號「${u.username}」已刪除`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頂部操作與標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-3xl font-black font-serif text-stone-100 tracking-tight flex items-center space-x-2">
            <span>帳號管理</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              僅管理員可見
            </span>
          </h1>
          <p className="text-stone-400 text-sm mt-1 font-light">
            為樂團夥伴建立獨立登入帳號，共同編輯網站內容
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus size={18} />
          <span>建立新帳號</span>
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

      {/* 帳號清單表格 */}
      <div className="bg-stone-900/50 border-2 border-stone-800 rounded-organic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-900/90 border-b border-stone-800 text-xs text-stone-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4">成員資訊</th>
                <th className="py-3.5 px-4">權限角色</th>
                <th className="py-3.5 px-4">狀態</th>
                <th className="py-3.5 px-4">撰寫文章</th>
                <th className="py-3.5 px-4">最後登入</th>
                <th className="py-3.5 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {items.map((u) => {
                const isMe = u.id === currentOwner.id;
                const isBusy = busyId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-stone-900/40 transition-colors">
                    {/* 成員資訊 */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-organic bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                          {u.role === 'OWNER' ? (
                            <ShieldCheck size={18} className="text-amber-400" />
                          ) : (
                            <User size={18} className="text-stone-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-stone-100 flex items-center space-x-1.5">
                            <span>{u.displayName}</span>
                            {isMe && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                                目前使用者
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 font-mono">{u.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* 權限角色 */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                            u.role === 'OWNER'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-stone-800 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {u.role === 'OWNER' ? '管理員 (全部權限)' : '樂團夥伴 (僅自己文章)'}
                        </span>

                        {!isMe && (
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={isBusy}
                            title="切換角色"
                            className="text-[11px] text-stone-500 hover:text-amber-300 underline cursor-pointer"
                          >
                            改為{u.role === 'OWNER' ? '夥伴' : '管理員'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 狀態 */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => !isMe && handleToggleActive(u)}
                        disabled={isMe || isBusy}
                        title={isMe ? '不可停用自己' : u.isActive ? '點擊停用' : '點擊啟用'}
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                          u.isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        } ${!isMe ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                      >
                        {u.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{u.isActive ? '正常使用' : '已停用'}</span>
                      </button>
                    </td>

                    {/* 撰寫文章數 */}
                    <td className="py-4 px-4 text-xs font-mono text-stone-300">
                      {u.postCount} 篇
                    </td>

                    {/* 最後登入 */}
                    <td className="py-4 px-4 text-xs text-stone-500 font-mono">
                      {u.lastLoginAt ? (
                        <span className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{formatDate(u.lastLoginAt)}</span>
                        </span>
                      ) : (
                        '尚未登入過'
                      )}
                    </td>

                    {/* 操作 */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {/* 重設密碼按鈕 */}
                        <button
                          onClick={() => setResetTarget(u)}
                          disabled={isBusy}
                          title="重設密碼"
                          className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors cursor-pointer"
                        >
                          <KeyRound size={15} />
                        </button>

                        {/* 刪除按鈕 */}
                        {!isMe && (
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isBusy}
                            title="刪除帳號"
                            className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增帳號彈窗 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-800 rounded-organic p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
            <h2 className="text-xl font-bold font-serif text-stone-100 mb-4 flex items-center space-x-2">
              <UserPlus size={20} className="text-amber-400" />
              <span>建立新夥伴帳號</span>
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  登入帳號 (Email 或使用者名稱) *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="lynn@example.com"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  顯示名稱 (會出現在文章作者欄) *
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="佳霖 Lynn"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  初始密碼 (至少 8 字元) *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  權限角色
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                >
                  <option value="EDITOR">樂團夥伴 (EDITOR) - 只能新增與管理自己撰寫的文章</option>
                  <option value="OWNER">管理員 (OWNER) - 擁有帳號管理與全站所有內容權限</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-organic text-xs font-bold text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busyId === 'create'}
                  className="px-5 py-2 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-serif font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {busyId === 'create' ? '建立中...' : '確認建立'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 重設密碼彈窗 Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-800 rounded-organic p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
            <h2 className="text-xl font-bold font-serif text-stone-100 mb-2 flex items-center space-x-2">
              <KeyRound size={20} className="text-amber-400" />
              <span>重設帳號密碼</span>
            </h2>
            <p className="text-xs text-stone-400 mb-4">
              正在為 <strong className="text-stone-200">{resetTarget.displayName} ({resetTarget.username})</strong> 設定新密碼：
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  新密碼 (至少 8 字元) *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-800 rounded-organic text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget(null);
                    setResetPasswordVal('');
                  }}
                  className="px-4 py-2 rounded-organic text-xs font-bold text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busyId === resetTarget.id}
                  className="px-5 py-2 rounded-organic-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-serif font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  確認修改密碼
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
