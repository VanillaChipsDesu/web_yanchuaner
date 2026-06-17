export const revalidate = 60;

import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "新闻公告",
  description: "燕川中学校友会新闻公告 — 了解母校与校友会的最新动态与通知",
};

export default async function NewsPage() {
  const news = await prisma.news.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      imageUrl: true,
      publishedAt: true,
    },
  });

  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="NEWS"
          eyebrowIcon={Newspaper}
          title="新闻公告"
          description="学校动态、校友会公告与平台资讯"
          action={<ButtonLink href="/" variant="secondary">返回首页</ButtonLink>}
        />

        <div className="mt-8">
          {news.length === 0 ? (
            <EmptyState title="暂无公告" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {news.map((item) => (
                <article key={item.id} className="card group p-5 transition hover:border-brand/30 hover:shadow-md hover:-translate-y-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs text-brand">
                    <Calendar size={12} />
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("zh-CN") : ""}
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-brand-fg transition group-hover:text-brand">{item.title}</h2>
                  {item.summary && <p className="mt-2 text-sm leading-6 text-gray-700 line-clamp-2">{item.summary}</p>}
                  <Link href={`/news/${item.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-brand transition hover:text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus:outline-none rounded"
                  >
                    阅读全文 <ArrowRight size={14} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </PageShell>
  );
}
