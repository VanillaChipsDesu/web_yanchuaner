"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("请输入管理员账号和密码");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "账号或口令错误");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF5FF] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#7C3AED]/10 bg-white/60 p-8 backdrop-blur-xl shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED]/10">
            <Lock size={28} className="text-[#7C3AED]" />
          </div>
          <h1 className="font-heading text-xl font-bold text-[#4C1D95]">
            管理员登录
          </h1>
          <p className="mt-1 text-sm text-[#4C1D95]/60">
            使用管理员账号登录后台
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <ShieldAlert size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-[#4C1D95]"
            >
              管理员账号
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              className="input w-full"
              autoFocus
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[#4C1D95]"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="input w-full"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-6 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50 cursor-pointer font-medium"
          >
            {loading ? "验证中..." : "进入后台"}
          </button>
        </form>

        <div className="mt-5 border-t border-[#7C3AED]/10 pt-4">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#7C3AED]/50 transition hover:text-[#7C3AED]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded-sm"
          >
            <ArrowLeft size={13} />
            <span>返回普通口令入口</span>
          </a>
        </div>

        <p className="mt-4 text-center text-xs text-[#4C1D95]/40">
          燕中校友数字母港 · 管理后台
        </p>
        <p className="mt-3 text-center text-xs text-[#4C1D95]/40">
          想要获取后台账号或口令，请关注校友会微信公众号「燕中校友汇」
        </p>
      </div>
    </div>
  );
}
