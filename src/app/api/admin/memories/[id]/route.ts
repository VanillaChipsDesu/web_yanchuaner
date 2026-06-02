import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { renameToCategoryPath } from '@/lib/memories';

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

    const newIcon = body.icon !== undefined ? (body.icon || 'camera').trim() : existing.icon;
    const newSortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : existing.sortOrder;
    const newImagePath = body.imagePath !== undefined ? (body.imagePath || '').trim() : existing.imagePath;

    const item = await prisma.memoryItem.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title }),
        ...(body.subtitle !== undefined && { subtitle: (body.subtitle || '').trim() }),
        ...(body.description !== undefined && { description: (body.description || '').trim() }),
        ...(body.imagePath !== undefined && { imagePath: newImagePath }),
        ...(body.imageAlt !== undefined && { imageAlt: (body.imageAlt || '').trim() }),
        ...(body.icon !== undefined && { icon: newIcon }),
        ...(typeof body.sortOrder === 'number' && { sortOrder: newSortOrder }),
      },
    });

    // 图片路径或排序变化 → 按板块规范重命名
    const pathChanged = newImagePath !== existing.imagePath;
    const orderChanged = typeof body.sortOrder === 'number' && body.sortOrder !== existing.sortOrder;
    if ((pathChanged || orderChanged) && item.imagePath) {
      const renamed = renameToCategoryPath(item.imagePath, newIcon, newSortOrder);
      if (renamed !== item.imagePath) {
        await prisma.memoryItem.update({
          where: { id },
          data: { imagePath: renamed },
        });
        item.imagePath = renamed;
      }
    }

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
