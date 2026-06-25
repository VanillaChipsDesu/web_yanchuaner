import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const q = (searchParams.get("q") || "").trim();

    // 强校验分页参数，防御 NaN / 负数导致的 Prisma 崩溃
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    const rawPageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const pageSize = Number.isInteger(rawPageSize) && rawPageSize > 0 ? Math.min(200, rawPageSize) : 50;

    const where: Record<string, unknown> = {};
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { contact: { contains: q } },
        { reason: { contains: q } },
        { currentName: { contains: q } },
        { requestedName: { contains: q } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.alumniCorrectionRequest.count({ where }),
      prisma.alumniCorrectionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ requests: rows, total, page, pageSize });
  } catch (error) {
    console.error("Admin corrections GET error:", error);
    return NextResponse.json(
      { error: "获取校友信息纠错列表失败" },
      { status: 500 },
    );
  }
}
