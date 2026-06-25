import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
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
    return NextResponse.json({ error: "获取活动详情失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.event.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    const body = await readJsonBody<{
      title?: unknown;
      summary?: unknown;
      content?: unknown;
      location?: unknown;
      eventDate?: unknown;
      endDate?: unknown;
      coverImage?: unknown;
      maxAttendees?: unknown;
      status?: unknown;
    }>(req, 524288); // 512KB limit (contains long text)

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const coverImage = typeof body.coverImage === "string" ? body.coverImage.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";
    const eventDate = typeof body.eventDate === "string" ? body.eventDate.trim() : "";
    const endDate = typeof body.endDate === "string" ? body.endDate.trim() : "";
    const maxAttendees = body.maxAttendees;

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (title.length > 100) {
      return NextResponse.json({ error: "标题长度不超过100字" }, { status: 400 });
    }
    if (summary.length > 500) {
      return NextResponse.json({ error: "摘要长度不超过500字" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }
    if (content.length > 10000) {
      return NextResponse.json({ error: "正文长度不超过10000字" }, { status: 400 });
    }
    if (location.length > 200) {
      return NextResponse.json({ error: "地址长度不超过200字" }, { status: 400 });
    }
    if (coverImage.length > 254) {
      return NextResponse.json({ error: "封面链接长度不超过254字" }, { status: 400 });
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
        title,
        summary: summary || null,
        content,
        location: location || null,
        eventDate: parsedEventDate,
        endDate: parsedEndDate,
        coverImage: coverImage || null,
        maxAttendees: parsedMax,
        status: status || existing.status,
      },
    });

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error("Admin events PUT error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: "更新活动失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
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
