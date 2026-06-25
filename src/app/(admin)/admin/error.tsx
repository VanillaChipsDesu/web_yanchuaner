"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">后台异常</p>
        <p className="mt-3 text-sm leading-6 text-amber-700">后台页面暂时无法加载，请刷新重试。</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm text-amber-700 transition hover:bg-amber-100 cursor-pointer">重试</button>
          <Link href="/admin" className="btn-secondary text-sm">返回控制面板</Link>
        </div>
      </div>
    </div>
  );
}
