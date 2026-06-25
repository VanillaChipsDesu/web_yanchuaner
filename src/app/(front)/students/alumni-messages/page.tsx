import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Mail, Shield, Quote } from "lucide-react";
import { PageShell, GlassCard, PageHeader, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "校友寄语",
  description: "燕中校友数字母港 — 天南海北的校友写给在校生的话，关于选择、努力、大学与成长",
};

const themes = [
  {
    title: "关于选择",
    content:
      "高中毕业时的很多选择在当时看来无比重大，但回过头看，人生很少因为一次选择就被完全决定。重要的不是选了一条绝对正确的路，而是在选定的路上认真走下去。选择专业、选择大学、选择城市，都只是开始，不是终点。",
  },
  {
    title: "关于努力",
    content:
      "努力不一定立刻看到结果，但不努力一定看不到。高中阶段的每一份付出，都会在未来某个时刻以你意想不到的方式回报你。坚持本身就是一种能力，而这种能力会伴随你走过之后人生的每一个阶段。",
  },
  {
    title: "关于大学",
    content:
      "大学和高中最大的不同，是没有人再替你安排每天做什么。你需要学会自主管理时间、主动获取信息、独立做决定。这些能力比具体的课程知识更重要，也是大学四年最值得培养的东西。",
  },
  {
    title: "关于长期主义",
    content:
      "高中时觉得每天都很漫长，现在回头看三年只是一瞬间。放在更长的时间尺度上，高考、大学、第一份工作都只是人生中的一站。保持学习和成长的心态，比一时的成绩和排名重要得多。",
  },
  {
    title: "关于迷茫",
    content:
      "如果你现在感到迷茫，这很正常。大多数人在高中和大学阶段都不知道自己真正想要什么。迷茫不可怕，重要的是不要停在原地。多尝试、多体验、多和人交流，答案会在行动中逐渐清晰。",
  },
];

export default function AlumniMessagesPage() {
  return (
    <PageShell size="default">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="ALUMNI MESSAGES"
          eyebrowIcon={BookOpen}
          title="校友寄语"
          description="来自天南海北的学长学姐写给学弟学妹的话。当前内容为通用整理，真实校友寄语持续征集中。"
        />

        {/* Note */}
        <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
          <div className="flex items-start gap-3">
            <Quote size={18} className="mt-0.5 shrink-0 text-purple-500" />
            <div>
              <p className="text-sm leading-6 text-purple-700">
                这些寄语代表了校友们共同的心声。欢迎各位校友通过下方入口分享你个人的真实寄语，我们将精选后更新在此页面。
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="mt-8 space-y-4">
          {themes.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-brand/10 bg-surface/50 p-5"
            >
              <h3 className="font-heading text-base font-semibold text-brand-fg">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600">{item.content}</p>
            </div>
          ))}
        </div>

        {/* Contribution */}
        <div className="mt-8 rounded-2xl border border-brand/10 bg-surface-muted p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
              <Mail size={18} className="text-brand" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-brand-fg">分享你的寄语</h3>
              <p className="mt-1 text-xs leading-6 text-gray-600">
                欢迎校友通过{" "}
                <Link href="/contact" className="text-brand underline hover:text-brand-fg transition-colors">
                  联系我们
                </Link>{" "}
                分享你对学弟学妹的寄语。请注明你的入学年份和想说的话，我们将在审核后发布。
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
                本页面内容为校友经验分享和通用整理，不代表燕川中学或校友会官方意见。每个人的经历和感受不同，请理性参考。
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/students" variant="secondary" icon={ArrowLeft}>
            返回资源站
          </ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            联系我们
          </ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}
