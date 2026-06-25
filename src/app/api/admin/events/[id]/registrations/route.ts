import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        eventDate: true,
        maxAttendees: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "desc" },
      take: 300, // 防御大量数据导致 OOM
    });

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        maxAttendees: event.maxAttendees,
        registrationCount: event._count.registrations,
      },
      registrations,
    });
  } catch (error) {
    console.error("Admin registrations GET error:", error);
    return NextResponse.json({ error: "获取报名列表失败" }, { status: 500 });
  }
}
