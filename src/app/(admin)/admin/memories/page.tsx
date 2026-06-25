'use client';

import { useState, useRef } from 'react';
import { Pencil, Trash2, Camera, House, Landmark, LibraryBig, Mountain, Trees, ArrowUp, ArrowDown } from 'lucide-react';
import { useResource } from '@/hooks/useResource';

const ICONS = [
  { value: 'camera', label: '相机（默认）', icon: Camera },
  { value: 'house', label: '校门', icon: House },
  { value: 'landmark', label: '教学楼', icon: Landmark },
  { value: 'library', label: '图书馆', icon: LibraryBig },
  { value: 'mountain', label: '操场', icon: Mountain },
  { value: 'trees', label: '林荫道', icon: Trees },
];

type MemoryItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  icon: string;
  sortOrder: number;
};

const emptyForm = {
  title: '',
  subtitle: '',
  description: '',
  imagePath: '',
  imageAlt: '',
  icon: 'camera',
};

export default function AdminMemoriesPage() {
  // 数据层托管给 useResource，对接 /api/admin/memories，契约不变。
  const res = useResource<MemoryItem>({
    endpoint: '/api/admin/memories',
    listKey: 'items',
  });
  const items = res.items;
  const { loading, saving, error, setError } = res;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setUploadMsg('');
  };

  const openEdit = (item: MemoryItem) => {
    setForm({
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      imagePath: item.imagePath,
      imageAlt: item.imageAlt,
      icon: item.icon,
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('标题不能为空');
      return;
    }
    const ok = editingId
      ? await res.update(editingId, { ...form })
      : await res.create({ ...form });
    if (ok) resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记忆？')) return;
    await res.remove(id);
  };

  // 图片上传链路：经 /api/upload 自动裁切为 16:9（2752×1548），返回 url 写入表单。
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await uploadRes.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, imagePath: data.url }));
        setUploadMsg(`已上传: ${file.name} → ${data.filename}`);
      } else {
        throw new Error(data.error || '上传失败');
      }
    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setUploading(false);
      // 重置 file input，允许同名文件再次上传
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === items.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const a = items[idx];
    const b = items[swapIdx];
    await Promise.all([
      res.update(a.id, { sortOrder: b.sortOrder }),
      res.update(b.id, { sortOrder: a.sortOrder }),
    ]);
  };

  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-brand-fg">燕中记忆管理</h1>
      <p className="mt-1 text-sm text-brand-fg/60">管理文化长廊展示的校园记忆展品</p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">关闭</button>
        </div>
      )}

      {/* Form */}
      <div className="mt-6 rounded-card border border-brand/10 bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-brand-fg">
          {editingId ? '编辑记忆展品' : '新增记忆展品'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-fg">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input w-full"
              placeholder="如：校门与晨曦"
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-fg">副标题</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="input w-full"
              placeholder="如：入学第一张照片"
              disabled={saving}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-brand-fg">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full min-h-[80px]"
              placeholder="展品描述文字..."
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-fg">图片路径</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.imagePath}
                onChange={(e) => setForm({ ...form, imagePath: e.target.value })}
                className="input flex-1"
                placeholder="/memories/xxx.jpg 或上传"
                disabled={saving}
              />
              <label className="btn-secondary inline-flex cursor-pointer items-center gap-1 whitespace-nowrap">
                {uploading ? '上传中...' : '本地上传'}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {uploadMsg && (
              <p className="mt-1 text-xs text-green-600">{uploadMsg}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-fg">图片说明（alt）</label>
            <input
              type="text"
              value={form.imageAlt}
              onChange={(e) => setForm({ ...form, imageAlt: e.target.value })}
              className="input w-full"
              placeholder="图片文字描述"
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-fg">图标</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => {
                const Icon = ic.icon;
                const active = form.icon === ic.value;
                return (
                  <button
                    key={ic.value}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic.value })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition cursor-pointer ${
                      active
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-gray-200 text-gray-500 hover:border-brand/30'
                    }`}
                    title={ic.label}
                    disabled={saving}
                  >
                    <Icon size={14} />
                    {ic.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary cursor-pointer"
          >
            {saving ? '保存中...' : editingId ? '更新' : '新增'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="btn-secondary cursor-pointer" disabled={saving}>
              取消编辑
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">加载中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">暂无记忆展品，使用上方表单新增。</p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-4 rounded-card border border-gray-200 bg-surface p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-brand-fg">{item.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                    {item.icon}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{item.subtitle || '无副标题'}</p>
                <p className="mt-0.5 text-xs text-gray-400 truncate">
                  图片: {item.imagePath || '未设置'} · 排序: {item.sortOrder}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveItem(item.id, 'up')}
                  disabled={idx === 0}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand disabled:opacity-30 cursor-pointer"
                  title="上移"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveItem(item.id, 'down')}
                  disabled={idx === items.length - 1}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand disabled:opacity-30 cursor-pointer"
                  title="下移"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-brand/10 hover:text-brand cursor-pointer"
                  title="编辑"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
