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
    const news = await prisma.news.findUnique({ where: { id: params.id } });
    if (!news) {
      return NextResponse.json({ error: "新闻不存在" }, { status: 404 });
    }
    return NextResponse.json({ news });
  } catch (error) {
    console.error("Admin news GET error:", error);
    return NextResponse.json({ error: "获取新闻详情失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.news.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "新闻不存在" }, { status: 404 });
    }

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

    let publishedAt = existing.publishedAt;
    if (body.publishedAt !== undefined) {
      publishedAt = body.publishedAt ? new Date(String(body.publishedAt)) : null;
    }
    // 从 DRAFT 改为 PUBLISHED 且 publishedAt 为空时自动设置
    if (
      existing.status !== "PUBLISHED" &&
      status === "PUBLISHED" &&
      !publishedAt
    ) {
      publishedAt = new Date();
    }

    const news = await prisma.news.update({
      where: { id: params.id },
      data: {
        title,
        summary: summary || null,
        content,
        imageUrl: imageUrl || null,
        status: status || existing.status,
        publishedAt,
      },
    });

    return NextResponse.json({ news });
  } catch (error: any) {
    console.error("Admin news PUT error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: "更新新闻失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.news.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "新闻不存在" }, { status: 404 });
    }

    await prisma.news.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin news DELETE error:", error);
    return NextResponse.json({ error: "删除新闻失败" }, { status: 500 });
  }
}
