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
} from "lucide-react";
import MessageOrbit from "@/components/MessageOrbit";
import CosmicBackground from "@/components/CosmicBackground";
import JoinRequestModal from "@/components/JoinRequestModal";
import LatestUpdatesSection, {
  LatestUpdatesSkeleton,
} from "@/components/LatestUpdatesSection";
import storiesData from "@/data/stories.json";
import { getCachedOrFetch } from "@/lib/cache";
import prisma from "@/lib/db";

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
        const parts = (row.tags || "").split("|").map((p) => p.trim());
        const city = parts[2] || "";
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
  const dashboardStats = await computeDashboardStats();

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

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 py-8 md:px-8 md:py-12 gap-12">
        {/* 1. Hero (community value prop) */}
        <header className="relative flex flex-col items-center justify-center text-center gap-6 mt-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A78BFA]/30 bg-white/80 px-4 py-2 text-sm text-[#7C3AED] shadow-sm backdrop-blur-sm">
            <Rocket size={18} className="animate-bounce" />
            <span className="font-medium">燕中校友数字母港</span>
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#4C1D95] md:text-6xl lg:text-7xl drop-shadow-sm">
            连接燕中人的<br className="md:hidden" />温暖社区
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 md:text-xl">
            在这里，我们跨越山海，重温青春记忆。寻找同窗挚友，探索校友足迹，共建属于我们的精神家园。
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <JoinRequestModal />
            <Link
              href="/alumni/radar"
              className="btn-secondary rounded-full border border-[#A78BFA]/40 bg-white px-8 py-3.5 font-bold text-[#7C3AED] shadow-sm transition-all hover:-translate-y-1 hover:bg-[#F3E8FF] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
            >
              浏览校友名录
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-center">
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
          </div>
        </header>

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

        {/* 2. Popular topics/categories */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading text-2xl font-bold text-[#4C1D95] flex items-center gap-3">
            <Users className="text-[#7C3AED]" size={28} />
            热门频道
          </h2>
          <div className="stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/news"
              className="card glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
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
            <Link
              href="/events"
              className="card glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
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
            <Link
              href="/alumni/stories"
              className="card glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
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
            <Link
              href="/alumni/memories"
              className="card glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
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
          </div>
        </section>

        {/* Latest Updates Section — streamed via Suspense */}
        <section className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-6 md:p-8 backdrop-blur-xl shadow-sm">
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

        {/* 3. Active members showcase — map loaded via Suspense */}
        <section className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-6 md:p-8 backdrop-blur-xl shadow-sm">
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
            <AlumniMap />
          </div>
        </section>

        <section
          id="builders"
          className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-6 md:p-8 backdrop-blur-xl shadow-sm"
        >
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#7C3AED]">
                CO-BUILDERS
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-[#4C1D95] md:text-4xl">
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coBuilders.map((member) => (
              <article
                key={`${member.name}-${member.university}`}
                className="card rounded-2xl border border-[#A78BFA]/20 bg-white/70 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="font-heading text-lg font-bold text-slate-800">
                  {member.name}
                </p>
                <p className="mt-1 text-sm font-medium text-[#7C3AED]">
                  {member.role}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  {member.university}
                </p>
                <p className="mt-3 inline-block rounded-lg bg-[#F3E8FF] px-3 py-1.5 text-xs font-medium text-[#4C1D95]">
                  {member.focus}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  城市：{member.city}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* 4. Join CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-[#7C3AED] px-6 py-16 text-center shadow-xl md:px-12 md:py-20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]"></div>
          <div className="relative z-10 mx-auto max-w-2xl text-white">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              加入我们的校友网络
            </h2>
            <p className="mt-4 text-lg text-white/90">
              结识优秀的校友，分享你的经历，获取更多资源与机会。无论你身在何处，这里都是你的精神家园。
            </p>
            <div className="mt-8 flex justify-center">
              <JoinRequestModal />
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-[#A78BFA]/20 pt-6 pb-12">
          <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm">
            声明：本站为个人发起的公益站点，非任何官方机构。全站无盈利、不收费，仅供情感连接、记忆留存与校友社区服务。
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
            <p>© 2025-2026 燕中校友数字母港（个人公益版）</p>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="访问工信部备案系统"
              tabIndex={0}
              className="hover:text-[#7C3AED] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
            >
              粤ICP备2026024784号-2
            </a>
          </div>
        </footer>
      </div>
    </section>
  );
}
