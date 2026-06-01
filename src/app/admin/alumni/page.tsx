'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookUser,
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type AlumniItem = {
  id: string;
  name: string;
  graduationClass: string | null;
  tags: string | null;
  createdAt: string;
};

type ImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
};

const PAGE_SIZE = 50;

function csvEscape(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  // 防 Excel 公式注入
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  // 含逗号、换行、双引号需要用双引号包裹
  if (val.includes(',') || val.includes('\n') || val.includes('\r') || val.includes('"')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function alumniCSVContent(rows: AlumniItem[]): string {
  const header = '姓名,届别,标签';
  const lines = rows.map((r) =>
    [r.name, r.graduationClass || '', r.tags || ''].map(csvEscape).join(','),
  );
  return '﻿' + header + '\n' + lines.join('\n');
}

export default function AdminAlumniPage() {
  const [alumni, setAlumni] = useState<AlumniItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // 新增/编辑 modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<AlumniItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // CSV 导入
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (search.trim()) params.set('q', search.trim());
      if (classFilter.trim()) params.set('graduationClass', classFilter.trim());
      const res = await fetch(`/api/admin/alumni?${params}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setAlumni(data.alumni || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, classFilter]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  // 搜索防抖
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  // 打开新增
  const openAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormClass('');
    setFormTags('');
    setFormError('');
    setShowForm(true);
  };

  // 打开编辑
  const openEdit = (item: AlumniItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormClass(item.graduationClass || '');
    setFormTags(item.tags || '');
    setFormError('');
    setShowForm(true);
  };

  // 保存
  const handleSave = async () => {
    const name = formName.trim();
    if (!name || name.length > 50) {
      setFormError('姓名不能为空且不超过50字');
      return;
    }
    const gradClass = formClass.trim();
    if (gradClass.length > 50) {
      setFormError('届别不超过50字');
      return;
    }
    const tags = formTags.trim();
    if (tags.length > 500) {
      setFormError('标签不超过500字');
      return;
    }

    setFormSaving(true);
    setFormError('');
    try {
      const url = editingId
        ? `/api/admin/alumni/${editingId}`
        : '/api/admin/alumni';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, graduationClass: gradClass || null, tags: tags || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }
      setShowForm(false);
      fetchAlumni();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/alumni/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');
      setDeleteTarget(null);
      fetchAlumni();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // CSV 导入
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/alumni/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setImportResult(data);
      if (res.ok) fetchAlumni();
    } catch {
      setImportResult({ imported: 0, skipped: 0, failed: 1, errors: ['导入请求失败'] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // CSV 导出
  const handleExport = () => {
    const csv = alumniCSVContent(alumni);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `alumni-roster-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-[#4C1D95]">校友名单</h1>
          <p className="mt-0.5 text-sm text-[#4C1D95]/60">
            共 {total} 条记录
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAdd}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            <Plus size={16} />
            新增
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            <Download size={16} />
            导出
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C3AED]/40"
          />
          <input
            type="text"
            placeholder="搜索校友..."
            aria-label="搜索校友"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input w-full pl-9"
          />
        </div>
        <input
          type="text"
          placeholder="按届别筛选"
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPage(1);
          }}
          className="input w-32"
        />
      </div>

      {/* 导入结果 */}
      {importResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>
                导入完成：{importResult.imported} 条新增，{importResult.skipped} 条跳过
                {importResult.failed > 0 && `，${importResult.failed} 条错误`}
              </span>
            </div>
            <button
              onClick={() => setImportResult(null)}
              aria-label="关闭导入结果"
              className="cursor-pointer text-emerald-500 hover:text-emerald-700"
            >
              <X size={16} />
            </button>
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-emerald-700/70">
              {importResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/60 backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#7C3AED]/40" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-rose-600">
            <AlertTriangle size={16} />
            {error}
            <button type="button" onClick={fetchAlumni} className="ml-2 underline cursor-pointer">
              重试
            </button>
          </div>
        ) : alumni.length === 0 ? (
          <div className="py-16 text-center">
            <BookUser size={36} className="mx-auto text-[#7C3AED]/20" />
            <p className="mt-3 text-sm text-[#4C1D95]/40">
              {search || classFilter ? '未找到匹配的校友' : '暂无校友数据'}
            </p>
            {!search && !classFilter && (
              <button
                onClick={openAdd}
                className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#7C3AED]/60 hover:text-[#7C3AED]"
              >
                <Plus size={14} />
                新增第一条校友
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#7C3AED]/10 text-left text-xs text-[#4C1D95]/50">
                <th className="px-4 py-3 font-medium">姓名</th>
                <th className="px-4 py-3 font-medium">届别</th>
                <th className="px-4 py-3 font-medium">标签</th>
                <th className="px-4 py-3 font-medium">添加时间</th>
                <th className="w-24 px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {alumni.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#7C3AED]/5 transition hover:bg-[#7C3AED]/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{item.name}</td>
                  <td className="px-4 py-3 text-[#4C1D95]/60">{item.graduationClass || '-'}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-[#4C1D95]/60">
                    {item.tags || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#4C1D95]/40">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="inline-flex cursor-pointer items-center rounded-lg p-1.5 text-[#7C3AED]/50 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                        title="编辑"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex cursor-pointer items-center rounded-lg p-1.5 text-rose-400/60 transition hover:bg-rose-50 hover:text-rose-600"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-[#7C3AED]/60 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-[#4C1D95]/60">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-[#7C3AED]/60 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-[#4C1D95]/20 backdrop-blur-sm"
            onClick={() => !formSaving && setShowForm(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[#7C3AED]/10 bg-white p-6 shadow-xl">
            <button
              onClick={() => !formSaving && setShowForm(false)}
              aria-label="关闭表单"
              className="absolute right-4 top-4 cursor-pointer text-[#4C1D95]/40 hover:text-[#4C1D95]"
            >
              <X size={18} />
            </button>
            <h2 className="font-heading text-lg font-bold text-[#4C1D95]">
              {editingId ? '编辑校友' : '新增校友'}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#4C1D95]">姓名 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input w-full"
                  placeholder="请输入姓名"
                  disabled={formSaving}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#4C1D95]">届别</label>
                <input
                  type="text"
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  className="input w-full"
                  placeholder="例如：2020届"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#4C1D95]">标签</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="input w-full"
                  placeholder="格式：大学 | 专业 | 城市"
                  disabled={formSaving}
                />
                <p className="mt-1 text-xs text-[#4C1D95]/40">
                  格式建议：大学名 | 专业名 | 城市名（用 | 分隔）
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  disabled={formSaving}
                  className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm text-[#4C1D95]/60 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={formSaving}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50"
                >
                  {formSaving && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? '保存' : '新增'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-[#4C1D95]/20 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[#4C1D95]">确认删除</h2>
                <p className="mt-1 text-sm leading-6 text-[#4C1D95]/60">
                  确定要删除 <strong>{deleteTarget.name}</strong>
                  {deleteTarget.graduationClass ? `（${deleteTarget.graduationClass}）` : ''}
                  的校友信息吗？此操作不可撤销。
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm text-[#4C1D95]/60 transition hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
