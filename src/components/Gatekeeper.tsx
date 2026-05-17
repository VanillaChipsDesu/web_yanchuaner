"use client";

import {
  AlertTriangle,
  LockKeyhole,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

const ACCESS_KEY = "yc_access_gate_status";
const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AccessPayload = {
  v: number;
  role: string;
  exp: number;
};

type GatekeeperProps = {
  children: ReactNode;
  initialIsVerified: boolean;
};

export default function Gatekeeper({
  children,
  initialIsVerified,
}: GatekeeperProps) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isVerified, setIsVerified] = useState(initialIsVerified);
  const [isChecked, setIsChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 客户端挂载后检查 localStorage 中的 token
  useEffect(() => {
    try {
      const serialized = window.localStorage.getItem(ACCESS_KEY);
      if (!serialized) {
        setIsChecked(true);
        return;
      }

      const parsed = JSON.parse(serialized) as AccessPayload;
      const isValid =
        parsed.v === 2 &&
        typeof parsed.exp === "number" &&
        parsed.exp > Date.now();
      setIsVerified(isValid);
      if (!isValid) {
        window.localStorage.removeItem(ACCESS_KEY);
      }
    } catch {
      window.localStorage.removeItem(ACCESS_KEY);
    } finally {
      setIsChecked(true);
    }
  }, []);

  const inputClassName = !errorText
    ? "w-full rounded-xl border border-cyan-300/35 bg-slate-950/60 px-4 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-300 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/35"
    : "w-full rounded-xl border gate-shake border-rose-400/80 bg-slate-950/60 px-4 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/35";

  const submitAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password) {
      setErrorText("请输入内测口令");
      setPassword("");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorText("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorText(data.error || "口令错误，请查阅校友群公告");
        setPassword("");
        inputRef.current?.focus();
        return;
      }

      // 服务端已设置 httpOnly cookie，客户端额外存储一份用于快速检查
      const payload: AccessPayload = {
        v: 2,
        role: "access",
        exp: Date.now() + ACCESS_TTL_MS,
      };
      const serialized = JSON.stringify(payload);
      window.localStorage.setItem(ACCESS_KEY, serialized);
      setIsVerified(true);
      window.location.reload();
    } catch {
      setErrorText("网络错误，请检查连接后重试");
      setPassword("");
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  if (!isChecked) {
    return null;
  }

  return (
    <>
      {children}

      {!isVerified && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(34,211,238,0.18),transparent_42%),radial-gradient(circle_at_82%_85%,rgba(56,189,248,0.16),transparent_46%)]" />
          <div className="pointer-events-none absolute inset-0 starfield opacity-75" />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-300/25 bg-slate-900/45 p-1 shadow-[0_0_55px_rgba(14,165,233,0.22)] backdrop-blur-xl">
            <div className="rounded-3xl border border-cyan-200/20 bg-slate-900/35 p-6 md:p-7">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/10 text-cyan-200">
                {isSubmitting ? (
                  <ShieldCheck size={18} />
                ) : (
                  <LockKeyhole size={18} />
                )}
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                ACCESS CONTROL
              </p>
              <h2 className="mt-2 text-2xl font-bold text-cyan-100 md:text-3xl">
                身份核验
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                请输入校友内测密码，解锁此星域入口。
              </p>

              <form className="mt-5 space-y-4" onSubmit={submitAccess}>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="内测口令"
                  autoComplete="off"
                  aria-label="输入内测口令"
                  tabIndex={0}
                  disabled={isSubmitting}
                  className={inputClassName}
                />

                {errorText ? (
                  <div className="inline-flex w-full items-start gap-2 rounded-xl border border-rose-400/45 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{errorText}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label="提交身份核验"
                  tabIndex={0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 hover:shadow-[0_0_20px_rgba(103,232,249,0.45)] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
                >
                  <ShieldCheck size={17} />
                  <span>
                    {isSubmitting ? "核验中..." : "接入母港"}
                  </span>
                </button>
              </form>

              {/* 管理员模式入口 */}
              <div className="mt-6 border-t border-cyan-300/10 pt-4 text-center">
                <a
                  href="/admin/login"
                  tabIndex={0}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-300/60 transition hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-sm"
                >
                  <UserCog size={13} />
                  <span>管理员模式</span>
                </a>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                想要获取口令，请关注校友会微信公众号「燕中校友汇」
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
