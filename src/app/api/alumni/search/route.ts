import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAccessOrAdmin } from '@/lib/admin-auth';

export const dynamic = "force-dynamic";

function parseTags(tags: string | null): { university: string; major: string; city: string } {
  if (!tags) return { university: '', major: '', city: '' };
  const parts = tags.split('|').map((p) => p.trim());
  return {
    university: parts[0] || '',
    major: parts[1] || '',
    city: parts[2] || '',
  };
}

export async function GET(req: NextRequest) {
  const auth = requireAccessOrAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const rows = await prisma.whitelistRoster.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { tags: { contains: q } },
          { graduationClass: { contains: q } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    const results = rows.map((r) => {
      const { university, major, city } = parseTags(r.tags ?? null);
      return {
        id: r.id,
        name: r.name,
        graduationClass: r.graduationClass || '',
        tags: r.tags || '',
        university,
        major,
        city,
      };
    });

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error('Alumni search error:', error);
    return NextResponse.json({ error: 'Search failed', results: [], total: 0 }, { status: 500 });
  }
}
