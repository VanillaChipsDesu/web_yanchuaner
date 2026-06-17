import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

/**
 * 卡片容器：统一毛玻璃 / 描边 / 圆角 / 阴影。
 * 替代各页面手写的 `glass-card-base` + 一长串内联 border/bg/shadow 类。
 *
 * @example
 * <GlassCard>...</GlassCard>
 * <GlassCard as="article" className="p-5">...</GlassCard>
 */
export function GlassCard({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** 渲染的 HTML 标签，默认 div */
  as?: "div" | "article" | "section";
}) {
  return <Tag className={cn("glass-card-base", className)}>{children}</Tag>;
}

/**
 * 区块标题：图标 + H2，用于卡片内部或页面分区。
 */
export function SectionHeader({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  /** 右侧操作区（如「查看全部 →」链接） */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        {Icon ? <Icon size={26} className="text-brand" aria-hidden="true" /> : null}
        <h2 className="font-heading text-2xl font-bold text-brand-fg">{title}</h2>
      </div>
      {action}
    </div>
  );
}
