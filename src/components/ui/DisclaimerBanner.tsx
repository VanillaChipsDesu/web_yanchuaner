import { Shield } from "lucide-react";
import { cn } from "./cn";

/**
 * 免责声明 / 提示横幅。替代各页面手写的琥珀色声明块。
 *
 * @example
 * <DisclaimerBanner>本页面内容由管理员整理发布……</DisclaimerBanner>
 * <DisclaimerBanner title="免责声明">……</DisclaimerBanner>
 */
export function DisclaimerBanner({
  children,
  title,
  className,
  withIcon = false,
}: {
  children: React.ReactNode;
  /** 可选标题，提供时渲染为「图标 + 标题 + 正文」结构 */
  title?: string;
  className?: string;
  /** 是否显示盾牌图标（仅在无 title 的简洁模式下生效与否） */
  withIcon?: boolean;
}) {
  if (title) {
    return (
      <div
        className={cn(
          "rounded-card border border-amber-200 bg-amber-50 p-5",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Shield size={16} className="text-amber-700" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-amber-800">{title}</h3>
            <p className="mt-1 text-xs leading-6 text-amber-700">{children}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800",
        withIcon && "flex items-start gap-2",
        className,
      )}
    >
      {withIcon ? <Shield size={16} className="mt-1 shrink-0" aria-hidden="true" /> : null}
      <span>{children}</span>
    </div>
  );
}
