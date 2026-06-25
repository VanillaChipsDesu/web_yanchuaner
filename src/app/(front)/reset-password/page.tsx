"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, GlassCard, Button } from "@/components/ui";

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const endpoint = token ? "/api/auth/reset-password" : "/api/auth/forgot-password";
    const payload = token
      ? { token, password: form.get("password"), confirmPassword: form.get("confirmPassword") }
      : { email: form.get("email") };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setMessage(response.ok ? data.message || "密码已重置，请重新登录。" : data.error || "操作失败");
  }

  return (
    <PageShell size="narrow" className="flex min-h-[60vh] items-center">
      <GlassCard className="w-full p-7">
        <form onSubmit={submit}>
          <h1 className="text-2xl font-bold text-brand-fg">{token ? "重置密码" : "忘记密码"}</h1>
          <div className="mt-5 space-y-4">
            {token ? (
              <>
                <input name="password" type="password" className="input w-full" placeholder="新密码（8-64 位）" required minLength={8} maxLength={64} />
                <input name="confirmPassword" type="password" className="input w-full" placeholder="确认新密码" required minLength={8} maxLength={64} />
              </>
            ) : (
              <input name="email" type="email" className="input w-full" placeholder="注册邮箱" required />
            )}
            <Button type="submit" variant="primary" className="w-full mt-2">{token ? "重置密码" : "发送重置邮件"}</Button>
            {message ? <p className="mt-4 text-sm text-brand-fg/70">{message}</p> : null}
          </div>
        </form>
      </GlassCard>
    </PageShell>
  );
}
