export const revalidate = 60;

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "校友活动",
  description: "燕川中学校友活动 — 返校聚会、线上讲座、校友交流活动的信息发布与在线报名",
};
import prisma from "@/lib/db";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { eventDate: "asc" },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="EVENTS"
          eyebrowIcon={CalendarDays}
          title="校友活动"
          description="返校聚会、线上讲座、校友交流活动的信息与报名"
          action={<ButtonLink href="/" variant="secondary">返回首页</ButtonLink>}
        />

        <div className="mt-8">
          {events.length === 0 ? (
            <EmptyState title="暂无活动" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => {
                const isPast = new Date(event.eventDate) < new Date();
                const registrationCount = event._count.registrations;

                return (
                  <article
                    key={event.id}
                    className={`card flex flex-col overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-md ${
                      isPast
                        ? "border-gray-200 bg-gray-50 opacity-70 hover:shadow-none hover:-translate-y-0"
                        : "border-gray-200 bg-surface hover:border-brand/30"
                    }`}
                  >
                    {event.coverImage && (
                      <div className="relative -mx-5 -mt-5 mb-4 aspect-video overflow-hidden border-b border-gray-100">
                        <Image
                          src={event.coverImage}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${
                        isPast ? "border border-gray-300 text-gray-500 bg-surface" : "border border-brand/20 bg-brand/10 text-brand"
                      }`}>
                        {isPast ? "已结束" : "报名中"}
                      </span>
                    </div>
                    <h2 className="font-heading text-lg font-semibold text-brand-fg">{event.title}</h2>
                    {event.summary && <p className="mt-2 text-sm leading-6 text-gray-700 line-clamp-2">{event.summary}</p>}
                    <div className="mt-4 flex-1 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="text-brand" />
                        {new Date(event.eventDate).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {event.endDate && ` — ${new Date(event.endDate).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={14} className="text-brand" />
                          {event.location}
                        </div>
                      )}
                      {!isPast && event.maxAttendees && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users size={14} className="text-brand" />
                          已报名 {registrationCount}{event.maxAttendees ? `/${event.maxAttendees}人` : ""}
                        </div>
                      )}
                    </div>
                    {!isPast && (
                      <div className="mt-5 flex justify-end">
                        <ButtonLink href={`/events/${event.id}`} variant="primary">
                          查看详情 & 报名
                        </ButtonLink>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </PageShell>
  );
}
