import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted";

const VARIANTS: Record<Variant, string> = {
  // CTA 绿，用于主要动作
  primary: "bg-accent text-white hover:opacity-90 shadow-sm hover:-translate-y-0.5",
  // 描边紫，用于次要动作
  secondary:
    "border border-brand/40 bg-surface text-brand hover:bg-brand/5 hover:-translate-y-0.5",
  // 无边框，用于轻量操作
  ghost: "text-brand hover:bg-brand/10",
  // 危险操作（删除等）
  danger: "text-rose-600 hover:bg-rose-50",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
};

function classesFor(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-btn font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    FOCUS_RING,
    className,
  );
}

type BaseProps = {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

/**
 * 统一按钮。替代散落各处的 btn-primary / btn-secondary + 手抄的 focus 环类名。
 * 用 `href` 渲染为 Next.js Link，否则渲染为 <button>。
 */
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className,
  ...rest
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classesFor(variant, size, className)} {...rest}>
      {Icon ? <Icon size={size === "sm" ? 14 : 16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/**
 * 链接样式按钮（语义为导航，渲染为 <a> / Next Link）。
 */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  icon: Icon,
  children,
  className,
  href,
  ...rest
}: BaseProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) {
  return (
    <Link href={href} className={classesFor(variant, size, className)} {...rest}>
      {Icon ? <Icon size={size === "sm" ? 14 : 16} aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}
