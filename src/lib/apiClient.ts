/**
 * apiClient.ts — 全局 API 拦截器
 * 自动处理 401/403/413/429 等 HTTP 状态码，并通过 sonner toast 给出星空紫风格的视觉反馈。
 */
import { toast } from "sonner";

export type ApiResponse<T = unknown> = {
  data: T | null;
  error: string | null;
  status: number;
};

/**
 * 全局 API 请求封装。遇到以下情况自动弹出 toast：
 * - 429: 操作过于频繁，请稍后重试
 * - 413: 提交的数据过大
 * - 401 / 403: 权限不足，请重新登录
 * - 5xx: 服务暂时不可用，请稍后重试
 */
export async function apiClient<T = unknown>(
  url: string,
  options?: RequestInit,
  suppressToastFor?: number[]
): Promise<ApiResponse<T>> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  } catch {
    toast.error("网络连接失败，请检查网络后重试", {
      description: url,
    });
    return { data: null, error: "网络连接失败", status: 0 };
  }

  let data: T | null = null;
  let errorText: string | null = null;

  try {
    const json = await response.json();
    if (response.ok) {
      data = json as T;
    } else {
      errorText = (json as { error?: string })?.error ?? null;
    }
  } catch {
    errorText = response.statusText || "响应格式错误";
  }

  const suppress = suppressToastFor ?? [];

  if (!response.ok && !suppress.includes(response.status)) {
    const status = response.status;
    if (status === 429) {
      toast.error("操作过于频繁，请稍后重试", {
        description: "服务器正在限制请求频率，请等待片刻后重试。",
      });
    } else if (status === 413) {
      toast.error("提交的数据过大", {
        description: "请减少上传内容的大小后重新提交。",
      });
    } else if (status === 401 || status === 403) {
      toast.error("权限不足，请重新登录", {
        description: "您的登录状态已过期或没有访问权限。",
      });
    } else if (status >= 500) {
      toast.error("服务暂时不可用，请稍后重试", {
        description: "服务器内部错误，我们已记录此问题。",
      });
    }
  }

  return { data, error: errorText, status: response.status };
}

/**
 * 快捷方法
 */
export const api = {
  get: <T = unknown>(url: string, suppress?: number[]) =>
    apiClient<T>(url, { method: "GET" }, suppress),

  post: <T = unknown>(url: string, body: unknown, suppress?: number[]) =>
    apiClient<T>(url, { method: "POST", body: JSON.stringify(body) }, suppress),

  patch: <T = unknown>(url: string, body: unknown, suppress?: number[]) =>
    apiClient<T>(url, { method: "PATCH", body: JSON.stringify(body) }, suppress),

  delete: <T = unknown>(url: string, suppress?: number[]) =>
    apiClient<T>(url, { method: "DELETE" }, suppress),
};
