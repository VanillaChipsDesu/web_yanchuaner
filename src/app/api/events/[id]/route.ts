import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { requireVerifiedAlumni } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const event = await prisma.event.findFirst({
      where: { id, status: "PUBLISHED" },
      select: {
        id: true, title: true, summary: true, content: true,
        location: true, eventDate: true, endDate: true,
        coverImage: true, maxAttendees: true, status: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...event,
      registrationCount: event._count.registrations,
      _count: undefined,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  // 限流：每 30 秒 3 次
  const ip = getClientIp(req);
  const limit = await rateLimit(`event-reg:${ip}`, 3, 30_000);
  if (!limit.ok) {
    return NextResponse.json({ error: '报名过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await readJsonBody<any>(req, 4096);
    const { name, contact, message } = body;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: "Name is required and must be a string" }, { status: 400 });
    }
    const safeName = name.trim();
    const safeContact = typeof contact === 'string' ? contact.trim() : null;
    const safeMessage = typeof message === 'string' ? message.trim() : null;

    if (safeName.length > 50 || (safeContact && safeContact.length > 100) || (safeMessage && safeMessage.length > 500)) {
       return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    const event = await prisma.event.findFirst({ where: { id, status: "PUBLISHED" } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // 事务保护：防止并发报名超限
    const registration = await prisma.$transaction(async (tx) => {
      if (event.maxAttendees) {
        const count = await tx.eventRegistration.count({ where: { eventId: id } });
        if (count >= event.maxAttendees) {
          throw new Error("FULL");
        }
      }
      return tx.eventRegistration.create({
        data: { eventId: id, name: safeName, contact: safeContact, message: safeMessage },
      });
    });

    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch (e: any) {
    if (e.message === "FULL") {
      return NextResponse.json({ error: "报名已满" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
