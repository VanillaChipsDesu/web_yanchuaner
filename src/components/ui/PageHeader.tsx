import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

/**
 * 页面页头：胶囊标签（eyebrow）+ 主标题 + 描述。
 * 替代 15 个内容页逐字复制的「胶囊标签 + H1 + 描述」结构。
 *
 * @example
 * <PageHeader eyebrow="CONTACT" eyebrowIcon={Mail} title="联系我们" description="..." />
 */
export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  action,
  className,
}: {
  /** 胶囊里的英文小标签，如 "CONTACT" */
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  description?: string;
  /** 右侧操作区（如「返回首页」按钮） */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs tracking-[0.18em] text-brand">
            {EyebrowIcon ? <EyebrowIcon size={14} aria-hidden="true" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading mt-3 text-3xl font-bold text-brand-fg md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
