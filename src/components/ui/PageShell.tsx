import { cn } from "./cn";

/**
 * 页面外层容器：统一最大宽度、水平内边距与垂直留白。
 * 替代各页面重复书写的 `mx-auto w-full max-w-6xl px-4 py-12 md:px-8`。
 */
export function PageShell({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  /** 内容宽度：narrow 用于表单/联系页，default 用于常规内容，wide 用于地图/列表 */
  size?: "narrow" | "default" | "wide";
}) {
  const maxWidth =
    size === "narrow" ? "max-w-3xl" : size === "wide" ? "max-w-7xl" : "max-w-6xl";

  return (
    <section
      className={cn(
        "mx-auto w-full px-4 py-10 md:px-8 md:py-12",
        maxWidth,
        className,
      )}
    >
      {children}
    </section>
  );
}
