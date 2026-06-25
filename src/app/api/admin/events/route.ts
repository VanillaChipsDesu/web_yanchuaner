import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // 强校验分页参数，防御 NaN / 负数
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;

    const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
    const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    const where = status ? { status } : {};

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { _count: { select: { registrations: true } } },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({ events, total, limit, offset });
  } catch (error) {
    console.error("Admin events GET error:", error);
    return NextResponse.json({ error: "获取活动列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
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
    if (!eventDate) {
      return NextResponse.json({ error: "活动时间不能为空" }, { status: 400 });
    }
    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 });
    }

    let parsedMax: number | null = null;
    if (maxAttendees !== null && maxAttendees !== undefined && maxAttendees !== "") {
      parsedMax = parseInt(String(maxAttendees), 10);
      if (isNaN(parsedMax) || parsedMax < 1) {
        return NextResponse.json({ error: "报名人数上限必须为正整数或留空" }, { status: 400 });
      }
    }

    const parsedEventDate = new Date(eventDate);
    if (isNaN(parsedEventDate.getTime())) {
      return NextResponse.json({ error: "活动时间格式错误" }, { status: 400 });
    }

    let parsedEndDate: Date | null = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: "结束时间格式错误" }, { status: 400 });
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        summary: summary || null,
        content,
        location: location || null,
        eventDate: parsedEventDate,
        endDate: parsedEndDate,
        coverImage: coverImage || null,
        maxAttendees: parsedMax,
        status: status || "DRAFT",
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error("Admin events POST error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: "创建活动失败" }, { status: 500 });
  }
}
