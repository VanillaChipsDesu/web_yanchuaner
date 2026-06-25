"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");
  
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [message, setMessage] = useState(token ? "正在验证您的邮箱凭证，请稍候…" : "");

  useEffect(() => {
    if (!token) return;
    
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (ok) {
          setStatus("success");
          setMessage("您的邮箱已成功验证，现在可以登录并开始探索我们的校友网络。");
        } else {
          setStatus("error");
          setMessage(data.error || "验证链接已失效或无效。");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("网络异常，无法连接到验证服务器，请稍后重试。");
      });
  }, [token]);

  async function resend(event: FormEvent) {
    event.preventDefault();
    setStatus("verifying");
    setMessage("正在发送验证邮件，请稍候…");
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "验证邮件已成功发送，请检查您的收件箱。");
      } else {
        setStatus("error");
        setMessage(data.error || "发送验证邮件失败，请检查邮箱地址或稍后重试。");
      }
    } catch {
      setStatus("error");
      setMessage("网络连接失败，请检查网络设置。");
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] text-center select-none">
      {/* 状态图标 */}
      <div className="flex justify-center mb-6">
        {status === "verifying" && (
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
        )}
        {status === "success" && (
          <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
        )}
        {status === "error" && (
          <XCircle className="w-16 h-16 text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.5)]" />
        )}
        {status === "idle" && (
          <Mail className="w-16 h-16 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
        )}
      </div>

      {/* 渐变标题 */}
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mt-2 font-heading">
        {status === "idle" && "发送验证邮件"}
        {status === "verifying" && "正在验证邮箱"}
        {status === "success" && "邮箱验证成功"}
        {status === "error" && "验证失败"}
      </h1>

      {/* 柔和说明文字 */}
      {message && (
        <p className="text-purple-300/70 mt-4 max-w-sm leading-relaxed text-sm md:text-base">
          {message}
        </p>
      )}

      {/* 验证重发单栏表单 */}
      {status === "idle" && (
        <form onSubmit={resend} className="mt-8 w-full space-y-4">
          <input
            type="email"
            className="w-full px-4 py-3 rounded-xl bg-[#0f0a1d]/60 border border-purple-500/30 text-purple-100 placeholder-purple-300/40 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all duration-300 text-center"
            placeholder="请输入注册邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 cursor-pointer">
            重新发送验证邮件
          </button>
          <Link
            href="/login"
            className="block text-sm text-purple-300/50 hover:text-purple-300 transition-colors pt-2"
          >
            返回登录
          </Link>
        </form>
      )}

      {/* 交互闭环导航 (登录/重试) */}
      {(status === "success" || status === "error") && (
        <div className="flex flex-col items-center gap-4 mt-6">
          <Link
            href="/login"
            className="mt-6 px-8 py-3 rounded-full border border-purple-500/50 text-purple-100 hover:bg-purple-500/20 hover:border-purple-400 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 cursor-pointer"
          >
            前往登录
          </Link>
          {status === "error" && (
            <button
              onClick={() => {
                setStatus("idle");
                setMessage("");
              }}
              className="text-sm text-purple-300/50 hover:text-purple-300 transition-colors cursor-pointer"
            >
              重新发送验证邮件
            </button>
          )}
        </div>
      )}
    </section>
  );
}
