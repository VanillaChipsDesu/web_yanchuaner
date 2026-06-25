import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireVerifiedAlumni } from "@/lib/admin-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const article = await prisma.news.findFirst({
      where: { id, status: "PUBLISHED" },
      select: { id: true, title: true, summary: true, content: true, imageUrl: true, publishedAt: true, createdAt: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
