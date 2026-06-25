'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Edit2, Users, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';

type EventItem = {
  id: string;
  title: string;
  location: string | null;
  eventDate: string;
  status: string;
  _count: { registrations: number };
};

const statusLabel: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布' };

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EventItem | null>(null);

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.trim().toLowerCase();
    return events.filter((item) => item.title.toLowerCase().includes(q) || (item.location || '').toLowerCase().includes(q));
  }, [events, search]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/events${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/events/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }
      setEvents((prev) => prev.filter((e) => e.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err: any) {
      alert('删除失败: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'border-gray-200 text-gray-600 bg-gray-50',
      PUBLISHED: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${map[s] || ''}`}>
        {statusLabel[s] || s}
      </span>
    );
  };

  const filters = ['ALL', 'DRAFT', 'PUBLISHED'];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={28} className="text-[#7C3AED]" />
          <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">活动管理</h2>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer"
        >
          <Plus size={16} />
          创建活动
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
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
              {f === 'ALL' ? '全部' : statusLabel[f]}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4C1D95]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题或地点..."
            className="input w-48 py-1.5 pl-8 pr-3 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#4C1D95]/60">加载中...</div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#4C1D95]/60">
          <CalendarDays size={40} className="mb-3 opacity-30" />
          <p>暂无活动记录</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#4C1D95]/60">
          <CalendarDays size={40} className="mb-3 opacity-30" />
          <p>未找到匹配的活动</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#7C3AED]/10 text-[#4C1D95]/60">
              <tr>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">地点</th>
                <th className="px-4 py-3 font-medium">活动时间</th>
                <th className="px-4 py-3 font-medium">报名</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7C3AED]/5">
              {filteredEvents.map((item) => (
                <tr key={item.id} className="text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/5">
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{item.title}</td>
                  <td className="px-4 py-3">{item.location || '-'}</td>
                  <td className="px-4 py-3">
                    {new Date(item.eventDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-[#4C1D95]/60">
                      <Users size={14} />
                      {item._count?.registrations ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/events/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-2.5 py-1 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer"
                      >
                        <Edit2 size={14} />
                        编辑
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#7C3AED]/10 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#4C1D95] font-heading">确认删除</h3>
            <p className="mt-3 text-sm leading-6 text-[#4C1D95]/70">
              确定删除活动《{confirmDelete.title}》吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setConfirmDelete(null); setDeleting(null); }}
                disabled={!!deleting}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-[#4C1D95]/70 transition hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
