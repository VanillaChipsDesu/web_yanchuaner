import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAccessOrAdmin } from '@/lib/admin-auth';

export const dynamic = "force-dynamic";

/** Look up alumni by exact name. Used by certificate page for identity validation. */
export async function GET(req: NextRequest) {
  const auth = requireAccessOrAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const name = (searchParams.get('name') || '').trim();

    if (!name) {
      return NextResponse.json({ found: false, match: null });
    }

    const record = await prisma.whitelistRoster.findFirst({
      where: { name: { equals: name } },
    });

    if (!record) {
      return NextResponse.json({ found: false, match: null });
    }

    return NextResponse.json({
      found: true,
      match: {
        id: record.id,
        name: record.name,
        graduationClass: record.graduationClass || '',
      },
    });
  } catch (error) {
    console.error('Alumni verify error:', error);
    return NextResponse.json({ found: false, match: null, error: 'Verification failed' }, { status: 500 });
  }
}
