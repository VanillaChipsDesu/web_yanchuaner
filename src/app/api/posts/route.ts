import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getAuthenticatedUser } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (
    !user ||
    (user.role !== "ADMIN" &&
      (user.role !== "ALUMNI" || user.status !== "VERIFIED"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 限流：每分钟 3 次
  const ip = getClientIp(req);
  const limit = await rateLimit(`posts:${ip}`, 3, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: '提交过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await readJsonBody<any>(req, 65536);
    const { title, content, type } = body;

    if (typeof title !== 'string' || typeof content !== 'string') {
      return NextResponse.json({ error: 'Title and content must be strings' }, { status: 400 });
    }

    const safeTitle = title.trim();
    const safeContent = content.trim();

    if (!safeTitle || !safeContent) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (safeTitle.length > 200 || safeContent.length > 20000) {
      return NextResponse.json({ error: 'Content too long' }, { status: 400 });
    }

    const validTypes = ['STORY', 'EVENT', 'JOB'];
    const postType = validTypes.includes(type) ? type : 'STORY';

    const post = await prisma.post.create({
      data: {
        title: safeTitle,
        content: safeContent,
        type: postType,
        status: 'PENDING',
        authorId: user.id,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Posts POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
