"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, GlassCard, Button } from "@/components/ui";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/graduation-classes")
      .then((res) => res.json())
      .then((data) => setClasses(data.graduationClasses || []))
      .catch(() => setClasses([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const payload = Object.fromEntries(form.entries());
    payload.claimOldProfile = form.get("claimOldProfile") === "on" ? "true" : "";
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          claimOldProfile: form.get("claimOldProfile") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "注册失败");
      setMessage(
        data.emailSent
          ? "账号已创建，验证邮件已发送，请查收。"
          : "账号已创建，但邮件发送失败，请稍后重新发送。",
      );
      formEl.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell size="narrow">
      <GlassCard className="p-7">
        <h1 className="text-2xl font-bold text-brand-fg">注册校友账号</h1>
        <p className="mt-2 text-sm text-brand-fg/60">加入数字母港。邮箱验证与校友认证相互独立。</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm">用户名<input name="username" className="input mt-1 w-full" minLength={3} maxLength={32} required /></label>
          <label className="text-sm">邮箱<input name="email" type="email" className="input mt-1 w-full" required /></label>
          <label className="text-sm">密码<input name="password" type="password" className="input mt-1 w-full" minLength={8} maxLength={64} required /></label>
          <label className="text-sm">确认密码<input name="confirmPassword" type="password" className="input mt-1 w-full" minLength={8} maxLength={64} required /></label>
          <label className="text-sm">真实姓名<input name="name" defaultValue={searchParams.get("name") || ""} className="input mt-1 w-full" maxLength={64} required /></label>
          <label className="text-sm">届别
            <input name="graduationClass" defaultValue={searchParams.get("graduationClass") || ""} list="graduation-classes" className="input mt-1 w-full" maxLength={32} />
            <datalist id="graduation-classes">{classes.map((item) => <option key={item} value={item} />)}</datalist>
          </label>
          <label className="text-sm">班级<input name="className" className="input mt-1 w-full" maxLength={64} /></label>
          <label className="text-sm">联系方式（可选）<input name="contact" defaultValue={searchParams.get("contact") || ""} className="input mt-1 w-full" maxLength={128} /></label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input name="claimOldProfile" type="checkbox" />
            我曾通过入轨联络舱提交过申请，需要人工认领旧资料
          </label>
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}
          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}
          <Button type="submit" variant="primary" className="md:col-span-2 mt-2" disabled={loading}>
            {loading ? "创建中…" : "创建账号"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-brand-fg/60">已有账号？ <Link href="/login" className="text-brand hover:text-brand-fg transition-colors">去登录</Link></p>
      </GlassCard>
    </PageShell>
  );
}
