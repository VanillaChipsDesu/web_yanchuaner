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
    const news = await prisma.news.findUnique({ where: { id: params.id } });
    if (!news) {
      return NextResponse.json({ error: "新闻不存在" }, { status: 404 });
    }
    return NextResponse.json({ news });
  } catch (error) {
    console.error("Admin news GET error:", error);
    return NextResponse.json({ error: "获取新闻失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.news.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "新闻不存在" }, { status: 404 });
    }

    const body = await req.json();
    const { title, summary, content, imageUrl, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }

    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 });
    }

    let publishedAt = existing.publishedAt;
    if (body.publishedAt !== undefined) {
      publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
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
        title: title.trim(),
        summary: summary?.trim() || null,
        content: content.trim(),
        imageUrl: imageUrl?.trim() || null,
        status: status || existing.status,
        publishedAt,
      },
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error("Admin news PUT error:", error);
    return NextResponse.json({ error: "更新新闻失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
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
