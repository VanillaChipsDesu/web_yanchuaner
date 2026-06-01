'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CalendarDays, ArrowLeft, Upload, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function toLocalDatetime(isoString: string): string {
  const d = new Date(isoString);
  const local = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const iso = local.toISOString();
  return iso.slice(0, 16);
}

function toISODatetime(localValue: string): string {
  return new Date(localValue + '+08:00').toISOString();
}

export default function AdminEventsEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    location: '',
    eventDate: '',
    endDate: '',
    coverImage: '',
    maxAttendees: '',
    status: 'DRAFT',
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/admin/events/${params.id}`);
        if (!res.ok) throw new Error('获取活动失败');
        const data = await res.json();
        const e = data.event;
        setForm({
          title: e.title || '',
          summary: e.summary || '',
          content: e.content || '',
          location: e.location || '',
          eventDate: e.eventDate ? toLocalDatetime(e.eventDate) : '',
          endDate: e.endDate ? toLocalDatetime(e.endDate) : '',
          coverImage: e.coverImage || '',
          maxAttendees: e.maxAttendees ? String(e.maxAttendees) : '',
          status: e.status || 'DRAFT',
        });
        setRegistrationCount(e._count?.registrations ?? 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [params.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm((prev) => ({ ...prev, coverImage: data.url }));
    } catch (err: any) {
      alert('上传失败: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('标题和正文不能为空');
      return;
    }

    const body: Record<string, any> = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      content: form.content.trim(),
      location: form.location.trim() || null,
      eventDate: toISODatetime(form.eventDate),
      coverImage: form.coverImage.trim() || null,
      status: form.status,
    };

    body.endDate = form.endDate ? toISODatetime(form.endDate) : null;
    body.maxAttendees = form.maxAttendees !== '' ? parseInt(form.maxAttendees, 10) : null;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新失败');
      }
      router.push('/admin/events');
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#4C1D95]/60">加载中...</div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={28} className="text-[#7C3AED]" />
          <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">编辑活动</h2>
        </div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm text-[#4C1D95]/60 transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED] cursor-pointer"
        >
          <ArrowLeft size={16} />
          返回列表
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#4C1D95]/80">
            <Users size={18} className="text-[#7C3AED]" />
            <span>
              当前报名人数：{registrationCount}
              {form.maxAttendees ? ` / ${form.maxAttendees} 人` : " / 不限"}
            </span>
          </div>
          <Link
            href={`/admin/events/${params.id}/registrations`}
            className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-2.5 py-1 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer"
          >
            <Users size={14} />
            查看报名名单
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-6 backdrop-blur-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">标题 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="input w-full"
            placeholder="活动标题"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">摘要</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            className="input w-full"
            rows={3}
            placeholder="活动摘要（可选）"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">正文 *</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            className="input w-full"
            rows={12}
            placeholder="活动详情（支持 HTML）"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">活动时间 *</label>
            <input
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">结束时间</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">地点</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              className="input w-full"
              placeholder="活动地点"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">报名人数上限</label>
            <input
              type="number"
              min="1"
              value={form.maxAttendees}
              onChange={(e) => setForm((prev) => ({ ...prev, maxAttendees: e.target.value }))}
              className="input w-full"
              placeholder="留空表示不限制"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">封面图片</label>
          <div className="flex items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10">
              <Upload size={16} />
              {uploading ? '上传中...' : '选择图片'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {form.coverImage && (
              <span className="text-sm text-[#4C1D95]/60">{form.coverImage}</span>
            )}
          </div>
          {form.coverImage && (
            <div className="flex items-center gap-4">
              <Image
                src={form.coverImage}
                alt="封面预览"
                fill
                className="h-32 w-48 rounded-lg border border-[#7C3AED]/10 object-cover"
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-600 transition hover:bg-rose-100 cursor-pointer"
              >
                移除封面
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">状态</label>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="input w-full"
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-6 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? '提交中...' : '保存修改'}
          </button>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm text-[#4C1D95]/60 transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED] cursor-pointer"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
