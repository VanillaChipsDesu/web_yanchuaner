import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  try {
    const [pendingUsers, pendingPosts, totalAlumni] = await Promise.all([
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.post.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'ALUMNI' } }),
    ]);

    return NextResponse.json({ pendingUsers, pendingPosts, totalAlumni });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: '获取统计数据失败', pendingUsers: 0, pendingPosts: 0, totalAlumni: 0 },
      { status: 500 },
    );
  }
}
