import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

/**
 * 空状态：虚线框 + 图标 + 提示文案。
 * 替代 10+ 处手写的「暂无数据」占位块。
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-gray-300 bg-gray-50 py-16 text-center text-gray-400",
        className,
      )}
    >
      {Icon ? <Icon size={48} className="mb-3 opacity-40" aria-hidden="true" /> : null}
      <p className="text-sm">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-400">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
