'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, ArrowLeft, Download, CalendarDays, Clock } from 'lucide-react';
import Link from 'next/link';

type Registration = {
  id: string;
  name: string;
  contact: string | null;
  message: string | null;
  createdAt: string;
};

type EventInfo = {
  id: string;
  title: string;
  eventDate: string;
  maxAttendees: number | null;
  registrationCount: number;
};

function toLocalDatetime(isoString: string): string {
  const d = new Date(isoString);
  const local = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const iso = local.toISOString();
  return iso.slice(0, 16);
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const INJECTION_RE = /^\s*[=+\-@]/;

function csvSafe(value: string): string {
  if (INJECTION_RE.test(value)) {
    return csvEscape("'" + value);
  }
  return csvEscape(value);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|\n\r]/g, '').slice(0, 40);
}

function generateCSV(registrations: Registration[]): string {
  const BOM = '﻿';
  const header = ['序号', '姓名', '联系方式', '留言', '报名时间'];
  const rows = registrations.map((r, i) => [
    String(i + 1),
    csvSafe(r.name),
    csvSafe(r.contact || ''),
    csvSafe(r.message || ''),
    csvEscape(new Date(r.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })),
  ]);
  const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
  return BOM + csv;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminEventRegistrationsPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${params.id}/registrations`);
      if (!res.ok) throw new Error('获取报名列表失败');
      const data = await res.json();
      setEvent(data.event);
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleExport = () => {
    if (!event) return;
    const csv = generateCSV(registrations);
    const filename = `报名名单_${sanitizeFilename(event.title)}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(csv, filename);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-[#7C3AED]" />
          <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">报名名单</h2>
        </div>
        <div className="flex gap-2">
          {registrations.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
            >
              <Download size={16} />
              导出 CSV
            </button>
          )}
          <Link
            href={`/admin/events/${params.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm text-[#4C1D95]/60 transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED] cursor-pointer"
          >
            <ArrowLeft size={16} />
            返回编辑
          </Link>
        </div>
      </div>

      {event && (
        <div className="mb-6 rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-4 backdrop-blur-sm">
          <h3 className="font-heading text-lg font-semibold text-[#4C1D95]">{event.title}</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#4C1D95]/70">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} className="text-[#7C3AED]" />
              {new Date(event.eventDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} className="text-[#7C3AED]" />
              报名：{event.registrationCount}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#4C1D95]/60">加载中...</div>
      ) : registrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#4C1D95]/60">
          <Users size={40} className="mb-3 opacity-30" />
          <p>暂无报名记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#7C3AED]/10 text-[#4C1D95]/60">
              <tr>
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">姓名</th>
                <th className="px-4 py-3 font-medium">联系方式</th>
                <th className="px-4 py-3 font-medium">留言</th>
                <th className="px-4 py-3 font-medium">报名时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7C3AED]/5">
              {registrations.map((r, i) => (
                <tr key={r.id} className="text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/5">
                  <td className="px-4 py-3 text-[#4C1D95]/40">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{r.name}</td>
                  <td className="px-4 py-3">{r.contact || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.message || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
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
