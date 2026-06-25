import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
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
      { error: "获取修改申请失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await readJsonBody<{
      action?: unknown;
      adminNote?: unknown;
    }>(req, 16384); // 16KB limit

    const action = typeof body.action === "string" ? body.action.trim() : "";
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "操作类型无效" },
        { status: 400 },
      );
    }
    if (adminNote.length > 500) {
      return NextResponse.json(
        { error: "管理员备注不可超过500字" },
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
  } catch (error: any) {
    console.error("Admin correction PATCH error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "审核修改申请失败" },
      { status: 500 },
    );
  }
}
