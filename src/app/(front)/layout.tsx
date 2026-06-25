import Header from "@/components/Header";

export default function FrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* 导航栏 */}
      <Header />

      <main id="main" className="relative z-20 min-h-[calc(100vh-200px)]">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="glass relative z-10 border-t border-[#7C3AED]/10">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-sm text-[#7C3AED]/70 md:flex-row">
            <p>
              © 2025-2026 燕中校友数字母港（个人公益版）
            </p>
            <p>{"声明：个人公益、非官方、无盈利"}</p>
          </div>
          <div className="mt-2 flex justify-center">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="访问工信部备案系统"
              tabIndex={0}
              className="text-xs text-[#7C3AED]/40 transition hover:text-[#7C3AED]/60 focus:outline-none"
            >
              {"粤ICP备2026024784号-2"}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
