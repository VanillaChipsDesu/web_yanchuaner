import type { Config } from "tailwindcss";

/**
 * 设计令牌单一来源（Single Source of Truth）。
 *
 * 颜色统一引用 globals.css 中的 CSS 变量（--color-*），
 * 这样改主题色只需动一个文件。请优先使用语义令牌（如 text-brand、
 * border-line、bg-surface），不要在页面里裸写十六进制色值。
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-open-sans)", "var(--font-noto-sans-sc)", "sans-serif"],
        heading: ["var(--font-poppins)", "var(--font-noto-sans-sc)", "sans-serif"],
      },
      colors: {
        // ── 语义令牌（推荐使用，支持透明度修饰符如 bg-brand/10）──
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",   // #7C3AED 主色
          soft: "rgb(var(--brand-soft-rgb) / <alpha-value>)", // #A78BFA 辅助色
          fg: "rgb(var(--brand-fg-rgb) / <alpha-value>)",     // #4C1D95 主文本
        },
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",     // #22C55E CTA 绿
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",       // #FFFFFF 卡片
          muted: "rgb(var(--surface-muted-rgb) / <alpha-value>)",   // #FAF5FF 背景
        },
        line: "var(--color-line)",           // 统一描边色（固定透明度）

        // ── 兼容旧色板（逐步迁移，勿新增引用）─────────────
        slate: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
        },
      },
      boxShadow: {
        // 仅保留 3 级层次：静态 / 悬停 / 浮层
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 16px rgba(124,58,237,0.08)",
        lg: "0 12px 32px rgba(124,58,237,0.12)",
      },
      borderRadius: {
        btn: "12px",      // 按钮
        card: "16px",     // 卡片（rounded-2xl 同值）
        modal: "20px",    // 浮层
      },
      transitionTimingFunction: {
        "soft-bounce": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    }
  },
  plugins: []
};

export default config;
