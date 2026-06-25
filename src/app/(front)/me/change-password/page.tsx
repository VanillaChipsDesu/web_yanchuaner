"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push("/login");
      router.refresh();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/me/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("");
      await refresh();
      setCountdown(3);
    } else {
      setMessage(data.error || "修改失败");
    }
  }
  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <Link href="/me" className="mb-4 inline-flex text-sm text-brand hover:underline">
        ← 返回个人中心
      </Link>
      <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-surface/50 backdrop-blur-xl p-7">
        <h1 className="text-2xl font-bold">修改密码</h1>
        <input name="currentPassword" type="password" className="input w-full" placeholder="当前密码" required />
        <input name="newPassword" type="password" className="input w-full" placeholder="新密码（8-64 位）" minLength={8} maxLength={64} required />
        <input name="confirmPassword" type="password" className="input w-full" placeholder="确认新密码" minLength={8} maxLength={64} required />
        <button className="btn-primary w-full">修改密码</button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
      {countdown !== null ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-card border border-line bg-surface/90 p-7 text-center shadow-2xl">
            <p className="text-lg font-semibold text-brand-fg">
              密码修改成功，即将返回登录页面…
            </p>
            <p className="mt-3 text-3xl font-bold text-brand">{countdown}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
