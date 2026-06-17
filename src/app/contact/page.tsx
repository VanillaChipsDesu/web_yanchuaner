import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, CalendarDays, Shield, ArrowLeft, BookOpen, Star, Heart, Users, School, GraduationCap } from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "联系我们",
  description: "燕中校友数字母港 — 联系方式、投稿说明、合作邀请与免责声明",
};

const ICON_MAP: Record<string, any> = {
  BookOpen, Star, Heart, MessageSquare, Mail, Shield, Users, School, CalendarDays, GraduationCap,
};

export default async function ContactPage() {
  const sections = await prisma.contentSection.findMany({
    where: { page: 'contact' },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <PageShell size="narrow">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="CONTACT"
          eyebrowIcon={Mail}
          title="联系我们"
          description="这里是燕中校友数字母港的联系窗口。我们欢迎每一位校友的参与与支持。"
        />

        <div className="mt-8 space-y-6">
          {sections.map((s) => {
            const Icon = ICON_MAP[s.icon] || Mail;
            return (
              <div key={s.id} className="rounded-card border border-line bg-surface/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                    <Icon size={20} className="text-brand" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-semibold text-brand-fg">{s.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{s.description}</p>
                    {s.note && <p className="mt-1 text-sm leading-6 text-gray-600">{s.note}</p>}
                    {s.href === '/alumni/stories' ? (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <Link href={s.href} className="text-sm text-brand underline hover:text-brand-fg transition-colors">
                          {s.actionLabel || '查看详情'}
                        </Link>
                        <Link href="/alumni/achievements?submit=1" className="text-sm text-brand underline hover:text-brand-fg transition-colors">
                          前往校友成就投稿
                        </Link>
                      </div>
                    ) : s.href ? (
                      <Link href={s.href} className="mt-1 inline-block text-sm text-brand underline hover:text-brand-fg transition-colors">
                        {s.actionLabel || '查看详情'}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sections.length === 0 && (
          <EmptyState
            icon={Mail}
            title="联系信息正在整理中，敬请期待。"
            className="mt-8"
          />
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="secondary" icon={ArrowLeft}>
            返回首页
          </ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}
