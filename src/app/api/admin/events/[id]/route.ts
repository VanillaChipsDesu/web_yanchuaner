import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Admin events GET error:", error);
    return NextResponse.json({ error: "获取活动失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.event.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    const body = await req.json();
    const { title, summary, content, location, eventDate, endDate, coverImage, maxAttendees, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }
    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 });
    }

    let parsedMax: number | null = existing.maxAttendees;
    if (maxAttendees !== undefined) {
      if (maxAttendees === null || maxAttendees === "") {
        parsedMax = null;
      } else {
        parsedMax = parseInt(String(maxAttendees), 10);
        if (isNaN(parsedMax) || parsedMax < 1) {
          return NextResponse.json({ error: "报名人数上限必须为正整数或留空" }, { status: 400 });
        }
      }
    }

    const parsedEventDate = eventDate ? new Date(eventDate) : existing.eventDate;
    if (eventDate && isNaN(parsedEventDate.getTime())) {
      return NextResponse.json({ error: "活动时间格式错误" }, { status: 400 });
    }

    let parsedEndDate: Date | null = existing.endDate;
    if (endDate !== undefined) {
      parsedEndDate = endDate ? new Date(endDate) : null;
      if (endDate && isNaN(parsedEndDate!.getTime())) {
        return NextResponse.json({ error: "结束时间格式错误" }, { status: 400 });
      }
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        summary: summary?.trim() || null,
        content: content.trim(),
        location: location?.trim() || null,
        eventDate: parsedEventDate,
        endDate: parsedEndDate,
        coverImage: coverImage?.trim() || null,
        maxAttendees: parsedMax,
        status: status || existing.status,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Admin events PUT error:", error);
    return NextResponse.json({ error: "更新活动失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.event.findUnique({
      where: { id: params.id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    if (existing._count.registrations > 0) {
      return NextResponse.json(
        { error: "该活动已有报名记录，暂不允许删除。请先保留或导出报名数据后再处理。" },
        { status: 400 },
      );
    }

    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin events DELETE error:", error);
    return NextResponse.json({ error: "删除活动失败" }, { status: 500 });
  }
}
