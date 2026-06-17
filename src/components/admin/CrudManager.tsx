'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/components/ui/cn';

/**
 * 字段配置：声明式描述一个表单字段，CrudManager 据此渲染输入控件。
 */
export type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'url';
  required?: boolean;
  placeholder?: string;
  /** select 类型的选项 */
  options?: { value: string; label: string }[];
  /** 占满整行（用于 textarea） */
  fullWidth?: boolean;
};

type FormValues = Record<string, string>;

/**
 * 通用后台 CRUD 管理器（纯展示 + 表单状态）。
 *
 * 业务数据流由 useResource 提供，此组件只负责：表单渲染、编辑态切换、列表渲染。
 * 把「fetch + loading + error」与「表单 + 列表 UI」彻底分离，
 * 让贡献者改样式时碰不到数据逻辑。
 */
export function CrudManager<T extends { id: string }>({
  title,
  subtitle,
  fields,
  items,
  loading,
  saving,
  error,
  setError,
  onCreate,
  onUpdate,
  onDelete,
  toForm,
  toPayload,
  validate,
  renderItem,
  emptyHint = '暂无数据，使用上方表单新增。',
  deleteConfirm = '确定删除这条记录？',
}: {
  title: string;
  subtitle?: string;
  fields: FieldConfig[];
  items: T[];
  loading: boolean;
  saving: boolean;
  error: string;
  /** 来自 useResource，可设置 / 清空错误信息 */
  setError: (msg: string) => void;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  /** 把一条记录映射为表单初值（编辑时用） */
  toForm: (item: T) => FormValues;
  /** 可选：提交前把表单值转换为 API payload（如把逗号分隔字符串转为数组） */
  toPayload?: (form: FormValues) => Record<string, unknown>;
  /** 可选：返回错误信息字符串则阻止提交 */
  validate?: (form: FormValues) => string | null;
  /** 列表项主体渲染（左侧信息区） */
  renderItem: (item: T) => React.ReactNode;
  emptyHint?: string;
  deleteConfirm?: string;
}) {
  const emptyForm: FormValues = Object.fromEntries(fields.map((f) => [f.name, '']));
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openEdit = (item: T) => {
    setForm({ ...emptyForm, ...toForm(item) });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (validate) {
      const msg = validate(form);
      if (msg) {
        setError(msg);
        return;
      }
    }
    const payload = toPayload ? toPayload(form) : form;
    const ok = editingId ? await onUpdate(editingId, payload) : await onCreate(payload);
    if (ok) resetForm();
  };

  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-brand-fg">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-brand-fg/60">{subtitle}</p> : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">
            关闭
          </button>
        </div>
      ) : null}

      {/* 表单卡片 */}
      <div className="mt-4 rounded-card border border-brand/10 bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-brand-fg">
          {editingId ? '编辑' : '新增'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={form[field.name] ?? ''}
              disabled={saving}
              onChange={(v) => setForm((prev) => ({ ...prev, [field.name]: v }))}
            />
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary cursor-pointer">
            {saving ? '保存中...' : editingId ? '更新' : '新增'}
          </button>
          {editingId ? (
            <button onClick={resetForm} className="btn-secondary cursor-pointer" disabled={saving}>
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      {/* 列表 */}
      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-400">加载中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">{emptyHint}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start gap-3 rounded-card border border-gray-200 bg-surface p-4 shadow-sm hover:shadow-md"
            >
              <div className="min-w-0 flex-1">{renderItem(item)}</div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openEdit(item)}
                  aria-label="编辑"
                  className="rounded p-1.5 text-gray-400 hover:bg-brand/10 hover:text-brand cursor-pointer"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(deleteConfirm)) onDelete(item.id);
                  }}
                  aria-label="删除"
                  className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FormField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const labelEl = (
    <label className="mb-1 block text-sm font-medium text-brand-fg">
      {field.label}
      {field.required ? ' *' : ''}
    </label>
  );

  const wrapperClass = field.type === 'textarea' || field.fullWidth ? 'md:col-span-2' : '';

  return (
    <div className={wrapperClass}>
      {labelEl}
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-full min-h-[120px]"
          placeholder={field.placeholder}
          disabled={disabled}
        />
      ) : field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-full"
          disabled={disabled}
        >
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'url' ? 'text' : field.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('input w-full')}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}
