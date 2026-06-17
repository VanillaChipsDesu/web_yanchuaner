/**
 * 轻量类名合并工具（零依赖）。
 * 过滤掉 falsy 值后用空格连接，等价于常见的 clsx 基础用法。
 * 用于在组件中按条件拼接 Tailwind 类名。
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
