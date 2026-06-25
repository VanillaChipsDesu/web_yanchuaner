import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireVerifiedAlumni } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const stories = await prisma.story.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        tags: true,
        body: true,
        date: true,
      },
      orderBy: { date: 'desc' },
    });
    const data = stories.map((s) => ({
      id: s.id,
      title: s.title,
      author: s.author,
      tags: JSON.parse(s.tags || '[]'),
      body: s.body,
      date: s.date,
    }));
    return NextResponse.json({ stories: data });
  } catch (error) {
    console.error('Stories API error:', error);
    return NextResponse.json({ stories: [] }, { status: 500 });
  }
}
