export const revalidate = 60;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Calendar } from "lucide-react";
import prisma from "@/lib/db";

const SITE_URL = process.env.SITE_URL || "https://yanchuaner.cn";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await prisma.news.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    select: { title: true, summary: true },
  });

  if (!article) {
    return { title: "新闻未找到" };
  }

  return {
    title: article.title,
    description: article.summary || article.title,
    openGraph: {
      title: article.title,
      description: article.summary || article.title,
      url: `${SITE_URL}/news/${params.id}`,
    },
  };
}

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const article = await prisma.news.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
  });

  if (!article) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <Link href="/news" className="mb-6 inline-flex items-center gap-1 text-sm text-[#7C3AED] transition hover:text-[#4C1D95] cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]">
          <ArrowLeft size={14} /> 返回新闻列表
        </Link>

        {article.publishedAt && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs text-[#7C3AED]">
            <Calendar size={12} />
            {new Date(article.publishedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        )}

        <h1 className="font-heading text-2xl font-bold text-[#4C1D95] md:text-3xl">{article.title}</h1>
        {article.summary && <p className="mt-3 text-sm leading-7 text-gray-700 md:text-base">{article.summary}</p>}

        <div className="mt-8 border-t border-[#7C3AED]/10 pt-6">
          <div className="max-w-none text-sm leading-7 text-gray-700 md:text-base whitespace-pre-wrap">
            {article.content}
          </div>
        </div>
      </div>
    </section>
  );
}
