'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  GalleryVerticalEnd,
  MessageSquareText,
  Radar,
  Newspaper,
  School,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Mail,
  IdCard,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/components/ui/cn';

type NavLeaf = { href: string; label: string; icon: LucideIcon; desc?: string };
type NavGroup = { label: string; items: NavLeaf[] };

/**
 * 导航信息架构：11 个平铺入口按用户心智聚合为 4 组。
 * 注意：仅重组「呈现与分组」，所有 href 保持原有 URL 不变。
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: '校友空间',
    items: [
      { href: '/alumni/radar', label: '星空通讯录', icon: Radar, desc: '校友大学城市分布地图' },
      { href: '/alumni/certificate', label: '电子校友证', icon: IdCard, desc: '生成专属纪念卡' },
      { href: '/alumni/achievements', label: '校友成就墙', icon: Award, desc: '升学・科研・职业足迹' },
      { href: '/alumni/stories', label: '燕中故事', icon: MessageSquareText, desc: '校友的奋斗与成长' },
      { href: '/alumni/memories', label: '燕中记忆', icon: GalleryVerticalEnd, desc: '校园时光珍贵影像' },
    ],
  },
  {
    label: '校园资讯',
    items: [
      { href: '/news', label: '新闻公告', icon: Newspaper, desc: '母校与校友会动态' },
      { href: '/events', label: '校友活动', icon: CalendarDays, desc: '线上线下交流聚会' },
    ],
  },
  {
    label: '资源',
    items: [
      { href: '/students', label: '在校生资源站', icon: BookOpen, desc: '升学参考与学长问答' },
      { href: '/teachers', label: '教师频道', icon: GraduationCap, desc: '师者寄语与风采' },
    ],
  },
  {
    label: '关于',
    items: [
      { href: '/about', label: '学校介绍', icon: School, desc: '航天特色与办学理念' },
      { href: '/contact', label: '联系我们', icon: Mail, desc: '联系窗口与投稿' },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isActive(pathname, item.href));
}

const JOIN_CTA =
  'inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted';

export default function MobileNav() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc 关闭抽屉 + Tab 焦点锁定
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    const timer = setTimeout(() => {
      drawerRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [open]);

  // 路由切换自动关闭抽屉与下拉
  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  // 桌面下拉：点击外部 / Esc 关闭
  useEffect(() => {
    if (!openGroup) return;
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openGroup]);

  // 抽屉打开时禁止背景滚动
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* ── 桌面端：Mega Menu 下拉 + CTA ───────────────── */}
      <nav
        ref={navRef}
        className="ml-8 hidden flex-1 items-center justify-end gap-1 xl:flex"
        role="navigation"
        aria-label="主导航"
      >
        {NAV_GROUPS.map((group) => {
          const active = groupIsActive(pathname, group);
          const expanded = openGroup === group.label;
          return (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpenGroup(group.label)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-haspopup="true"
                onClick={() => setOpenGroup(expanded ? null : group.label)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted',
                  active ? 'bg-brand/10 text-brand' : 'text-brand-fg/70 hover:text-brand',
                )}
              >
                {group.label}
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', expanded && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>

              {expanded ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 w-72 pt-2"
                >
                  <div className="overflow-hidden rounded-modal border border-line bg-surface/95 p-2 shadow-lg backdrop-blur-xl">
                    {group.items.map(({ href, label, icon: Icon, desc }) => {
                      const itemActive = isActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          role="menuitem"
                          aria-current={itemActive ? 'page' : undefined}
                          className={cn(
                            'flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                            itemActive ? 'bg-brand/10' : 'hover:bg-brand/5',
                          )}
                        >
                          <Icon
                            size={18}
                            className={cn('mt-0.5 shrink-0', itemActive ? 'text-brand' : 'text-brand/70')}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className={cn('block text-sm font-medium', itemActive ? 'text-brand' : 'text-brand-fg')}>
                              {label}
                            </span>
                            {desc ? (
                              <span className="mt-0.5 block text-xs text-brand-fg/50">{desc}</span>
                            ) : null}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <Link href="/?join=1" className={cn(JOIN_CTA, 'ml-2')}>
          加入我们
        </Link>
      </nav>

      {/* ── 移动端：汉堡按钮 ──────────────────────────── */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? '关闭导航菜单' : '打开导航菜单'}
        aria-expanded={open ? 'true' : 'false'}
        aria-controls="mobile-drawer"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-brand xl:hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted"
      >
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {/* ── 移动端：分组抽屉 ──────────────────────────── */}
      {open && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[60] bg-brand-fg/30 backdrop-blur-sm xl:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="导航菜单"
            className="fixed right-0 top-0 z-[60] flex h-full w-80 max-w-[88vw] flex-col border-l border-brand/15 bg-surface/95 p-5 backdrop-blur-xl shadow-2xl xl:hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand font-heading">导航菜单</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label="关闭导航菜单"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-fg/60 hover:bg-brand/10 hover:text-brand-fg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex-1 space-y-4 overflow-y-auto pr-1"
              role="navigation"
              aria-label="移动端导航"
            >
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-brand-fg/40">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const itemActive = isActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={itemActive ? 'page' : undefined}
                          onClick={() => {
                            setOpen(false);
                            toggleRef.current?.focus();
                          }}
                          className={cn(
                            'flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                            itemActive
                              ? 'bg-brand/10 text-brand font-semibold'
                              : 'text-brand-fg/80 hover:bg-brand/5 hover:text-brand',
                          )}
                        >
                          <Icon
                            size={18}
                            className={itemActive ? 'text-brand' : 'text-brand/60'}
                            aria-hidden="true"
                          />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-4 border-t border-line pt-4">
              <Link
                href="/?join=1"
                onClick={() => setOpen(false)}
                className={cn(JOIN_CTA, 'w-full')}
              >
                加入我们
              </Link>
              <p className="mt-3 text-center text-xs text-brand-fg/40">
                燕中校友数字母港 · 个人公益版
              </p>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
