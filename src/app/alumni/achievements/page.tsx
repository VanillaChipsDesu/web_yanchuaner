import type { Metadata } from "next";
import {
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  FlaskConical,
  GraduationCap,
  HandHeart,
  Sparkles,
} from "lucide-react";
import prisma from "@/lib/db";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements";
import AchievementSubmission from "@/components/AchievementSubmission";
import {
  PageShell,
  GlassCard,
  PageHeader,
  ButtonLink,
  Badge,
  EmptyState,
  DisclaimerBanner,
} from "@/components/ui";
import { cn } from "@/components/ui/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "校友成就墙",
  description: "记录燕川中学校友在升学、科研、职业、创业与公益领域的成长足迹",
};

const CATEGORY_ICONS = {
  ACADEMIC: GraduationCap,
  RESEARCH: FlaskConical,
  CAREER: BriefcaseBusiness,
  ENTREPRENEURSHIP: Building2,
  PUBLIC_SERVICE: HandHeart,
  OTHER: Award,
} satisfies Record<AchievementCategory, typeof Award>;

const CATEGORY_TONES = {
  ACADEMIC: "brand",
  RESEARCH: "info",
  CAREER: "success",
  ENTREPRENEURSHIP: "warning",
  PUBLIC_SERVICE: "danger",
  OTHER: "neutral",
} as const satisfies Record<AchievementCategory, string>;

export default async function AlumniAchievementsPage({
  searchParams,
}: {
  searchParams?: { category?: string; submit?: string };
}) {
  const requestedCategory = searchParams?.category || "";
  const activeCategory = ACHIEVEMENT_CATEGORIES.includes(
    requestedCategory as AchievementCategory,
  )
    ? (requestedCategory as AchievementCategory)
    : null;

  const achievements = await prisma.achievement.findMany({
    where: {
      status: "PUBLISHED",
      ...(activeCategory ? { category: activeCategory } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <PageShell>
      <GlassCard className="p-5 md:p-8">
        <PageHeader
          eyebrow="ALUMNI ACHIEVEMENTS"
          eyebrowIcon={Sparkles}
          title="校友成就墙"
          description="记录燕中人在升学、科研、职业、创业与公益道路上的成长足迹，分享每一份值得被看见的努力。"
          action={
            <ButtonLink href="/" variant="secondary">
              返回指挥中心
            </ButtonLink>
          }
        />

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="按成就类别筛选">
          <CategoryChip href="/alumni/achievements" active={!activeCategory}>
            全部
          </CategoryChip>
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <CategoryChip
              key={category}
              href={`/alumni/achievements?category=${category}`}
              active={activeCategory === category}
            >
              {ACHIEVEMENT_CATEGORY_LABELS[category]}
            </CategoryChip>
          ))}
        </nav>

        {achievements.length === 0 ? (
          <EmptyState
            icon={BookOpenCheck}
            title="暂无已发布的校友成就记录。"
            className="mt-8"
          />
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => {
              const category = achievement.category as AchievementCategory;
              const Icon = CATEGORY_ICONS[category] || Award;
              const categoryLabel =
                ACHIEVEMENT_CATEGORY_LABELS[category] || "其他成就";
              const tone = CATEGORY_TONES[category] || "neutral";

              return (
                <article
                  key={achievement.id}
                  className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone={tone} icon={Icon}>
                      {categoryLabel}
                    </Badge>
                    {achievement.yearLabel ? (
                      <span className="text-xs font-medium text-brand/60">
                        {achievement.yearLabel}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="font-heading mt-4 text-xl font-semibold leading-7 text-brand-fg">
                    {achievement.title}
                  </h2>
                  <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                    {achievement.description}
                  </p>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="font-medium text-brand-fg">
                      {achievement.alumniName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {[achievement.graduationClass, achievement.organization]
                        .filter(Boolean)
                        .join(" · ") || "燕中校友"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <DisclaimerBanner className="mt-8">
          本页面内容由管理员整理发布，仅用于展示校友成长经历，不构成任何官方认证或商业背书。
        </DisclaimerBanner>
      </GlassCard>
      <AchievementSubmission initialOpen={searchParams?.submit === "1"} />
    </PageShell>
  );
}

/** 类别筛选胶囊（与 Badge 视觉区分：可点击的导航过滤器） */
function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  // 用原生 a 以保持原有的整页过滤行为（searchParams 驱动）
  return (
    <a
      href={href}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-brand bg-brand/10 text-brand-fg"
          : "border-gray-200 bg-surface text-gray-600 hover:border-brand/40",
      )}
    >
      {children}
    </a>
  );
}
