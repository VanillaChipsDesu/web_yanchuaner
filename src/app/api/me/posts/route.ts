import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ posts });
}
