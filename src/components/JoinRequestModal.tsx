"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";

type FormState = {
  name: string;
  cohort: string;
  contact: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  cohort: "",
  contact: "",
  message: "",
};

type SubmitResult = {
  role?: string;
  status?: string;
} | null;

export default function JoinRequestModal() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [result, setResult] = useState<SubmitResult>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // 支持从导航 CTA「加入我们」(/?join=1) 自动打开弹窗
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('join') === '1') {
        setOpen(true);
      }
    }
  }, []);

  // Esc 关闭 + 焦点锁定
  useEffect(() => {
    if (!open) return;

    const prevFocus = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        prevFocus?.focus();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'input, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    // 自动聚焦第一个输入框
    setTimeout(() => {
      modalRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to submit join request');
      }

      const data = await res.json();
      setResult(data.user ?? null);
      setSubmitted(true);
      setForm(initialState);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setSubmitted(false);
    setError(null);
    setResult(null);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开入轨联络舱"
        tabIndex={0}
        className="cosmic-card group flex min-h-[168px] flex-col items-center justify-center rounded-2xl border border-[#7C3AED]/25 bg-white/55 px-5 py-6 text-center backdrop-blur-md shadow-[0_0_15px_rgba(124,58,237,0.3)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-[#7C3AED]/50 hover:shadow-[0_0_24px_rgba(124,58,237,0.35)]"
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] shadow-[0_0_20px_rgba(124,58,237,0.25)] transition group-hover:shadow-[0_0_28px_rgba(124,58,237,0.4)]">
          <Send size={24} />
        </span>
        <p className="mt-4 text-base font-semibold text-[#4C1D95] font-heading">{"入轨联络舱"}</p>
        <p className="mt-1 text-xs text-[#4C1D95]/60">{"新增入站或更新大学 / 城市信息"}</p>
      </button>

      {open && (
        <div className="mobile-modal-shell fixed inset-0 z-[60] flex items-center justify-center px-4 py-10">
          <button type="button"
            aria-label={"关闭弹窗"}
            tabIndex={-1}
            className="absolute inset-0 bg-[#4C1D95]/20 backdrop-blur-xl cursor-pointer transition-all duration-300 focus:outline-none"
            onClick={closeModal}
          />

          <div ref={modalRef} role="dialog" aria-modal="true" aria-label="入轨联络舱"
            className="mobile-modal-panel safe-modal-panel relative z-10 w-full max-w-lg rounded-3xl border border-[#7C3AED]/20 bg-white/95 p-6 shadow-[0_0_60px_rgba(124,58,237,0.15)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-[#4C1D95] font-heading">{"入轨联络舱"}</h3>
              <button type="button"
                onClick={closeModal}
                aria-label="关闭弹窗"
                tabIndex={0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED] cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <X size={14} aria-hidden="true" />
                <span className="sr-only">关闭</span>
              </button>
            </div>

            <p className="mt-2 text-sm leading-6 text-[#4C1D95]/70">
              {"系统将自动匹配校友白名单。匹配成功后立即认证为「航天校友」；未命中时将进入人工审核队列。"}
            </p>

            {!submitted ? (
              <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-[#4C1D95]">{"姓名"}</span>
                  <input
                    required
                    aria-label="姓名"
                    tabIndex={0}
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="input w-full"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm text-[#4C1D95]">{"届别 / 班级"}</span>
                  <input
                    required
                    aria-label="届别或班级"
                    tabIndex={0}
                    value={form.cohort}
                    onChange={(event) => setForm((prev) => ({ ...prev, cohort: event.target.value }))}
                    className="input w-full"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm text-[#4C1D95]">{"联系方式"}</span>
                  <input
                    required
                    aria-label="联系方式"
                    tabIndex={0}
                    value={form.contact}
                    onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
                    placeholder={"如：微信 / QQ / 手机号"}
                    className="input w-full"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm text-[#4C1D95]">{"申请或信息更新内容"}</span>
                  <textarea
                    required
                    rows={4}
                    aria-label="申请或信息更新内容"
                    tabIndex={0}
                    value={form.message}
                    onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                    className="input w-full resize-none"
                  />
                </label>

                {error && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit"
                  disabled={loading}
                  aria-label="提交入轨申请"
                  tabIndex={0}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {"验证中..."}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {"提交入轨申请"}
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="mt-5 space-y-3" role="status" aria-live="polite">
                {result?.role === 'ALUMNI' ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm leading-6 text-emerald-700">
                    <p className="font-semibold text-emerald-800">{"白名单验证通过！"}</p>
                    <p className="mt-1">{"您的信息已匹配校友名册，身份已自动认证为「航天校友」。欢迎回家！"}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm leading-6 text-amber-700">
                    <p className="font-semibold text-amber-800">{"申请已提交"}</p>
                    <p className="mt-1">{"您的信息暂未匹配白名单，已进入人工审核队列。审核通过后将自动同步您的校友身份。"}</p>
                  </div>
                )}
                <button type="button"
                  onClick={closeModal}
                  className="btn-secondary w-full"
                >
                  {"关闭"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
