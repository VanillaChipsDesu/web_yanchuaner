"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, HelpCircle, ChevronRight, Shield } from "lucide-react";
import { PageShell, GlassCard, PageHeader, ButtonLink } from "@/components/ui";
import { qaItems } from "@/data/studentResources";

export default function SeniorQAPage() {
  return (
    <PageShell size="default">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="SENIOR Q&A"
          eyebrowIcon={BookOpen}
          title="学长问答"
          description="精选问答，解答在校生和家长关于专业选择、志愿填报、大学适应的常见困惑。内容持续征集中。"
        />

        {/* How to Ask */}
        <div className="mt-8 rounded-2xl border border-brand/10 bg-surface-muted p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
              <HelpCircle size={18} className="text-brand" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-brand-fg">如何让提问更有效</h3>
              <p className="mt-1 text-xs leading-6 text-gray-600">
                在提问前先做好功课，了解学校和专业的基本信息，然后针对自己真正关心的具体问题提问。避免问「这所学校怎么样」这类过于宽泛的问题。一个有效的问题通常包含：你的基本情况、感兴趣的方向、具体想了解的内容。
              </p>
            </div>
          </div>
        </div>

        {/* Q&A List */}
        <div className="mt-6 space-y-4">
          {qaItems.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-brand/10 bg-surface/50 transition hover:border-brand/20"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 list-none">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-brand-fg md:text-base">
                    {item.question}
                  </h3>
                  {item.tags && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full border border-brand/10 bg-brand/5 px-2 py-0.5 text-[11px] text-brand/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-brand-fg/40 transition duration-200 group-open:rotate-90" />
              </summary>
              <div className="border-t border-brand/5 px-5 py-4">
                <p className="text-sm leading-7 text-gray-600">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>

        {/* More Questions */}
        <div className="mt-6 rounded-xl border border-brand/10 bg-surface-muted px-5 py-4">
          <p className="text-sm leading-6 text-brand-fg/70">
            有更多问题？欢迎通过{" "}
            <Link href="/contact" className="text-brand underline hover:text-brand-fg transition-colors">
              联系我们
            </Link>{" "}
            提交你的问题，我们将邀请相关领域的校友回答。精选问答持续更新中。
          </p>
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
                本页面问答内容为通用建议，非个性化报考或职业指导。每个人的情况不同，具体决策请结合自身实际和官方信息。问答不代表燕川中学或校友会官方意见。
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
