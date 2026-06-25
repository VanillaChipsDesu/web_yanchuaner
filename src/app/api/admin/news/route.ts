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

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({ news, total, limit, offset });
  } catch (error) {
    console.error("Admin news GET error:", error);
    return NextResponse.json({ error: "获取新闻列表失败" }, { status: 500 });
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
      imageUrl?: unknown;
      status?: unknown;
      publishedAt?: unknown;
    }>(req, 524288); // 512KB limit

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (title.length > 120) {
      return NextResponse.json({ error: "标题长度不超过120字" }, { status: 400 });
    }
    if (summary.length > 500) {
      return NextResponse.json({ error: "摘要长度不超过500字" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }
    if (content.length > 20000) {
      return NextResponse.json({ error: "正文长度不超过20000字" }, { status: 400 });
    }
    if (imageUrl.length > 254) {
      return NextResponse.json({ error: "封面图片链接长度不超过254字" }, { status: 400 });
    }
    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 });
    }

    let publishedAt = body.publishedAt ? new Date(String(body.publishedAt)) : null;
    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    }

    const news = await prisma.news.create({
      data: {
        title,
        summary: summary || null,
        content,
        imageUrl: imageUrl || null,
        status: status || "DRAFT",
        publishedAt,
      },
    });

    return NextResponse.json({ news }, { status: 201 });
  } catch (error: any) {
    console.error("Admin news POST error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: "创建新闻失败" }, { status: 500 });
  }
}
