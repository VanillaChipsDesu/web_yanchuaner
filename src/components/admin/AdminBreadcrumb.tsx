'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

/**
 * 后台路由 → 中文标签映射。新增后台页时在此登记即可自动出现在面包屑中。
 * 仅用于「呈现」，不参与任何鉴权或路由跳转逻辑。
 */
const SEGMENT_LABELS: Record<string, string> = {
  admin: '控制台',
  users: '用户审核',
  posts: '内容审核',
  news: '新闻管理',
  events: '活动管理',
  stories: '燕中故事',
  achievements: '校友成就墙',
  memories: '燕中记忆',
  teachers: '教师频道',
  content: '页面内容',
  alumni: '校友名单',
  'alumni-corrections': '信息修改申请',
  registrations: '报名名单',
  new: '新建',
};

export function AdminBreadcrumb() {
  const pathname = usePathname() || '/admin';
  const segments = pathname.split('/').filter(Boolean); // e.g. ['admin','news','new']

  // 累积路径，用于每一段的链接
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isId = !SEGMENT_LABELS[seg] && /^[0-9a-f-]{6,}$/i.test(seg);
    const label = SEGMENT_LABELS[seg] || (isId ? '详情' : seg);
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <nav aria-label="面包屑" className="mb-4 flex items-center gap-1.5 text-sm text-brand-fg/50">
      <Link href="/admin" className="inline-flex items-center gap-1 hover:text-brand transition-colors">
        <Home size={14} aria-hidden="true" />
        <span className="sr-only">控制台首页</span>
      </Link>
      {crumbs.slice(1).map((c) => (
        <span key={c.href} className="inline-flex items-center gap-1.5">
          <ChevronRight size={13} aria-hidden="true" className="text-brand-fg/30" />
          {c.isLast ? (
            <span className="font-medium text-brand-fg">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-brand transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
