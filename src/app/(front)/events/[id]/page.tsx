export const revalidate = 60;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import prisma from "@/lib/db";
import EventRegistrationForm from "@/components/EventRegistrationForm";

const SITE_URL = process.env.SITE_URL || "https://yanchuaner.cn";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await prisma.event.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    select: { title: true, summary: true },
  });

  if (!event) {
    return { title: "活动未找到" };
  }

  return {
    title: event.title,
    description: event.summary || event.title,
    openGraph: {
      title: event.title,
      description: event.summary || event.title,
      url: `${SITE_URL}/events/${params.id}`,
    },
  };
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const isPast = new Date(event.eventDate) < new Date();
  const registrationCount = event._count.registrations;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <Link href="/events" className="mb-6 inline-flex items-center gap-1 text-sm text-[#7C3AED] transition hover:text-[#4C1D95] cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]">
          <ArrowLeft size={14} /> 返回活动列表
        </Link>

        <div className="mb-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            isPast ? "border border-gray-300 text-gray-500 bg-white" : "border border-[#7C3AED]/20 bg-[#7C3AED]/10 text-[#7C3AED]"
          }`}>
            {isPast ? "已结束" : "报名中"}
          </span>
        </div>

        <h1 className="font-heading text-2xl font-bold text-[#4C1D95] md:text-3xl">{event.title}</h1>
        {event.summary && <p className="mt-3 text-sm leading-7 text-gray-700 md:text-base">{event.summary}</p>}

        <div className="mt-6 space-y-3 rounded-2xl border border-[#A78BFA]/20 bg-[#FAF5FF] p-5">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Clock size={18} className="text-[#7C3AED]/60 shrink-0" />
            <span>
              {new Date(event.eventDate).toLocaleString("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              {event.endDate && ` — ${new Date(event.endDate).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin size={18} className="text-[#7C3AED]/60 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Users size={18} className="text-[#7C3AED]/60 shrink-0" />
            <span>已报名 {registrationCount}{event.maxAttendees ? ` / ${event.maxAttendees}人` : " 人"}</span>
          </div>
        </div>

        <div className="mt-8 border-t border-[#7C3AED]/10 pt-6">
          <div className="text-sm leading-7 text-gray-700 md:text-base whitespace-pre-wrap">{event.content}</div>
        </div>

        {!isPast && (
          <EventRegistrationForm
            eventId={event.id}
            registrationCount={registrationCount}
            maxAttendees={event.maxAttendees}
          />
        )}
      </div>
    </section>
  );
}
