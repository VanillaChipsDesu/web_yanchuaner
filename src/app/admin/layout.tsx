'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Users, FileText, Newspaper, CalendarDays, BookUser, FileEdit, Home, Menu, X, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }, [router]);

  const navItems = [
    { href: '/admin', label: '控制面板', icon: BarChart3 },
    { href: '/admin/users', label: '用户审核', icon: Users },
    { href: '/admin/posts', label: '内容审核', icon: FileText },
    { href: '/admin/news', label: '新闻管理', icon: Newspaper },
    { href: '/admin/events', label: '活动管理', icon: CalendarDays },
    { href: '/admin/alumni', label: '校友名单', icon: BookUser },
    { href: '/admin/alumni-corrections', label: '信息修改申请', icon: FileEdit },
    { href: '/', label: '返回母港', icon: Home },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF5FF]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#4C1D95]/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#7C3AED]/10 bg-white/95 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#7C3AED]/10 px-6 py-5">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-[#4C1D95] font-heading">
              燕中数字母港
            </h1>
            <p className="mt-1 text-xs text-[#4C1D95]/60">控制中心</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-[#4C1D95]/50 hover:text-[#4C1D95] md:hidden cursor-pointer"
            aria-label="关闭侧边栏"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <item.icon size={18} className="shrink-0 text-[#7C3AED]/70" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#7C3AED]/10 px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#4C1D95]/50 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <LogOut size={18} className="shrink-0" />
            退出登录
          </button>
          <p className="mt-1 px-3 text-xs text-[#4C1D95]/40">Aerospace Alumni v0.1</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:ml-64 md:p-8">
        {/* Mobile header with hamburger */}
        <div className="mb-4 flex items-center md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED] cursor-pointer"
            aria-label="打开侧边栏"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-sm font-semibold text-[#4C1D95] font-heading">控制中心</span>
        </div>
        {children}
      </main>
    </div>
  );
}
