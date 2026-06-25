import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const existing = await prisma.contentSection.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '内容不存在' }, { status: 404 });

    const body = await readJsonBody<{
      title?: unknown;
      description?: unknown;
      note?: unknown;
      icon?: unknown;
      href?: unknown;
      actionLabel?: unknown;
      yearLabel?: unknown;
      sortOrder?: unknown;
    }>(req, 16384); // 16KB limit

    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    const note = typeof body.note === "string" ? body.note.trim() : undefined;
    const icon = typeof body.icon === "string" ? body.icon.trim() : undefined;
    const href = typeof body.href === "string" ? body.href.trim() : undefined;
    const actionLabel = typeof body.actionLabel === "string" ? body.actionLabel.trim() : undefined;
    const yearLabel = typeof body.yearLabel === "string" ? body.yearLabel.trim() : undefined;

    if (body.title !== undefined && (!title || title.length > 100)) {
      return NextResponse.json({ error: '标题不能为空且不超过100字' }, { status: 400 });
    }
    if (description !== undefined && description.length > 500) {
      return NextResponse.json({ error: '描述不超过500字' }, { status: 400 });
    }
    if (note !== undefined && note.length > 500) {
      return NextResponse.json({ error: '备注不超过500字' }, { status: 400 });
    }
    if (icon !== undefined && icon.length > 50) {
      return NextResponse.json({ error: '图标长度不超过50字' }, { status: 400 });
    }
    if (href !== undefined && href.length > 254) {
      return NextResponse.json({ error: '链接长度不超过254字' }, { status: 400 });
    }
    if (actionLabel !== undefined && actionLabel.length > 50) {
      return NextResponse.json({ error: '按钮标签不超过50字' }, { status: 400 });
    }
    if (yearLabel !== undefined && yearLabel.length > 20) {
      return NextResponse.json({ error: '年份标签不超过20字' }, { status: 400 });
    }

    const section = await prisma.contentSection.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(note !== undefined && { note }),
        ...(icon !== undefined && { icon: icon || 'BookOpen' }),
        ...(href !== undefined && { href: href || null }),
        ...(actionLabel !== undefined && { actionLabel: actionLabel || null }),
        ...(yearLabel !== undefined && { yearLabel: yearLabel || null }),
        ...(typeof body.sortOrder === 'number' && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json({ section });
  } catch (error: any) {
    console.error('Admin content PUT error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const existing = await prisma.contentSection.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '内容不存在' }, { status: 404 });

    await prisma.contentSection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin content DELETE error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
