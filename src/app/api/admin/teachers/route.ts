import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const sections = await prisma.teacherSection.findMany({
      orderBy: { sortOrder: 'asc' },
      take: 200, // 限制拉取最大条数，防全拉 DoS
    });
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Admin teachers GET error:', error);
    return NextResponse.json({ error: '加载失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await readJsonBody<{
      title?: unknown;
      description?: unknown;
      note?: unknown;
      icon?: unknown;
      href?: unknown;
      actionLabel?: unknown;
    }>(req, 16384); // 16KB limit

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const icon = typeof body.icon === "string" ? body.icon.trim() : "";
    const href = typeof body.href === "string" ? body.href.trim() : "";
    const actionLabel = typeof body.actionLabel === "string" ? body.actionLabel.trim() : "";

    if (!title) return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    if (title.length > 100) return NextResponse.json({ error: '标题长度不超过100字' }, { status: 400 });
    if (description.length > 500) return NextResponse.json({ error: '描述不超过500字' }, { status: 400 });
    if (note.length > 500) return NextResponse.json({ error: '备注不超过500字' }, { status: 400 });
    if (icon.length > 50) return NextResponse.json({ error: '图标长度不超过50字' }, { status: 400 });
    if (href.length > 254) return NextResponse.json({ error: '链接长度不超过254字' }, { status: 400 });
    if (actionLabel.length > 50) return NextResponse.json({ error: '按钮标签不超过50字' }, { status: 400 });

    const maxSort = await prisma.teacherSection.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (maxSort?.sortOrder ?? -1) + 1;

    const section = await prisma.teacherSection.create({
      data: {
        title,
        description,
        note,
        icon: icon || 'BookOpen',
        href: href || null,
        actionLabel: actionLabel || null,
        sortOrder,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error: any) {
    console.error('Admin teachers POST error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
