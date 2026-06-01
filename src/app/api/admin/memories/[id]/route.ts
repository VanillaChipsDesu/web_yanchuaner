import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const existing = await prisma.memoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '记忆条目不存在' }, { status: 404 });
    }

    const body = await req.json();
    const title = (body.title || '').trim();

    // 支持部分更新：只有传了 title 才校验非空
    if (body.title !== undefined && !title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const item = await prisma.memoryItem.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title }),
        ...(body.subtitle !== undefined && { subtitle: (body.subtitle || '').trim() }),
        ...(body.description !== undefined && { description: (body.description || '').trim() }),
        ...(body.imagePath !== undefined && { imagePath: (body.imagePath || '').trim() }),
        ...(body.imageAlt !== undefined && { imageAlt: (body.imageAlt || '').trim() }),
        ...(body.icon !== undefined && { icon: (body.icon || 'camera').trim() }),
        ...(typeof body.sortOrder === 'number' && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Admin memories PUT error:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const existing = await prisma.memoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '记忆条目不存在' }, { status: 404 });
    }

    await prisma.memoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin memories DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
