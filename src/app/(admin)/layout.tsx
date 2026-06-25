'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Award, BarChart3, Users, FileText, Newspaper, CalendarDays, BookUser, FileEdit, Images, Home, Menu, X, LogOut, GraduationCap, Feather, ChevronRight, User } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { useAuth } from '@/components/AuthProvider';

type NavItem = { href: string; label: string; icon: typeof Award; exact?: boolean };
type NavSection = { heading: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    heading: '概览',
    items: [{ href: '/admin', label: '控制面板', icon: BarChart3, exact: true }],
  },
  {
    heading: '审核',
    items: [
      { href: '/admin/users', label: '用户审核', icon: Users },
      { href: '/admin/user-claims', label: '旧资料认领', icon: Users },
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

function AdminBreadcrumbs() {
  const pathname = usePathname() || '/admin';
  const segments = pathname.split('/').filter(Boolean);

  const segmentLabels: Record<string, string> = {
    admin: '控制中心',
    users: '用户审核',
    'user-claims': '旧资料认领',
    posts: '内容审核',
    'alumni-corrections': '信息修改申请',
    news: '新闻管理',
    events: '活动管理',
    stories: '燕中故事',
    achievements: '校友成就墙',
    memories: '燕中记忆',
    teachers: '教师频道',
    content: '页面内容',
    alumni: '校友名单',
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-brand-fg/50 md:text-sm">
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        const label = segmentLabels[segment] || segment;
        const path = '/' + segments.slice(0, idx + 1).join('/');

        return (
          <div key={path} className="flex items-center gap-1.5 font-heading">
            {idx > 0 && <ChevronRight size={14} className="text-brand-fg/30" />}
            {isLast ? (
              <span className="font-semibold text-brand">{label}</span>
            ) : (
              <Link href={path} className="hover:text-brand-fg transition">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }, [router]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-[#03010b]/40">
      {/* Mobile Sidebar overlay / backdrop (Z-index: 40) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Z-index: 50) */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-[#05030e]/95 backdrop-blur-2xl transition-transform duration-300 md:translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
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

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.heading} className={cn(idx > 0 && 'mt-5')}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-brand/60">
                {section.heading}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl py-3 pr-3 text-sm transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                        active
                          ? 'pl-5 bg-brand/15 text-brand font-bold shadow-[inset_0_0_12px_rgba(167,139,250,0.15)]'
                          : 'pl-3 text-brand-fg/70 hover:bg-brand/10 hover:text-brand',
                      )}
                    >
                      {active && (
                        <span className="absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand" />
                      )}
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

        <div className="border-t border-white/5 px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-brand-fg/50 transition hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <LogOut size={18} className="shrink-0" />
            退出登录
          </button>
          <p className="mt-1 px-3 text-center text-[10px] text-brand-fg/30">Aerospace Alumni v0.1</p>
        </div>
      </aside>

      {/* Right-side content wrapper */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Admin Header (Z-index: 30) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#05030e]/85 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand/20 bg-brand/5 text-brand cursor-pointer md:hidden hover:bg-brand/10 transition"
              aria-label="打开侧边栏"
            >
              <Menu size={20} />
            </button>
            <AdminBreadcrumbs />
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile info */}
            <div className="flex items-center gap-2.5 rounded-full border border-white/5 bg-[#0a081a]/40 py-1 pl-1.5 pr-3 text-xs md:text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-brand shadow-inner">
                <User size={14} />
              </div>
              <div className="flex items-center gap-1.5 font-medium text-brand-fg">
                <span>{currentUser?.name || currentUser?.username || '管理员'}</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            {/* Quick home button */}
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-surface/30 px-4 py-2 text-xs font-semibold text-brand transition hover:border-[#7C3AED]/50 hover:bg-brand/5 focus:outline-none"
            >
              <Home size={14} />
              <span className="hidden sm:inline">前台首页</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main" className="flex-1 p-6 md:p-8">
          {children}
        </main>

        {/* Admin Footer */}
        <footer className="mt-auto py-6 border-t border-white/5 text-center">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-fg/30 transition hover:text-brand-fg/60 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            粤ICP备2026024784号-2
          </a>
        </footer>
      </div>
    </div>
  );
}
