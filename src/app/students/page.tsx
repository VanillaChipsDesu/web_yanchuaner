import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen, School, Building2, HelpCircle, GraduationCap, Sparkles,
  ChevronRight, Mail, Shield, Star, Heart, MessageSquare, Users, Globe2, MapPin, Rocket
} from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState, DisclaimerBanner } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "在校生资源站",
  description: "燕中校友数字母港 — 面向在校生和家长的升学参考、大学观察、学习方法、学长问答与校友寄语汇总",
};

const ICON_MAP: Record<string, any> = {
  BookOpen, School, Building2, HelpCircle, GraduationCap, Sparkles, Star, Heart, MessageSquare, Users, Globe2, MapPin, Rocket, Mail,
};

export default async function StudentsPage() {
  const cards = await prisma.contentSection.findMany({
    where: { page: 'students' },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="STUDENTS"
          eyebrowIcon={BookOpen}
          title="在校生资源站"
          description="面向在校生和家长，整理升学参考、大学观察、学习方法、学长问答与校友寄语，帮助燕中人走出更适合自己的路。"
          className="mb-8"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = ICON_MAP[c.icon] || BookOpen;
            const href = c.href || '#';
            const colors = [
              'from-violet-100 to-purple-50 border-violet-200',
              'from-indigo-100 to-blue-50 border-indigo-200',
              'from-fuchsia-100 to-pink-50 border-fuchsia-200',
              'from-emerald-100 to-teal-50 border-emerald-200',
              'from-amber-100 to-orange-50 border-amber-200',
            ];
            const colorClass = colors[Math.abs(hashCode(c.id)) % colors.length];

            return (
              <Link
                key={c.id}
                href={href}
                className={`group relative overflow-hidden rounded-card border bg-gradient-to-br ${colorClass} p-5 transition hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 shadow-sm">
                  <Icon size={22} className="text-brand" />
                </div>
                <h3 className="font-heading mt-4 text-lg font-semibold text-brand-fg">{c.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{c.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand/70 transition group-hover:gap-1.5">
                  进入 <ChevronRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>

        {cards.length === 0 && (
          <EmptyState icon={BookOpen} title="在校生资源正在整理中，敬请期待。" />
        )}

        <div className="mt-10 rounded-card border border-line bg-surface/50 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Mail size={20} className="text-brand" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-brand-fg">补充内容或分享经验</h3>
              <p className="mt-1.5 text-sm leading-6 text-gray-600">
                欢迎校友通过{" "}
                <Link href="/alumni/stories" className="text-brand underline hover:text-brand-fg transition-colors">
                  燕中故事
                </Link>{" "}
                分享你的大学经历或给学弟学妹的建议。也欢迎通过{" "}
                <Link href="/contact" className="text-brand underline hover:text-brand-fg transition-colors">
                  联系我们
                </Link>{" "}
                提供资料。
              </p>
            </div>
          </div>
        </div>

        <DisclaimerBanner title="免责声明" className="mt-4">
          本页面内容来自公开信息整理与校友经验沉淀，仅供在校生和家长参考，不代表燕川中学或校友会官方意见，不构成报考、录取或职业选择承诺。
        </DisclaimerBanner>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="secondary">返回首页</ButtonLink>
          <ButtonLink href="/contact" variant="ghost">联系我们</ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h >>> 0; // 转为无符号整数，避免 Math.abs(INT_MIN) 溢出
}
