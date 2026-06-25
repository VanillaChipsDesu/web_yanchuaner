export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import {
  GalleryVerticalEnd,
  MapPin,
  MessageSquareText,
  Rocket,
  Users,
  Newspaper,
  CalendarDays,
  Lock,
} from "lucide-react";
import { RevealSection } from "@/components/ui";
import MessageOrbit from "@/components/MessageOrbit";
import CosmicBackground from "@/components/CosmicBackground";
import { JoinTriggerButton } from "@/components/JoinRequestModal";
import LatestUpdatesSection, {
  LatestUpdatesSkeleton,
} from "@/components/LatestUpdatesSection";
import storiesData from "@/data/stories.json";
import { getCachedOrFetch } from "@/lib/cache";
import prisma from "@/lib/db";
import { parseTags } from "@/lib/tags";
import { getPageUser } from "@/lib/admin-auth";

const AlumniMap = nextDynamic(() => import("@/components/AlumniMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-2xl border border-[#A78BFA]/20 bg-white/30">
      <p className="text-sm text-slate-400">正在加载校友分布图...</p>
    </div>
  ),
});

type TeamMember = {
  name: string;
  role: string;
  university: string;
  focus: string;
  city: string;
};

const coBuilders: TeamMember[] = [
  {
    name: "黄湘林",
    role: "技术支持",
    university: "华南理工大学",
    focus: "系统底座与数据安全",
    city: "广州",
  },
  {
    name: "左佳维",
    role: "内容贡献",
    university: "江西科技师范大学",
    focus: "视觉风格与栏目策划",
    city: "南昌",
  },
  {
    name: "吴桐",
    role: "内容贡献",
    university: "香港树仁大学",
    focus: "文字叙事与记忆归档",
    city: "香港",
  },
  {
    name: "杨菁",
    role: "内容贡献",
    university: "广东海洋大学",
    focus: "视觉素材与文化展示",
    city: "湛江",
  },
  {
    name: "赖盈燕",
    role: "运维协调",
    university: "广州华商学院",
    focus: "信息维护与流程管理",
    city: "广州",
  },
  {
    name: "朱国震",
    role: "运维协调",
    university: "深圳技术大学",
    focus: "数据维护与运营支持",
    city: "深圳",
  },
  {
    name: "张正朋",
    role: "通讯支持",
    university: "海南大学",
    focus: "社群联络与信息互通",
    city: "海口",
  },
  {
    name: "张一鸣",
    role: "通讯支持",
    university: "齐齐哈尔医学院",
    focus: "线上互动与用户触达",
    city: "齐齐哈尔",
  },
];

const HOME_ANNOUNCEMENT_TEXT =
  "📢 欢迎来到燕中校友数字母港！本站为个人公益平台，致力于连接校友、在校生与老师，打造温暖的燕中社区。";

async function computeDashboardStats() {
  try {
    return await getCachedOrFetch("home:dashboard:stats", 60, async () => {
      const rows = await prisma.whitelistRoster.findMany({
        select: { tags: true },
      });

      const alumniCount = rows.length;

      const unknownCitySet = new Set(["", "待完善", "待补充", "未知城市", "未知"]);
      const citySet = new Set<string>();
      for (const row of rows) {
        const { city } = parseTags(row.tags || "");
        if (city && !unknownCitySet.has(city)) {
          citySet.add(city);
        }
      }

      return {
        alumniCount,
        cityCount: citySet.size,
        storyCount: storiesData.length,
      };
    });
  } catch (error) {
    console.error("首页数据查询失败", error);
    return { alumniCount: 0, cityCount: 0, storyCount: storiesData.length };
  }
}

export default async function HomePage() {
  const currentUser = await getPageUser();
  const canViewPrivate =
    !!currentUser &&
    (currentUser.role === "ADMIN" ||
      (currentUser.role === "ALUMNI" && currentUser.status === "VERIFIED"));
  const dashboardStats = canViewPrivate
    ? await computeDashboardStats()
    : { alumniCount: 0, cityCount: 0, storyCount: 0 };

  return (
    <section
      id="top"
      className="relative min-h-screen overflow-hidden bg-[#FAF5FF]"
    >
      <CosmicBackground />
      <MessageOrbit />
      <div
        className="home-atmo-layer opacity-40 mix-blend-multiply"
        aria-hidden="true"
      >
        <div className="home-breath-stars home-breath-stars-a bg-[#7C3AED]/20" />
        <div className="home-breath-stars home-breath-stars-b bg-[#A78BFA]/20" />
        <div className="home-breath-stars home-breath-stars-c bg-[#22C55E]/20" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 py-12 md:px-8 md:py-16 gap-16">
        {/* 1. Hero (community value prop) */}
        <header className="relative flex flex-col items-center justify-center text-center gap-6 mt-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A78BFA]/30 bg-white/80 px-4 py-2 text-sm text-[#7C3AED] shadow-sm backdrop-blur-sm">
            <Rocket size={18} className="animate-bounce" />
            <span className="font-medium">燕中校友数字母港</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#4C1D95] md:text-5xl lg:text-6xl drop-shadow-sm">
            连接燕中人的<br className="md:hidden" />温暖社区
          </h1>
          <p className="max-w-2xl text-base text-slate-600 md:text-lg">
            在这里，我们跨越山海，重温青春记忆。寻找同窗挚友，探索校友足迹，共建属于我们的精神家园。
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {!currentUser ? (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
                >
                  入轨联络舱
                </Link>
                <Link
                  href="/alumni/radar"
                  className="px-8 py-3.5 rounded-full border border-purple-500/50 text-purple-200 hover:bg-purple-500/10 transition-all hover:-translate-y-1 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
                >
                  浏览校友名录
                </Link>
              </>
            ) : (
              <Link
                href="/alumni/radar"
                className="px-8 py-3.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
              >
                浏览校友名录
              </Link>
            )}
          </div>
          {canViewPrivate ? <div className="mt-8 flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-[#4C1D95]">
                {dashboardStats.alumniCount}+
              </p>
              <p className="text-sm font-medium text-slate-500">
                已入驻校友
              </p>
            </div>
            <div className="w-px h-12 bg-[#A78BFA]/30"></div>
            <div>
              <p className="text-3xl font-bold text-[#4C1D95]">
                {dashboardStats.cityCount}
              </p>
              <p className="text-sm font-medium text-slate-500">点亮城市</p>
            </div>
            <div className="w-px h-12 bg-[#A78BFA]/30 hidden sm:block"></div>
            <div className="hidden sm:block">
              <p className="text-3xl font-bold text-[#4C1D95]">
                {dashboardStats.storyCount}
              </p>
              <p className="text-sm font-medium text-slate-500">校友故事</p>
            </div>
          </div> : null}
        </header>

        <RevealSection>
          <div className="h-12 overflow-hidden rounded-full border border-[#A78BFA]/30 bg-white/70 shadow-sm backdrop-blur-sm">
            <div className="announcement-marquee-track h-full">
              <span className="inline-flex h-full items-center px-6 text-sm font-medium text-[#4C1D95]">
                {HOME_ANNOUNCEMENT_TEXT}
              </span>
              <span
                aria-hidden="true"
                className="inline-flex h-full items-center px-6 text-sm font-medium text-[#4C1D95]"
              >
                {HOME_ANNOUNCEMENT_TEXT}
              </span>
            </div>
          </div>
        </RevealSection>

        {/* 2. Popular topics/categories */}
        <section className="flex flex-col gap-6">
          <RevealSection>
            <h2 className="font-heading text-2xl font-bold text-[#4C1D95] flex items-center gap-3">
              <Users className="text-[#7C3AED]" size={28} />
              热门频道
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevealSection delay={0} className="h-full flex flex-col">
              <Link
                href="/news"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <Newspaper size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  最新公告
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  了解母校与校友会的最新动态
                </p>
              </Link>
            </RevealSection>
            <RevealSection delay={0.1} className="h-full flex flex-col">
              <Link
                href="/events"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <CalendarDays size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  校友活动
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  参与线上线下交流与聚会
                </p>
              </Link>
            </RevealSection>
            <RevealSection delay={0.2} className="h-full flex flex-col">
              <Link
                href="/alumni/stories"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <MessageSquareText size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  燕中故事
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  倾听校友们的奋斗与成长
                </p>
              </Link>
            </RevealSection>
            <RevealSection delay={0.3} className="h-full flex flex-col">
              <Link
                href="/alumni/memories"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <GalleryVerticalEnd size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  燕中记忆
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  重温校园时光的珍贵影像
                </p>
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* Latest Updates Section — streamed via Suspense */}
        {canViewPrivate ? (
          <RevealSection>
            <section className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-5 md:p-6 backdrop-blur-xl shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Newspaper size={28} className="text-[#7C3AED]" />
                <h2 className="font-heading text-2xl font-bold text-[#4C1D95]">
                  最新动态
                </h2>
              </div>
              <Suspense fallback={<LatestUpdatesSkeleton />}>
                <LatestUpdatesSection />
              </Suspense>
            </section>
          </RevealSection>
        ) : null}

        {/* 3. Active members showcase — map loaded via Suspense */}
        <RevealSection direction="scale">
          <section className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-5 md:p-6 backdrop-blur-xl shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MapPin size={28} className="text-[#7C3AED]" />
                <h2 className="font-heading text-2xl font-bold text-[#4C1D95]">
                  校友分布与活跃成员
                </h2>
              </div>
              <Link
                href="/alumni/radar"
                className="text-sm font-medium text-[#7C3AED] hover:text-[#4C1D95] transition-colors"
              >
                查看完整名录 &rarr;
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#A78BFA]/20 bg-white shadow-sm">
              {canViewPrivate ? (
                <AlumniMap />
              ) : (
                <div className="relative overflow-hidden min-h-[320px] flex flex-col items-center justify-center rounded-2xl border border-purple-500/30 p-8 text-center bg-[#0f0a1d]">
                  {/* 模糊伪数据背景 */}
                  <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0f0a1d]/85 to-[#0f0a1d] blur-md scale-105 pointer-events-none"
                    aria-hidden="true"
                  />
                  {/* 半透明黑遮罩 */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" aria-hidden="true" />
                  {/* 居中内容层 */}
                  <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm">
                    <Lock className="text-purple-400/80 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" size={40} />
                    <p className="text-base font-semibold text-purple-200 drop-shadow-sm">
                      登录并通过校友认证后可查看校友分布。
                    </p>
                    <Link
                      href="/login?redirect=/alumni/radar"
                      className="mt-2 px-6 py-2.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 text-sm"
                    >
                      立即验证入轨
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        </RevealSection>

        <section
          id="builders"
          className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-5 md:p-6 backdrop-blur-xl shadow-sm"
        >
          <RevealSection>
            <div className="mb-8 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#7C3AED]">
                  CO-BUILDERS
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold text-[#4C1D95] md:text-3xl">
                  平台共建者
                </h2>
              </div>
              <a
                href="#top"
                aria-label="返回顶部"
                tabIndex={0}
                className="rounded-full border border-[#A78BFA]/30 bg-white px-4 py-2 text-sm font-medium text-[#7C3AED] hover:bg-[#F3E8FF] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                返回顶部
              </a>
            </div>
          </RevealSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coBuilders.map((member, i) => (
              <RevealSection
                key={`${member.name}-${member.university}`}
                delay={i * 0.08}
                className="h-full flex flex-col"
              >
                <article
                  className="card h-full w-full rounded-2xl border border-line bg-surface/50 p-4 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="font-heading text-lg font-bold text-white">
                    {member.name}
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand">
                    {member.role}
                  </p>
                  <p className="mt-3 text-sm text-brand-fg/70">
                    {member.university}
                  </p>
                  <p className="mt-3 inline-block rounded-lg bg-purple-950/40 border border-purple-500/30 px-3 py-1 text-xs font-medium text-purple-200">
                    {member.focus}
                  </p>
                  <p className="mt-3 text-sm text-brand-fg/50">
                    城市：{member.city}
                  </p>
                </article>
              </RevealSection>
            ))}
          </div>
        </section>

        {!currentUser ? (
          /* 4. Join CTA */
          <RevealSection direction="scale">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/20 via-[#0f0a1d]/80 to-indigo-900/20 backdrop-blur-xl border border-purple-500/20 px-6 py-12 text-center shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(168,85,247,0.3)] hover:border-purple-400/50 md:px-12 md:py-16">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]"></div>
              <div className="relative z-10 mx-auto max-w-2xl text-white">
                <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
                  加入我们的校友网络
                </h2>
                <p className="mt-4 text-base text-purple-200/80">
                  结识优秀的校友，分享你的经历，获取更多资源与机会。无论你身在何处，这里都是你的精神家园。
                </p>
                <div className="mt-8 flex justify-center">
                  <JoinTriggerButton />
                </div>
              </div>
            </section>
          </RevealSection>
        ) : null}

        <RevealSection>
          <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-900/20 px-4 py-3 text-sm font-medium text-amber-200/90 shadow-[0_0_15px_rgba(245,158,11,0.05)] backdrop-blur-md">
            <span className="mt-0.5 text-base flex-shrink-0" aria-hidden="true">📢</span>
            <span>声明：本站为个人发起的公益站点，非任何官方机构。全站无盈利、不收费，仅供情感连接、记忆留存与校友社区服务。</span>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
