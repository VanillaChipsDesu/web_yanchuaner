import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

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

    const where = status && status !== 'ALL' ? { status } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          username: true,
          email: true,
          emailVerified: true,
          name: true,
          contact: true,
          graduationClass: true,
          className: true,
          role: true,
          status: true,
          accountStatus: true,
          claimedAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, limit, offset });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  return NextResponse.json(
    { error: '请使用 /api/admin/users/[id]/actions 执行固定管理操作' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}
