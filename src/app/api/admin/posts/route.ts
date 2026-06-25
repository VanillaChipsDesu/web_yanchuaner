import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // 强校验分页参数，防御 NaN / 负数
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;

    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    const where = status ? { status } : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { author: { select: { name: true } } },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({ posts, total, limit, offset });
  } catch (error) {
    console.error('Admin posts GET error:', error);
    return NextResponse.json({ error: '获取帖子列表失败' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  try {
    const body = await readJsonBody<{ id?: unknown; status?: unknown }>(req, 16384); // 16KB limit
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!id || !status) {
      return NextResponse.json({ error: '帖子ID和状态为必填项' }, { status: 400 });
    }

    if (!['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Admin posts PATCH error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '更新帖子状态失败' }, { status: 500 });
  }
}
