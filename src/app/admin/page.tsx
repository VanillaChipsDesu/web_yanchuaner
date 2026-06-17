import { Users, FileText, TrendingUp, Newspaper, CalendarDays, Plus } from 'lucide-react';
import prisma from '@/lib/db';
import { getCachedOrFetch } from '@/lib/cache';
import { AdminPageShell } from '@/components/admin/AdminPageShell';

async function getStats() {
  return getCachedOrFetch('admin:stats', 60, async () => {
    try {
      const [pendingUsers, pendingPosts, totalAlumni] = await Promise.all([
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.post.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { role: 'ALUMNI' } }),
      ]);
      return { pendingUsers, pendingPosts, totalAlumni };
    } catch {
      return { pendingUsers: 0, pendingPosts: 0, totalAlumni: 0 };
    }
  });
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      label: '待审核用户',
      value: stats.pendingUsers,
      icon: Users,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: '待审核内容',
      value: stats.pendingPosts,
      icon: FileText,
      color: 'text-[#7C3AED]',
      bg: 'bg-[#7C3AED]/5',
      border: 'border-[#7C3AED]/20',
    },
    {
      label: '认证校友',
      value: stats.totalAlumni,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  ];

  return (
    <AdminPageShell title="控制面板" description="平台关键指标概览与快捷入口">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`cosmic-card rounded-card border ${card.border} ${card.bg} p-6 transition hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-fg/60">{card.label}</p>
              <card.icon size={22} className={card.color} />
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-brand-fg font-heading">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-brand/15 bg-surface/50 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-brand-fg font-heading">快速操作</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/admin/users?status=PENDING"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 transition hover:bg-amber-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Users size={16} />
            查看待审核用户
          </a>
          <a href="/admin/posts?status=PENDING"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <FileText size={16} />
            查看待审核内容
          </a>
          <a href="/admin/news"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Newspaper size={16} />
            新闻管理
          </a>
          <a href="/admin/news/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-surface/50 px-4 py-2.5 text-sm text-brand-fg/60 transition hover:border-brand/30 hover:text-brand cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Plus size={16} />
            发布新闻
          </a>
          <a href="/admin/events"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <CalendarDays size={16} />
            活动管理
          </a>
          <a href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-surface/50 px-4 py-2.5 text-sm text-brand-fg/60 transition hover:border-brand/30 hover:text-brand cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Plus size={16} />
            创建活动
          </a>
        </div>
      </div>
    </AdminPageShell>
  );
}
