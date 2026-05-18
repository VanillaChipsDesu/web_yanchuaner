'use client';

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Compass, Lightbulb, MessageCircle, School, Sparkles,
  ChevronRight, Mail, Shield, ArrowLeft
} from "lucide-react";
import { categories, guideCards, insightCards, qaItems } from "@/data/studentResources";

const overviewCards = [
  { icon: Compass, title: "大学导航", desc: "学长学姐分享就读大学的真实体验：学校环境、专业特色、校园生活。帮助在校生提前了解心仪院校。", highlight: "热门资源", sectionId: "university-insights" },
  { icon: Lightbulb, title: "专业探秘", desc: "各专业方向的详细介绍：学什么、怎么学、未来出路。帮你避开选专业时的常见误区。", highlight: "学长力荐", sectionId: "university-insights" },
  { icon: BookOpen, title: "学习方法", desc: "高考备考经验、时间管理技巧、心态调整方法。来自学长学姐的第一手实战经验。", highlight: "实用干货" },
  { icon: MessageCircle, title: "学长问答", desc: "有什么问题想问学长学姐？查看精选问答，或通过联系我们提交你的问题。", highlight: "互动社区", sectionId: "senior-qa" },
  { icon: School, title: "志愿填报参考", desc: "理解分数、位次、专业、城市、学校层次的思考框架，帮助你做出更明智的选择。", highlight: "重要参考", sectionId: "application-guide" },
  { icon: Sparkles, title: "校友寄语", desc: "来自天南海北的学长学姐写给学弟学妹的话：关于梦想、关于选择、关于青春。", highlight: "温暖激励" },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function StudentsPage() {
  const [activeTab, setActiveTab] = useState("");

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    scrollToSection(id);
  };

  const handleCardClick = (sectionId?: string) => {
    if (sectionId) {
      setActiveTab(sectionId);
      scrollToSection(sectionId);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        {/* Header */}
        <header className="mb-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
            <BookOpen size={14} /> STUDENTS
          </p>
          <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">在校生资源站</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
            面向在校生和家长，整理升学参考、大学观察、专业选择与校友经验，帮助燕中人走出更适合自己的路。
          </p>
        </header>

        {/* Category Tabs */}
        <div className="mb-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 min-w-max md:min-w-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleTabClick(cat.id)}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition cursor-pointer ${
                  activeTab === cat.id
                    ? "border-[#7C3AED]/50 bg-[#7C3AED]/10 text-[#7C3AED] shadow-sm"
                    : "border-gray-200 text-[#4C1D95]/70 hover:border-[#7C3AED]/30 hover:text-[#7C3AED]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Resource Grid (existing 6 cards) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overviewCards.map(({ icon: Icon, title, desc, highlight, sectionId }) => (
            <article
              key={title}
              className={`card group p-5 transition hover:-translate-y-1 hover:shadow-md ${
                sectionId ? "cursor-pointer" : ""
              }`}
              onClick={() => handleCardClick(sectionId)}
              role={sectionId ? "button" : undefined}
              tabIndex={sectionId ? 0 : undefined}
              onKeyDown={sectionId ? (e) => { if (e.key === "Enter" || e.key === " ") handleCardClick(sectionId); } : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                  <Icon size={20} className="text-[#7C3AED]" />
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 shrink-0">
                  {highlight}
                </span>
              </div>
              <h3 className="font-heading mt-4 text-base font-semibold text-[#4C1D95]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">{desc}</p>
              {sectionId && (
                <div className="mt-3 flex items-center gap-1 text-xs text-[#7C3AED]/70">
                  查看详情 <ChevronRight size={12} />
                </div>
              )}
            </article>
          ))}
        </div>

        {/* ===== 志愿填报参考 ===== */}
        <section id="application-guide" className="mt-12 scroll-mt-24">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-[#4C1D95]">志愿填报参考</h2>
            <p className="mt-1.5 text-sm leading-6 text-gray-600">
              帮助在校生和家长理解高考志愿填报的核心概念与思考框架。所有信息仅供参考，具体以官方发布为准。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {guideCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
                <h3 className="font-heading text-base font-semibold text-[#4C1D95]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{card.summary}</p>
                <ul className="mt-3 space-y-2">
                  {card.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-5 text-gray-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]/40" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 大学与专业观察 ===== */}
        <section id="university-insights" className="mt-12 scroll-mt-24">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-[#4C1D95]">大学与专业观察</h2>
            <p className="mt-1.5 text-sm leading-6 text-gray-600">
              校友对大学生活和专业选择的经验观察，帮助在校生建立更全面的认知。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {insightCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
                <h3 className="font-heading text-base font-semibold text-[#4C1D95]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{card.summary}</p>
                {card.note && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs leading-5 text-amber-700">
                    {card.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== 学长问答 ===== */}
        <section id="senior-qa" className="mt-12 scroll-mt-24">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-[#4C1D95]">学长问答</h2>
            <p className="mt-1.5 text-sm leading-6 text-gray-600">
              精选问答，解答在校生和家长的常见困惑。内容持续征集中。
            </p>
          </div>
          <div className="space-y-4">
            {qaItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-[#7C3AED]/10 bg-white/50 transition hover:border-[#7C3AED]/20"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 list-none">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-[#4C1D95] md:text-base">
                      {item.question}
                    </h3>
                    {item.tags && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded-full border border-[#7C3AED]/10 bg-[#7C3AED]/5 px-2 py-0.5 text-[11px] text-[#7C3AED]/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-[#4C1D95]/40 transition duration-200 group-open:rotate-90" />
                </summary>
                <div className="border-t border-[#7C3AED]/5 px-5 py-4">
                  <p className="text-sm leading-7 text-gray-600">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#7C3AED]/10 bg-[#FAF5FF] px-5 py-4">
            <p className="text-sm leading-6 text-[#4C1D95]/70">
              有更多问题？欢迎通过{" "}
              <Link href="/contact" className="text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                联系我们
              </Link>{" "}
              提交你的问题，我们将邀请相关领域的校友回答。精选问答持续更新中。
            </p>
          </div>
        </section>

        {/* Contribution */}
        <div className="mt-12 rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-6">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10">
              <Mail size={20} className="text-[#7C3AED]" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-[#4C1D95]">补充内容或分享经验</h3>
              <p className="mt-1.5 text-sm leading-6 text-gray-600">
                欢迎校友通过{" "}
                <Link href="/alumni/stories" className="text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                  燕中故事
                </Link>{" "}
                分享你的大学经历、专业学习心得或给学弟学妹的建议。也欢迎通过{" "}
                <Link href="/contact" className="text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                  联系我们
                </Link>{" "}
                提供资料或建议。
              </p>
              <p className="mt-1.5 text-xs leading-5 text-gray-500">
                所有内容经站长审核后发布。为保护个人隐私，请勿在提交内容中包含他人手机号、家庭住址等敏感信息。
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Shield size={16} className="text-amber-700" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber-800">免责声明</h3>
              <p className="mt-1.5 text-xs leading-6 text-amber-700">
                本页面内容来自公开信息整理与校友经验沉淀，仅供在校生和家长参考，不代表燕川中学或校友会官方意见，不构成报考、录取或职业选择承诺。涉及招生政策、录取规则和专业设置时，请以教育考试院、招生院校官网和当年招生章程为准。
              </p>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
            返回首页
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10"
          >
            联系我们
          </Link>
        </div>
      </div>
    </section>
  );
}
