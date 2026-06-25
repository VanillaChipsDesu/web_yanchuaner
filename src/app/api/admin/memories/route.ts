import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { renameToCategoryPath } from '@/lib/memories';
import { readJsonBody } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const items = await prisma.memoryItem.findMany({
      orderBy: { sortOrder: 'asc' },
      take: 200, // 防御全量数据崩溃
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Admin memories GET error:', error);
    return NextResponse.json({ error: '获取记忆列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await readJsonBody<{
      title?: unknown;
      subtitle?: unknown;
      description?: unknown;
      imagePath?: unknown;
      imageAlt?: unknown;
      icon?: unknown;
    }>(req, 16384); // 16KB limit

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const subtitle = typeof body.subtitle === "string" ? body.subtitle.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const imagePath = typeof body.imagePath === "string" ? body.imagePath.trim() : "";
    const imageAlt = typeof body.imageAlt === "string" ? body.imageAlt.trim() : "";
    const icon = typeof body.icon === "string" ? body.icon.trim() : "camera";

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }
    if (title.length > 100) {
      return NextResponse.json({ error: '标题长度不超过100字' }, { status: 400 });
    }
    if (subtitle.length > 200) {
      return NextResponse.json({ error: '副标题不超过200字' }, { status: 400 });
    }
    if (description.length > 1000) {
      return NextResponse.json({ error: '描述长度不超过1000字' }, { status: 400 });
    }
    if (imagePath.length > 254) {
      return NextResponse.json({ error: '图片路径不超过254字' }, { status: 400 });
    }
    if (imageAlt.length > 200) {
      return NextResponse.json({ error: '图片 ALT 说明不超过200字' }, { status: 400 });
    }
    if (icon.length > 50) {
      return NextResponse.json({ error: '图标不超过50字' }, { status: 400 });
    }

    const maxSort = await prisma.memoryItem.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (maxSort?.sortOrder ?? -1) + 1;

    // 先写入记录
    const item = await prisma.memoryItem.create({
      data: {
        title,
        subtitle,
        description,
        imagePath,
        imageAlt,
        icon,
        sortOrder,
      },
    });

    // 上传的临时文件 → 按板块规范重命名
    const newPath = renameToCategoryPath(imagePath, icon, sortOrder);
    if (newPath !== imagePath) {
      await prisma.memoryItem.update({
        where: { id: item.id },
        data: { imagePath: newPath },
      });
      item.imagePath = newPath;
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('Admin memories POST error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
