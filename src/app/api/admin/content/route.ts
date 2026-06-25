import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');

  try {
    const where = page ? { page } : {};
    const sections = await prisma.contentSection.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      take: 200,
    });
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Admin content GET error:', error);
    return NextResponse.json({ error: '加载失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await readJsonBody<{
      title?: unknown;
      page?: unknown;
      description?: unknown;
      note?: unknown;
      icon?: unknown;
      href?: unknown;
      actionLabel?: unknown;
      yearLabel?: unknown;
    }>(req, 16384); // 16KB limit

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const page = typeof body.page === "string" ? body.page.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const icon = typeof body.icon === "string" ? body.icon.trim() : "";
    const href = typeof body.href === "string" ? body.href.trim() : "";
    const actionLabel = typeof body.actionLabel === "string" ? body.actionLabel.trim() : "";
    const yearLabel = typeof body.yearLabel === "string" ? body.yearLabel.trim() : "";

    if (!title || title.length > 100) {
      return NextResponse.json({ error: '标题不能为空且不超过100字' }, { status: 400 });
    }
    if (!page || page.length > 50) {
      return NextResponse.json({ error: '页面标识不能为空且不超过50字' }, { status: 400 });
    }
    if (description.length > 500) {
      return NextResponse.json({ error: '描述不超过500字' }, { status: 400 });
    }
    if (note.length > 500) {
      return NextResponse.json({ error: '备注不超过500字' }, { status: 400 });
    }
    if (icon.length > 50) {
      return NextResponse.json({ error: '图标长度不超过50字' }, { status: 400 });
    }
    if (href.length > 254) {
      return NextResponse.json({ error: '链接长度不超过254字' }, { status: 400 });
    }
    if (actionLabel.length > 50) {
      return NextResponse.json({ error: '按钮标签不超过50字' }, { status: 400 });
    }
    if (yearLabel.length > 20) {
      return NextResponse.json({ error: '年份标签不超过20字' }, { status: 400 });
    }

    const maxSort = await prisma.contentSection.findFirst({
      where: { page },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (maxSort?.sortOrder ?? -1) + 1;

    const section = await prisma.contentSection.create({
      data: {
        page,
        title,
        description,
        note,
        icon: icon || 'BookOpen',
        href: href || null,
        actionLabel: actionLabel || null,
        yearLabel: yearLabel || null,
        sortOrder,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error: any) {
    console.error('Admin content POST error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
