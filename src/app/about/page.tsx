import type { Metadata } from "next";
import Link from "next/link";
import { Globe2, GraduationCap, MapPin, Rocket, Users, Building2, History, BookOpen, Star, Heart, MessageSquare, Mail, Shield, School } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "学校介绍 - 深圳市燕川中学",
  description: "深圳市新安中学(集团)燕川中学 - 航天科技特色高中，广东省智慧教育标杆校。了解燕川中学的办学历史、航天特色与校园文化。",
};

const ICON_MAP: Record<string, any> = {
  BookOpen, Star, Heart, MessageSquare, GraduationCap, Mail, Shield, Users, School, Building2, Globe2, MapPin, Rocket, History,
};

export default async function AboutPage() {
  const features = await prisma.contentSection.findMany({
    where: { page: 'about_features' },
    orderBy: { sortOrder: 'asc' },
  });

  const timelineEvents = await prisma.contentSection.findMany({
    where: { page: 'about_timeline' },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-8 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-4 py-1.5 text-sm text-[#7C3AED]">
          <History size={14} />
          深圳市新安中学(集团)成员校
        </div>
        <h1 className="font-heading text-3xl font-bold text-[#4C1D95] md:text-5xl">深圳市燕川中学</h1>
        <p className="mt-4 text-lg text-[#7C3AED] md:text-xl">马踏飞燕 · 海纳百川 · 航天科技特色高中</p>
        <p className="mt-6 max-w-3xl mx-auto text-sm leading-7 text-gray-700 md:text-base">
          深圳市新安中学(集团)燕川中学是深圳市委市政府高起点、高规格、高标准重点建设的现代化全寄宿制公办优质高中。学校坐落于粤港澳大湾区核心地带，以航天科技教育、智慧教育、个性教育三位一体的办学特色，致力于打造中国一流航天科技高中。
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/alumni/radar" className="btn-primary">查看校友通讯录</Link>
          <Link href="/" className="btn-secondary">返回首页</Link>
        </div>
      </div>

      {features.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = ICON_MAP[f.icon] || BookOpen;
            return (
              <article key={f.id} className="card group p-5 transition hover:border-[#7C3AED]/30 hover:shadow-md hover:-translate-y-1">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                  <Icon size={20} className="text-[#7C3AED]" />
                </div>
                <h3 className="font-heading mt-4 text-base font-semibold text-[#4C1D95]">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">{f.description}</p>
              </article>
            );
          })}
        </div>
      )}

      {timelineEvents.length > 0 && (
        <div className="glass-card-base mt-6 p-6">
          <h2 className="font-heading text-xl font-bold text-[#4C1D95] md:text-2xl">发展历程</h2>
          <div className="mt-6 space-y-0">
            {timelineEvents.map((t, idx) => (
              <div key={t.id} className="relative flex gap-4 pb-6">
                {idx < timelineEvents.length - 1 && (
                  <div className="absolute left-[19px] top-10 h-full w-0.5 bg-[#7C3AED]/20" />
                )}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10">
                  <span className="text-xs font-bold text-[#7C3AED]">{(t.yearLabel || '').slice(2)}</span>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-semibold text-[#7C3AED]">{t.yearLabel || ''}</span>
                  <p className="mt-1 text-sm text-gray-700">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center">
        <p className="text-sm leading-7 text-amber-800">
          声明：本页面内容由校友志愿者基于公开资料整理，力求准确。如有更新或修正需求，请联系站长。
        </p>
      </div>
    </section>
  );
}
