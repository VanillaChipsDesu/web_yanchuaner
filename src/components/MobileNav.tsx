'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
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
} from 'lucide-react';

const navItems = [
  { href: '/alumni/radar', label: '星空通讯录', icon: Radar },
  { href: '/alumni/certificate', label: '电子校友证', icon: IdCard },
  { href: '/alumni/stories', label: '燕中故事', icon: MessageSquareText },
  { href: '/alumni/memories', label: '燕中记忆', icon: GalleryVerticalEnd },
  { href: '/news', label: '新闻公告', icon: Newspaper },
  { href: '/events', label: '校友活动', icon: CalendarDays },
  { href: '/teachers', label: '教师频道', icon: GraduationCap },
  { href: '/students', label: '在校生', icon: BookOpen },
  { href: '/about', label: '学校介绍', icon: School },
  { href: '/contact', label: '联系我们', icon: Mail },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileNav() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Esc 关闭 + Tab 焦点锁定
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

  // 路由切换自动关闭抽屉
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav
        className="hidden items-center gap-0.5 lg:flex"
        role="navigation"
        aria-label="主导航"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={label}
              href={href}
              aria-label={`导航 ${label}`}
              aria-current={active ? 'page' : undefined}
              tabIndex={0}
              className={[
                'group relative inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]',
                active
                  ? 'bg-[#7C3AED]/10 text-[#7C3AED]'
                  : 'text-[#4C1D95]/70 hover:text-[#7C3AED]',
              ].join(' ')}
            >
              <Icon
                size={14}
                className="transition-transform group-hover:scale-110"
                aria-hidden="true"
              />
              <span className="relative">
                {label}
                <span
                  className={[
                    'absolute -bottom-1 left-0 h-[2px] bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)] transition-all duration-300',
                    active ? 'w-full' : 'w-0 group-hover:w-full',
                  ].join(' ')}
                />
              </span>
            </Link>
          );
        })}
      </nav>

      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? '关闭导航菜单' : '打开导航菜单'}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED] lg:hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
      >
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#4C1D95]/30 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="导航菜单"
            className="fixed right-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-l border-[#7C3AED]/15 bg-white/95 p-5 backdrop-blur-xl shadow-2xl lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#7C3AED] font-heading">
                导航菜单
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label="关闭导航菜单"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#4C1D95]/60 hover:bg-[#7C3AED]/10 hover:text-[#4C1D95] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav
              className="flex-1 space-y-1 overflow-y-auto pr-1"
              role="navigation"
              aria-label="移动端导航"
            >
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      setOpen(false);
                      toggleRef.current?.focus();
                    }}
                    className={[
                      'flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]',
                      active
                        ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-semibold'
                        : 'text-[#4C1D95]/80 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED]',
                    ].join(' ')}
                  >
                    <Icon
                      size={18}
                      className={active ? 'text-[#7C3AED]' : 'text-[#7C3AED]/60'}
                      aria-hidden="true"
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 border-t border-[#7C3AED]/10 pt-3 text-xs text-[#4C1D95]/40">
              燕中校友数字母港 · 个人公益版
            </div>
          </div>
        </>
      )}
    </>
  );
}
