"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function EditProfilePage() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    fetch("/api/me/profile").then((res) => res.json()).then((data) => setProfile(data.user));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      setProfile(data.user);
      setMessage("");
      setShowSuccess(true);
      await refresh();
      setTimeout(() => setShowSuccess(false), 1800);
    } else {
      setMessage(data.error || "更新失败");
    }
  }
  if (!profile) return <p className="p-8">加载中…</p>;
  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <Link href="/me" className="mb-4 inline-flex text-sm text-brand hover:underline">
        ← 返回个人中心
      </Link>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-brand/15 bg-white/75 p-7">
        <h1 className="text-2xl font-bold">编辑资料</h1>
        <p className="text-sm text-brand-fg/60">姓名、邮箱、届别和班级属于身份信息，暂不支持修改。</p>
        <label className="block text-sm font-medium text-brand-fg">
          姓名
          <input name="name" className="input mt-1 w-full" value={profile.name || ""} disabled />
        </label>
        <label className="block text-sm font-medium text-brand-fg">
          邮箱
          <input name="email" type="email" className="input mt-1 w-full" value={profile.email || ""} disabled />
        </label>
        <label className="block text-sm font-medium text-brand-fg">
          用户名
          <input name="username" className="input mt-1 w-full" defaultValue={profile.username || ""} placeholder="用户名" minLength={3} maxLength={32} required />
        </label>
        <label className="block text-sm font-medium text-brand-fg">
          届别
          <input name="graduationClass" className="input mt-1 w-full" value={profile.graduationClass || ""} disabled />
        </label>
        <label className="block text-sm font-medium text-brand-fg">
          班级
          <input name="className" className="input mt-1 w-full" value={profile.className || ""} disabled />
        </label>
        <label className="block text-sm font-medium text-brand-fg">
          联系方式
          <input name="contact" className="input mt-1 w-full" defaultValue={profile.contact || ""} placeholder="联系方式" />
        </label>
        <button className="btn-primary w-full">保存</button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
      {showSuccess ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-brand-fg/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-brand/15 bg-white p-7 text-center shadow-xl">
            <p className="text-lg font-semibold text-brand-fg">资料已更新</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
