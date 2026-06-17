'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Award, BarChart3, Users, FileText, Newspaper, CalendarDays, BookUser, FileEdit, Images, Home, Menu, X, LogOut, GraduationCap, Feather } from 'lucide-react';
import { cn } from '@/components/ui/cn';

type NavItem = { href: string; label: string; icon: typeof Award; exact?: boolean };
type NavSection = { heading: string; items: NavItem[] };

/**
 * 后台导航：按职能分组（概览 / 审核 / 内容运营 / 站点配置）。
 * 仅重组导航的「分组呈现」，所有 href 与鉴权逻辑保持不变。
 */
const NAV_SECTIONS: NavSection[] = [
  {
    heading: '概览',
    items: [{ href: '/admin', label: '控制面板', icon: BarChart3, exact: true }],
  },
  {
    heading: '审核',
    items: [
      { href: '/admin/users', label: '用户审核', icon: Users },
      { href: '/admin/posts', label: '内容审核', icon: FileText },
      { href: '/admin/alumni-corrections', label: '信息修改申请', icon: FileEdit },
    ],
  },
  {
    heading: '内容运营',
    items: [
      { href: '/admin/news', label: '新闻管理', icon: Newspaper },
      { href: '/admin/events', label: '活动管理', icon: CalendarDays },
      { href: '/admin/stories', label: '燕中故事', icon: Feather },
      { href: '/admin/achievements', label: '校友成就墙', icon: Award },
      { href: '/admin/memories', label: '燕中记忆', icon: Images },
    ],
  },
  {
    heading: '站点配置',
    items: [
      { href: '/admin/teachers', label: '教师频道', icon: GraduationCap },
      { href: '/admin/content', label: '页面内容', icon: FileEdit },
      { href: '/admin/alumni', label: '校友名单', icon: BookUser },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }, [router]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-surface-muted">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-brand-fg/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-brand/10 bg-surface/95 backdrop-blur-xl transition-transform duration-300 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-brand/10 px-6 py-5">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-brand-fg font-heading">
              燕中数字母港
            </h1>
            <p className="mt-1 text-xs text-brand-fg/60">控制中心</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-brand-fg/50 hover:text-brand-fg md:hidden cursor-pointer"
            aria-label="关闭侧边栏"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-fg/40">
                {section.heading}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                        active
                          ? 'bg-brand/10 text-brand font-semibold'
                          : 'text-brand-fg/70 hover:bg-brand/10 hover:text-brand',
                      )}
                    >
                      <item.icon
                        size={18}
                        className={active ? 'shrink-0 text-brand' : 'shrink-0 text-brand/70'}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-brand/10 px-3 py-3">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-fg/70 transition hover:bg-brand/10 hover:text-brand cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Home size={18} className="shrink-0" />
            返回母港
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-brand-fg/50 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <LogOut size={18} className="shrink-0" />
            退出登录
          </button>
          <p className="mt-1 px-3 text-xs text-brand-fg/40">Aerospace Alumni v0.1</p>
        </div>
      </aside>

      {/* Main content */}
      <main id="main" className="flex-1 p-4 md:ml-64 md:p-8">
        {/* Mobile header with hamburger */}
        <div className="mb-4 flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-brand cursor-pointer"
            aria-label="打开侧边栏"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-sm font-semibold text-brand-fg font-heading">控制中心</span>
        </div>
        {children}
      </main>
    </div>
  );
}
