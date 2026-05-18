import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const request = await prisma.alumniCorrectionRequest.findUnique({
      where: { id: params.id },
    });
    if (!request) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }
    return NextResponse.json({ request });
  } catch (error) {
    console.error("Admin correction GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch correction request" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { action, adminNote } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action 必须为 approve 或 reject" },
        { status: 400 },
      );
    }

    const request = await prisma.alumniCorrectionRequest.findUnique({
      where: { id: params.id },
    });
    if (!request) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }
    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "该申请已审核，不能重复操作" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      // 确认 WhitelistRoster 仍存在
      const roster = await prisma.whitelistRoster.findUnique({
        where: { id: request.rosterId },
      });
      if (!roster) {
        return NextResponse.json(
          { error: "该校友已从名单中删除，无法应用修改" },
          { status: 400 },
        );
      }

      // 使用 transaction 保证一致性
      await prisma.$transaction([
        prisma.alumniCorrectionRequest.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            adminNote: adminNote || null,
            reviewedAt: new Date(),
          },
        }),
        prisma.whitelistRoster.update({
          where: { id: request.rosterId },
          data: {
            ...(request.requestedName ? { name: request.requestedName } : {}),
            ...(request.requestedGraduationClass
              ? { graduationClass: request.requestedGraduationClass }
              : {}),
            ...(request.requestedTags ? { tags: request.requestedTags } : {}),
          },
        }),
      ]);

      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    // reject
    await prisma.alumniCorrectionRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, status: "REJECTED" });
  } catch (error) {
    console.error("Admin correction PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update correction request" },
      { status: 500 },
    );
  }
}
