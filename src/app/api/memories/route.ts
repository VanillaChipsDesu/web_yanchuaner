import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await prisma.memoryItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const data = items.map((item) => {
      let hasImage = false;
      if (item.imagePath && item.imagePath.startsWith('/')) {
        const absPath = path.join(process.cwd(), 'public', item.imagePath.replace(/^\/+/, ''));
        hasImage = fs.existsSync(absPath);
      }
      return { ...item, hasImage };
    });

    return NextResponse.json({ items: data });
  } catch (error) {
    console.error('Memories API error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
