'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 后台资源 CRUD 数据层 Hook。
 *
 * 职责单一：封装「列表加载 + 增 / 改 / 删 + loading/error/saving 状态」，
 * 对接现有 /api/admin/* 接口，不改变任何请求契约。
 *
 * 设计目的（DX）：把数据拉取逻辑从页面组件里剥离出来，让 UI 组件只负责渲染。
 * 新贡献者改样式时不会误触 fetch / 鉴权相关代码。
 *
 * @example
 * const res = useResource<Story>({
 *   endpoint: '/api/admin/stories',
 *   listKey: 'stories',
 * });
 * res.items, res.loading, res.error, res.saving
 * await res.create(payload); await res.update(id, payload); await res.remove(id);
 */
export type UseResourceOptions = {
  /** 集合端点，如 '/api/admin/stories'。创建用 POST 此端点，更新/删除用 `${endpoint}/${id}`。 */
  endpoint: string;
  /** 列表响应里数组所在的字段名，如 'stories' / 'sections'。 */
  listKey: string;
  /** 可选：列表请求的查询串，如 'page=teachers'（会拼到 endpoint 后）。 */
  listQuery?: string;
  /** 可选：创建时附加到 body 的固定字段，如 { page: 'teachers' }。 */
  createDefaults?: Record<string, unknown>;
  /** 可选：是否在挂载时自动加载，默认 true。 */
  autoLoad?: boolean;
};

export type UseResourceResult<T> = {
  items: T[];
  loading: boolean;
  saving: boolean;
  error: string;
  setError: (msg: string) => void;
  reload: () => Promise<void>;
  create: (payload: Record<string, unknown>) => Promise<boolean>;
  update: (id: string, payload: Record<string, unknown>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function useResource<T = unknown>({
  endpoint,
  listKey,
  listQuery,
  createDefaults,
  autoLoad = true,
}: UseResourceOptions): UseResourceResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const listUrl = listQuery ? `${endpoint}?${listQuery}` : endpoint;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(listUrl);
      if (!res.ok) throw new Error(await parseError(res, '加载失败'));
      const data = await res.json();
      setItems(data[listKey] || []);
    } catch (e: any) {
      setError(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [listUrl, listKey]);

  useEffect(() => {
    if (autoLoad) reload();
  }, [autoLoad, reload]);

  const create = useCallback(
    async (payload: Record<string, unknown>): Promise<boolean> => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...createDefaults, ...payload }),
        });
        if (!res.ok) throw new Error(await parseError(res, '保存失败'));
        await reload();
        return true;
      } catch (e: any) {
        setError(e?.message || '保存失败');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [endpoint, createDefaults, reload],
  );

  const update = useCallback(
    async (id: string, payload: Record<string, unknown>): Promise<boolean> => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch(`${endpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseError(res, '保存失败'));
        await reload();
        return true;
      } catch (e: any) {
        setError(e?.message || '保存失败');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [endpoint, reload],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setError('');
      try {
        const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await parseError(res, '删除失败'));
        await reload();
        return true;
      } catch (e: any) {
        setError(e?.message || '删除失败');
        return false;
      }
    },
    [endpoint, reload],
  );

  return { items, loading, saving, error, setError, reload, create, update, remove };
}
