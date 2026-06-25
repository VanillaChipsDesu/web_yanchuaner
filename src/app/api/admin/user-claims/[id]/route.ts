import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAuthenticatedUser(req);
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await readJsonBody<{
      action?: unknown;
      oldUserId?: unknown;
      adminNote?: unknown;
    }>(req, 16384); // 16KB limit

    const action = typeof body.action === "string" ? body.action.trim() : "";
    const oldUserId = typeof body.oldUserId === "string" ? body.oldUserId.trim() : "";
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";

    if (action !== "approve-claim" && action !== "reject-claim") {
      return NextResponse.json({ error: "操作无效" }, { status: 400 });
    }
    if (adminNote.length > 500) {
      return NextResponse.json({ error: "备注不可超过500字" }, { status: 400 });
    }
    if (oldUserId.length > 50) {
      return NextResponse.json({ error: "被认领校友ID超限" }, { status: 400 });
    }

    if (action === "reject-claim") {
      const claim = await prisma.$transaction(async (tx) => {
        const current = await tx.userClaimRequest.findUnique({ where: { id: params.id } });
        if (!current || current.status !== "PENDING") throw new Error("CLAIM_INVALID");
        const updated = await tx.userClaimRequest.update({
          where: { id: current.id },
          data: {
            status: "REJECTED",
            adminNote: adminNote || null,
            reviewedById: admin.id,
            reviewedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            action,
            targetType: "UserClaimRequest",
            targetId: current.id,
            adminId: admin.id,
            before: JSON.stringify({ status: current.status, oldUserId: current.oldUserId }),
            after: JSON.stringify({ status: updated.status, oldUserId: updated.oldUserId }),
          },
        });
        return updated;
      });
      return NextResponse.json({ claim });
    }

    if (!oldUserId) {
      return NextResponse.json({ error: "请选择旧资料" }, { status: 400 });
    }
    const claim = await prisma.$transaction(async (tx) => {
      const current = await tx.userClaimRequest.findUnique({ where: { id: params.id } });
      if (!current || current.status !== "PENDING") throw new Error("CLAIM_INVALID");
      const oldUser = await tx.user.findUnique({ where: { id: oldUserId } });
      if (
        !oldUser ||
        oldUser.username ||
        oldUser.email ||
        oldUser.passwordHash ||
        oldUser.mergedIntoUserId
      ) {
        throw new Error("OLD_USER_INVALID");
      }
      const claimed = await tx.user.updateMany({
        where: {
          id: oldUser.id,
          username: null,
          email: null,
          passwordHash: null,
          mergedIntoUserId: null,
        },
        data: {
          claimedAt: new Date(),
          mergedIntoUserId: current.claimantUserId,
          accountStatus: "DISABLED",
        },
      });
      if (claimed.count !== 1) throw new Error("OLD_USER_TAKEN");
      await tx.post.updateMany({
        where: { authorId: oldUser.id },
        data: { authorId: current.claimantUserId },
      });
      const updated = await tx.userClaimRequest.update({
        where: { id: current.id },
        data: {
          oldUserId: oldUser.id,
          status: "APPROVED",
          adminNote: adminNote || null,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          action,
          targetType: "UserClaimRequest",
          targetId: current.id,
          adminId: admin.id,
          before: JSON.stringify({ status: current.status, oldUserId: null }),
          after: JSON.stringify({ status: updated.status, oldUserId: oldUser.id }),
        },
      });
      return updated;
    });
    return NextResponse.json({ claim });
  } catch (error: any) {
    console.error("Admin user claim processing error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    const code = error instanceof Error ? error.message : "";
    const status = (code === "CLAIM_INVALID" || code === "OLD_USER_INVALID" || code === "OLD_USER_TAKEN") ? 409 : 500;
    return NextResponse.json(
      { error: code === "OLD_USER_TAKEN" ? "旧资料已被其他申请认领，请刷新" : "认领操作失败" },
      { status },
    );
  }
}
