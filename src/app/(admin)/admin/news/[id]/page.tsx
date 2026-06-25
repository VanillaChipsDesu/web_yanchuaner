'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Newspaper, ArrowLeft, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminNewsEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    imageUrl: '',
    status: 'DRAFT',
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`/api/admin/news/${params.id}`);
        if (!res.ok) throw new Error('获取新闻失败');
        const data = await res.json();
        const n = data.news;
        setForm({
          title: n.title || '',
          summary: n.summary || '',
          content: n.content || '',
          imageUrl: n.imageUrl || '',
          status: n.status || 'DRAFT',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
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
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
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
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/news/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新失败');
      }
      router.push('/admin/news');
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
          <Newspaper size={28} className="text-[#7C3AED]" />
          <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">编辑新闻</h2>
        </div>
        <Link
          href="/admin/news"
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

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-6 backdrop-blur-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">标题 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="input w-full"
            placeholder="新闻标题"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">摘要</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            className="input w-full"
            rows={3}
            placeholder="新闻摘要（可选）"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4C1D95]">正文 *</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            className="input w-full"
            rows={12}
            placeholder="新闻正文（支持 HTML）"
          />
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
            {form.imageUrl && (
              <span className="text-sm text-[#4C1D95]/60">{form.imageUrl}</span>
            )}
          </div>
          {form.imageUrl && (
            <div className="flex items-center gap-4">
              <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-[#7C3AED]/10">
                <Image
                  src={form.imageUrl}
                  alt="封面预览"
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
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
            href="/admin/news"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm text-[#4C1D95]/60 transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED] cursor-pointer"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
