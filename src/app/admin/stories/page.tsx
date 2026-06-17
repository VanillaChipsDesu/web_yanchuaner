'use client';

import { useResource } from '@/hooks/useResource';
import { CrudManager, type FieldConfig } from '@/components/admin/CrudManager';

type Story = {
  id: string; title: string; author: string; tags: string[]; body: string; date: string;
};

const FIELDS: FieldConfig[] = [
  { name: 'title', label: '标题', required: true },
  { name: 'author', label: '作者' },
  { name: 'tags', label: '标签（逗号分隔）', placeholder: '专业真相, 避坑指南' },
  { name: 'date', label: '日期', type: 'date' },
  { name: 'body', label: '正文', type: 'textarea', required: true },
];

function parseTags(raw: string): string[] {
  return raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}

export default function AdminStoriesPage() {
  const res = useResource<Story>({ endpoint: '/api/admin/stories', listKey: 'stories' });

  return (
    <CrudManager<Story>
      title="燕中故事管理"
      subtitle="管理校友故事投稿——增删改查"
      fields={FIELDS}
      items={res.items}
      loading={res.loading}
      saving={res.saving}
      error={res.error}
      setError={res.setError}
      onCreate={res.create}
      onUpdate={res.update}
      onDelete={res.remove}
      deleteConfirm="确定删除这个故事？"
      validate={(form) =>
        !form.title.trim() || !form.body.trim() ? '标题和正文不能为空' : null
      }
      toForm={(s) => ({
        title: s.title,
        author: s.author,
        tags: s.tags.join(', '),
        body: s.body,
        date: s.date,
      })}
      toPayload={(form) => ({
        title: form.title.trim(),
        author: form.author.trim(),
        tags: parseTags(form.tags),
        body: form.body.trim(),
        date: form.date || undefined,
      })}
      renderItem={(s) => (
        <>
          <h3 className="font-heading text-sm font-semibold text-brand-fg">{s.title}</h3>
          <p className="mt-1 text-xs text-gray-500">{s.author} · {s.date}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {s.tags.map((t) => (
              <span key={t} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                #{t}
              </span>
            ))}
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-gray-400">{s.body}</p>
        </>
      )}
    />
  );
}
