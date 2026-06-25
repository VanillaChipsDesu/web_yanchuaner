"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PageShell, GlassCard, Button } from "@/components/ui";
import { api } from "@/lib/apiClient";

function safeRedirect(value: string | null, fallback: string) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);
    try {
      // 429/413/401 等错误会由 apiClient 自动弹出 Toast，这里只处理业务逻辑
      const { data, error: apiError, status } = await api.post<{ role?: string; code?: string }>(
        "/api/auth/login",
        { username, password },
        [401, 403] // 401/403 由下面的 setError 处理，不重复弹 Toast
      );

      if (apiError || !data) {
        if (status === 403 && (data as any)?.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
        }
        throw new Error(apiError || "登录失败");
      }

      const fallback = data.role === "admin" ? "/admin" : "/";
      await refresh();
      router.push(safeRedirect(searchParams.get("redirect"), fallback));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell size="narrow" className="flex min-h-[70vh] items-center">
      <GlassCard className="w-full p-7">
        <h1 className="text-2xl font-bold text-brand-fg">登录</h1>
        <p className="mt-2 text-sm text-brand-fg/60">使用个人账号进入燕中数字母港。</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">
            用户名
            <input className="input mt-1 w-full" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label className="block text-sm">
            密码
            <input className="input mt-1 w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {needsVerification ? (
            <Link className="text-sm text-brand underline" href="/verify-email">
              重发验证邮件
            </Link>
          ) : null}
          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </Button>
        </form>
        <div className="mt-6 flex justify-between text-sm">
          <Link href="/register" className="text-brand hover:text-brand-fg transition-colors">注册账号</Link>
          <Link href="/reset-password" className="text-brand hover:text-brand-fg transition-colors">忘记密码</Link>
        </div>
      </GlassCard>
    </PageShell>
  );
}
