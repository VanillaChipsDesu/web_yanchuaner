import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { renameToCategoryPath } from '@/lib/memories';
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
    const existing = await prisma.memoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '记忆条目不存在' }, { status: 404 });
    }

    const body = await readJsonBody<{
      title?: unknown;
      subtitle?: unknown;
      description?: unknown;
      imagePath?: unknown;
      imageAlt?: unknown;
      icon?: unknown;
      sortOrder?: unknown;
    }>(req, 16384); // 16KB limit

    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const subtitle = typeof body.subtitle === "string" ? body.subtitle.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    const imagePath = typeof body.imagePath === "string" ? body.imagePath.trim() : undefined;
    const imageAlt = typeof body.imageAlt === "string" ? body.imageAlt.trim() : undefined;
    const icon = typeof body.icon === "string" ? body.icon.trim() : undefined;

    if (body.title !== undefined && (!title || title.length > 100)) {
      return NextResponse.json({ error: '标题不能为空且不超过100字' }, { status: 400 });
    }
    if (subtitle !== undefined && subtitle.length > 200) {
      return NextResponse.json({ error: '副标题不超过200字' }, { status: 400 });
    }
    if (description !== undefined && description.length > 1000) {
      return NextResponse.json({ error: '描述描述不超过1000字' }, { status: 400 });
    }
    if (imagePath !== undefined && imagePath.length > 254) {
      return NextResponse.json({ error: '图片路径不超过254字' }, { status: 400 });
    }
    if (imageAlt !== undefined && imageAlt.length > 200) {
      return NextResponse.json({ error: '图片 ALT 说明不超过200字' }, { status: 400 });
    }
    if (icon !== undefined && icon.length > 50) {
      return NextResponse.json({ error: '图标不超过50字' }, { status: 400 });
    }

    const newIcon = icon !== undefined ? icon || 'camera' : existing.icon;
    const newSortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : existing.sortOrder;
    const newImagePath = imagePath !== undefined ? imagePath : existing.imagePath;

    const item = await prisma.memoryItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(imagePath !== undefined && { imagePath: newImagePath }),
        ...(imageAlt !== undefined && { imageAlt }),
        ...(icon !== undefined && { icon: newIcon }),
        ...(typeof body.sortOrder === 'number' && { sortOrder: newSortOrder }),
      },
    });

    // 图片路径或排序变化 → 按板块规范重命名 (内部已作防目录穿越处理)
    const pathChanged = imagePath !== undefined && newImagePath !== existing.imagePath;
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
  } catch (error: any) {
    console.error('Admin memories PUT error:', error);
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
    const existing = await prisma.memoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '记忆条目不存在' }, { status: 404 });
    }

    await prisma.memoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin memories DELETE error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
