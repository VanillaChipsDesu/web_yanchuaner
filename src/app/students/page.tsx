import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen, School, Building2, HelpCircle, GraduationCap, Sparkles,
  ChevronRight, Mail, Shield
} from "lucide-react";

export const metadata: Metadata = {
  title: "在校生资源站",
  description: "燕中校友数字母港 — 面向在校生和家长的升学参考、大学观察、学习方法、学长问答与校友寄语汇总",
};

const resourceCards = [
  {
    icon: School,
    title: "志愿填报参考",
    desc: "理解分数、位次、专业、城市、学校层次的思考框架，掌握信息收集方法，做出更明智的选择。",
    href: "/students/application-guide",
    gradient: "from-violet-100 to-purple-50",
    border: "border-violet-200",
  },
  {
    icon: Building2,
    title: "大学与专业观察",
    desc: "校友分享的大学生活体验与专业选择经验，帮助在校生提前了解真实的大学生活。",
    href: "/students/university-insights",
    gradient: "from-indigo-100 to-blue-50",
    border: "border-indigo-200",
  },
  {
    icon: HelpCircle,
    title: "学长问答",
    desc: "精选问答，解答在校生和家长关于专业选择、志愿填报、大学适应的常见困惑。",
    href: "/students/senior-qa",
    gradient: "from-fuchsia-100 to-pink-50",
    border: "border-fuchsia-200",
  },
  {
    icon: GraduationCap,
    title: "学习方法",
    desc: "时间管理、复习策略、心态调整——整理高中阶段实用学习建议。",
    href: "/students/learning-methods",
    gradient: "from-emerald-100 to-teal-50",
    border: "border-emerald-200",
  },
  {
    icon: Sparkles,
    title: "校友寄语",
    desc: "来自天南海北的学长学姐写给学弟学妹的话：关于选择、努力、大学与成长。",
    href: "/students/alumni-messages",
    gradient: "from-amber-100 to-orange-50",
    border: "border-amber-200",
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
            面向在校生和家长，整理升学参考、大学观察、学习方法、学长问答与校友寄语，帮助燕中人走出更适合自己的路。
          </p>
        </header>

        {/* Unified Resource Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resourceCards.map(({ icon: Icon, title, desc, href, gradient, border }) => (
            <Link
              key={title}
              href={href}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} ${border} p-5 transition hover:shadow-lg hover:-translate-y-1`}
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 shadow-sm">
                <Icon size={22} className="text-[#7C3AED]" />
              </div>
              <h3 className="font-heading mt-4 text-lg font-semibold text-[#4C1D95]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#7C3AED]/70 transition group-hover:gap-1.5">
                进入 <ChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>

        {/* Contribution */}
        <div className="mt-10 rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
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
                分享你的大学经历或给学弟学妹的建议。也欢迎通过{" "}
                <Link href="/contact" className="text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                  联系我们
                </Link>{" "}
                提供资料。
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                所有内容经站长审核后发布。请勿在提交内容中包含他人手机号、家庭住址等敏感信息。
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Shield size={16} className="text-amber-700" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber-800">免责声明</h3>
              <p className="mt-1 text-xs leading-6 text-amber-700">
                本页面内容来自公开信息整理与校友经验沉淀，仅供在校生和家长参考，不代表燕川中学或校友会官方意见，不构成报考、录取或职业选择承诺。涉及招生政策、录取规则和专业设置时，请以教育考试院、招生院校官网和当年招生章程为准。
              </p>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary inline-flex items-center gap-2 text-sm">
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
