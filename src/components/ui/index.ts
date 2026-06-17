/**
 * UI 基础组件库统一出口。
 *
 * 用法：import { GlassCard, PageHeader, Button } from "@/components/ui";
 *
 * 设计原则：
 * - 所有组件只负责「渲染」，不含数据拉取逻辑（数据层见 @/hooks）。
 * - 颜色一律使用 tailwind 语义令牌（text-brand / bg-surface / border-line 等），
 *   不裸写十六进制色值。
 */
export { cn } from "./cn";
export { PageShell } from "./PageShell";
export { GlassCard, SectionHeader } from "./GlassCard";
export { PageHeader } from "./PageHeader";
export { Button, ButtonLink } from "./Button";
export { Badge } from "./Badge";
export { EmptyState } from "./EmptyState";
export { DisclaimerBanner } from "./DisclaimerBanner";
