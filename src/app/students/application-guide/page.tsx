import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Shield } from "lucide-react";
import { PageShell, GlassCard, PageHeader, ButtonLink } from "@/components/ui";
import { guideCards } from "@/data/studentResources";

export const metadata: Metadata = {
  title: "志愿填报参考",
  description: "燕中校友数字母港 — 高考志愿填报参考信息，帮助在校生和家长理解分数、位次、专业与院校选择的思考框架",
};

export default function ApplicationGuidePage() {
  return (
    <PageShell size="default">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="APPLICATION GUIDE"
          eyebrowIcon={BookOpen}
          title="志愿填报参考"
          description="帮助在校生和家长理解高考志愿填报的核心概念与思考框架。所有信息仅供参考，具体填报请以官方发布为准。"
        />

        {/* Risk Alert */}
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-start gap-2">
            <Shield size={16} className="mt-0.5 shrink-0 text-rose-500" />
            <div>
              <h3 className="text-sm font-semibold text-rose-700">风险提示</h3>
              <p className="mt-1 text-xs leading-6 text-rose-600">
                不存在「保证录取」的内部渠道，所有正规录取都通过考试院系统。不要轻信「低分上名校」等虚假宣传，谨防志愿填报诈骗。提交前反复核对院校代码和专业代码，保留所有填报截图和确认信息。
              </p>
            </div>
          </div>
        </div>

        {/* Guide Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guideCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-brand/10 bg-surface/50 p-5">
              <h3 className="font-heading text-base font-semibold text-brand-fg">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{card.summary}</p>
              <ul className="mt-3 space-y-2">
                {card.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-5 text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/40" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Shield size={16} className="text-amber-700" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber-800">免责声明</h3>
              <p className="mt-1 text-xs leading-6 text-amber-700">
                本页面内容仅供参考，不构成报考、录取或职业选择承诺。涉及招生政策、录取规则和专业设置时，请以教育考试院、招生院校官网和当年招生章程为准。燕川中学及校友会不对因使用本页面信息导致的任何后果承担责任。
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
