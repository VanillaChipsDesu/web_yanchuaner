import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const search = new URL(req.url).searchParams.get("search")?.trim() || "";
    if (search.length > 50) {
      return NextResponse.json({ error: "搜索关键字过长" }, { status: 400 });
    }

    const [claims, candidates] = await Promise.all([
      prisma.userClaimRequest.findMany({
        where: { status: "PENDING" },
        include: {
          claimant: {
            select: {
              id: true,
              username: true,
              email: true,
              name: true,
              graduationClass: true,
              className: true,
              contact: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 200, // 增加硬上限，防御大表全拉
      }),
      prisma.user.findMany({
        where: {
          username: null,
          email: null,
          passwordHash: null,
          mergedIntoUserId: null,
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { contact: { contains: search } },
                  { identityCode: { contains: search } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          contact: true,
          identityCode: true,
          createdAt: true,
          _count: { select: { posts: true } },
        },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ claims, candidates });
  } catch (error) {
    console.error("Admin user claims GET error:", error);
    return NextResponse.json(
      { error: "获取认领申请列表失败" },
      { status: 500 },
    );
  }
}
