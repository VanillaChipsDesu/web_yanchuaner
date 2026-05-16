import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Lightbulb, MessageCircle, School, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "在校生资源站",
  description: "燕川中学在校生资源站 — 学长经验分享、大学介绍、专业选择指南、学习方法交流",
};

const resources = [
  {
    icon: Compass,
    title: "大学导航",
    desc: "学长学姐分享就读大学的真实体验：学校环境、专业特色、校园生活。帮助在校生提前了解心仪院校。",
    highlight: "热门资源",
  },
  {
    icon: Lightbulb,
    title: "专业探秘",
    desc: "各专业方向的详细介绍：学什么、怎么学、未来出路。帮你避开\u201c选专业一时爽，大学四年火葬场\u201d的坑。",
    highlight: "学长力荐",
  },
  {
    icon: BookOpen,
    title: "学习方法",
    desc: "高考备考经验、时间管理技巧、心态调整方法。来自学长学姐的第一手实战经验。",
    highlight: "实用干货",
  },
  {
    icon: MessageCircle,
    title: "学长问答",
    desc: "有什么问题想问学长学姐？通过燕中故事投稿提出问题，我们将邀请对应领域的校友回答。",
    highlight: "互动社区",
  },
  {
    icon: School,
    title: "志愿填报参考",
    desc: "历年录取数据、专业热度分析、院校对比。帮助你在志愿填报时做出更明智的选择。",
    highlight: "功能开发中",
  },
  {
    icon: Sparkles,
    title: "校友寄语",
    desc: "来自天南海北的学长学姐写给学弟学妹的话：关于梦想、关于选择、关于青春。",
    highlight: "温暖激励",
  },
];

export default function StudentsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <header className="mb-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
            <BookOpen size={14} /> STUDENTS
          </p>
          <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">在校生资源站</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
            由毕业校友为学弟学妹们整理的学习资源、经验分享与成长指南。薪火相传，燕中精神代代延续。
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map(({ icon: Icon, title, desc, highlight }) => (
            <article
              key={title}
              className="card group p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                  <Icon size={20} className="text-[#7C3AED]" />
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
                  {highlight}
                </span>
              </div>
              <h3 className="font-heading mt-4 text-base font-semibold text-[#4C1D95]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">{desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <h3 className="font-heading text-lg font-semibold text-[#4C1D95]">想贡献内容？</h3>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            欢迎各位校友通过<a href="/alumni/stories" className="text-[#7C3AED] underline hover:text-[#4C1D95] focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus:outline-none">燕中故事</a>投稿，分享你的大学经历、学习方法或给学弟学妹的建议。
          </p>
          <p className="mt-1 text-xs text-gray-500">
            所有内容经站长审核后发布。
          </p>
        </div>

        <Link href="/" className="mt-6 btn-secondary">
          返回首页
        </Link>
      </div>
    </section>
  );
}
