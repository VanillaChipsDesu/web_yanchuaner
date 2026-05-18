import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)),
    );

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
      { error: "Failed to fetch correction requests" },
      { status: 500 },
    );
  }
}
