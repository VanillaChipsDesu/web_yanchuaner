"use client";

import Link from "next/link";
import MobileNav from "./MobileNav";
import { useStickyHeader } from "@/hooks/useStickyHeader";
import { cn } from "@/components/ui/cn";

export default function Header() {
  const visible = useStickyHeader();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[#7C3AED]/5 bg-white/60 backdrop-blur-xl transition-transform duration-300 hover:border-[#7C3AED]/10",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-5 md:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="返回首页：燕中数字母港"
          tabIndex={0}
          className="group relative shrink-0 text-lg font-bold tracking-wide text-[#7C3AED] transition-colors duration-300 hover:text-[#5B21B6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF] rounded-sm cursor-pointer font-heading"
        >
          {"燕中数字母港"}
          <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)] transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <MobileNav />
      </div>
    </header>
  );
}
