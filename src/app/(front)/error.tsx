'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.1),transparent_40%),linear-gradient(to_bottom,#FAF5FF,#F3E8FF)] px-4 text-[#4C1D95]">
      <div className="max-w-xl rounded-3xl border border-[#7C3AED]/20 bg-white/70 p-8 text-center shadow-[0_0_40px_rgba(124,58,237,0.08)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-[#7C3AED]/60">SYSTEM ERROR</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#7C3AED] font-heading">页面出错了</h1>
        <p className="mt-3 text-sm leading-6 text-[#4C1D95]/70">抱歉，系统遇到了一个错误。请尝试刷新页面或返回首页。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-primary"
          >
            重试
          </button>
          <Link href="/" className="btn-secondary cursor-pointer">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
