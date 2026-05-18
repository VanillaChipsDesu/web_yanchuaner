import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Mail, Shield, Lightbulb } from "lucide-react";
import { insightCards } from "@/data/studentResources";

export const metadata: Metadata = {
  title: "大学与专业观察",
  description: "燕中校友数字母港 — 校友对大学生活和专业选择的经验观察，帮助在校生建立更全面的认知",
};

export default function UniversityInsightsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
          <BookOpen size={14} /> UNIVERSITY INSIGHTS
        </p>
        <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">大学与专业观察</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
          校友对大学生活和专业选择的经验观察，帮助在校生提前了解真实的大学环境，做出更适合自己的选择。
        </p>

        {/* Insight Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
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

        {/* How to Ask */}
        <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
              <Lightbulb size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-indigo-800">如何向学长学姐有效提问</h3>
              <p className="mt-1 text-xs leading-6 text-indigo-700">
                好的提问能让学长学姐更愿意帮助你。建议在提问前先做好功课，然后针对自己真正关心的点提问。
              </p>
              <div className="mt-2 rounded-xl border border-indigo-200 bg-white/60 px-3 py-2 text-xs leading-6 text-indigo-600">
                <span className="font-medium">提问模板：</span>
                「我目前是XX省选考XX的考生，对XX专业感兴趣，想了解该专业的课程难度、就业方向、转专业机会、保研情况和所在城市的生活成本。」
              </div>
            </div>
          </div>
        </div>

        {/* Contribution */}
        <div className="mt-6 rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF] p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10">
              <Mail size={18} className="text-[#7C3AED]" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-[#4C1D95]">内容征集中</h3>
              <p className="mt-1 text-xs leading-6 text-gray-600">
                欢迎各位校友通过{" "}
                <Link href="/alumni/stories" className="text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                  燕中故事
                </Link>{" "}
                分享你的大学就读体验、专业学习心得或对在校生的建议。所有内容经审核后发布。
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
              <p className="mt-1 text-xs leading-6 text-amber-700">
                本页面内容为校友经验观察和信息整理，不代表燕川中学或校友会官方意见。每个人的体验具有个体差异，同一所学校不同专业的感受可能完全不同，请理性参考。
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/students" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
            返回资源站
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10"
          >
            <Mail size={16} />
            联系我们
          </Link>
        </div>
      </div>
    </section>
  );
}
