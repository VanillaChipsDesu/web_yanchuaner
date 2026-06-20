'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

type UserRecord = {
  id: string;
  username: string | null;
  email: string | null;
  emailVerified: string | null;
  name: string | null;
  graduationClass: string | null;
  className: string | null;
  contact: string | null;
  role: string;
  status: string;
  accountStatus: string;
  claimedAt: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?status=${statusFilter}&limit=100`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const runAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
      fetchUsers();
    } catch (err: any) {
      alert('操作失败: ' + err.message);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'border-amber-200 text-amber-700 bg-amber-50',
      VERIFIED: 'border-emerald-200 text-emerald-700 bg-emerald-50',
      REJECTED: 'border-rose-200 text-rose-700 bg-rose-50',
    };
    const label: Record<string, string> = {
      PENDING: '待审',
      VERIFIED: '已认证',
      REJECTED: '已驳回',
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${map[s] || ''}`}>
        {label[s] || s}
      </span>
    );
  };

  const filters = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Users size={28} className="text-[#7C3AED]" />
        <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">用户审核</h2>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition cursor-pointer ${
              statusFilter === f
                ? 'border-[#7C3AED]/50 bg-[#7C3AED]/10 text-[#7C3AED]'
                : 'border-gray-200 text-[#4C1D95]/60 hover:border-[#7C3AED]/30'
            }`}
          >
            {f === 'ALL' ? '全部' : f === 'PENDING' ? '待审核' : f === 'VERIFIED' ? '已认证' : '已驳回'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#4C1D95]/60">加载中...</div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#4C1D95]/60">
          <Users size={40} className="mb-3 opacity-30" />
          <p>暂无匹配的用户记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#7C3AED]/10 text-[#4C1D95]/60">
              <tr>
                <th className="px-4 py-3 font-medium">姓名</th>
                <th className="px-4 py-3 font-medium">账号</th>
                <th className="px-4 py-3 font-medium">届别/班级</th>
                <th className="px-4 py-3 font-medium">邮箱状态</th>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7C3AED]/5">
              {users.map((user) => (
                <tr key={user.id} className="text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#4C1D95]">{user.name || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{user.username || '旧资料'}</p>
                    <p className="text-xs">{user.email || '-'}</p>
                  </td>
                  <td className="px-4 py-3">{[user.graduationClass, user.className].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-4 py-3">{user.emailVerified ? '已验证' : '未验证'}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{statusBadge(user.status)}<p className="mt-1 text-xs">{user.accountStatus}</p></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {user.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => runAction(user.id, 'approve-alumni')}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                          >
                            <UserCheck size={14} />
                            通过
                          </button>
                          <button
                            onClick={() => runAction(user.id, 'reject-alumni')}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                          >
                            <UserX size={14} />
                            驳回
                          </button>
                        </>
                      )}
                      {user.status === 'VERIFIED' && user.id !== currentUser?.id && (
                        <button
                          onClick={() => runAction(user.id, 'reject-alumni')}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                        >
                          <UserX size={14} />
                          撤销
                        </button>
                      )}
                      {user.status === 'REJECTED' && (
                        <button
                          onClick={() => runAction(user.id, 'approve-alumni')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                        >
                          <UserCheck size={14} />
                          重新通过
                        </button>
                      )}
                      <button
                        onClick={() => runAction(user.id, user.accountStatus === 'ACTIVE' ? 'disable-account' : 'enable-account')}
                        className="rounded-lg border px-2.5 py-1 text-xs"
                      >
                        {user.accountStatus === 'ACTIVE' ? '停用' : '启用'}
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => runAction(user.id, 'grant-admin')}
                          className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs text-violet-700 transition hover:bg-violet-100 cursor-pointer"
                        >
                          <ShieldCheck size={14} />
                          提升为管理员
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
