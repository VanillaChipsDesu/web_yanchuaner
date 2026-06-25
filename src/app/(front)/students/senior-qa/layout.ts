import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学长问答",
  description: "燕中校友数字母港 — 面向在校生和家长的学长问答精选，解答专业选择、志愿填报、大学适应等常见困惑",
};

export default function SeniorQALayout({ children }: { children: React.ReactNode }) {
  return children;
}
