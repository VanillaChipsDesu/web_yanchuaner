import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "大学城市分布",
  description: "燕中校友数字母港 — 看看燕中校友的大学足迹点亮了哪些城市",
};

export default function UniversityMapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
