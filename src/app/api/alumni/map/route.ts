import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCachedOrFetch } from '@/lib/cache';
import { requireAccessOrAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = requireAccessOrAdmin(req);
  if (auth) return auth;
  try {
    const data = await getCachedOrFetch('api:alumni:map', 300, async () => {
      const records = await prisma.whitelistRoster.findMany({
        select: { name: true, graduationClass: true, tags: true },
        orderBy: { name: 'asc' },
      });

      // Extract city info from tags (format: "大学名 | 专业 | 城市")
      const alumni = records.map((r) => {
        const parts = (r.tags || '').split('|').map((p) => p.trim());
        const city = parts[2] || parts[0] || '';
        return {
          name: r.name,
          graduationClass: r.graduationClass,
          city: city.length > 0 ? city : '未知',
        };
      });

      return { alumni, total: alumni.length };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Map data error:', error);
    return NextResponse.json({ error: 'Failed to load map data', alumni: [] }, { status: 500 });
  }
}
