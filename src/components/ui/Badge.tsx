import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Tone = "brand" | "neutral" | "success" | "warning" | "info" | "danger";

const TONES: Record<Tone, string> = {
  brand: "border-brand/20 bg-brand/10 text-brand",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

/**
 * 标签胶囊。替代各处手写的类别 / 状态小标签。
 */
export function Badge({
  children,
  tone = "brand",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon size={13} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
