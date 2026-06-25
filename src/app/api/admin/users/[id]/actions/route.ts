import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { createOneTimeToken, readJsonBody } from "@/lib/auth-utils";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { upsertRosterEntry } from "@/lib/roster";

type ActionName =
  | "approve-alumni"
  | "reject-alumni"
  | "disable-account"
  | "enable-account"
  | "logout-all-sessions"
  | "resend-verification"
  | "send-reset-password"
  | "grant-admin"
  | "revoke-admin";

function snapshot(user: {
  id: string;
  role: string;
  status: string;
  accountStatus: string;
  emailVerified: Date | null;
  sessionVersion: number;
}) {
  return JSON.stringify({
    id: user.id,
    role: user.role,
    status: user.status,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
    sessionVersion: user.sessionVersion,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAuthenticatedUser(req);
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await readJsonBody<{ action?: unknown }>(req, 4096);
    const action = typeof body.action === "string" ? (body.action.trim() as ActionName) : null;

    if (!action) {
      return NextResponse.json({ error: "操作不能为空" }, { status: 400 });
    }

    const audited = new Set<ActionName>([
      "approve-alumni",
      "reject-alumni",
      "disable-account",
      "enable-account",
      "logout-all-sessions",
      "grant-admin",
      "revoke-admin",
    ]);

    if (
      !audited.has(action) &&
      action !== "resend-verification" &&
      action !== "send-reset-password"
    ) {
      return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    // Root Admin 防线：普通管理员（ADMIN）之间不能互相“停用”或“撤销”对方的权限
    const ROOT_ADMIN_EMAIL = "yanchuaner@yanchuaner.cn";
    const isRoot = admin.email === ROOT_ADMIN_EMAIL;
    if (target.role === "ADMIN" && target.id !== admin.id && !isRoot) {
      if (
        action === "disable-account" ||
        action === "revoke-admin" ||
        action === "reject-alumni" ||
        action === "approve-alumni"
      ) {
        return NextResponse.json(
          { error: "权限不足：普通管理员无法停用或撤销其他管理员" },
          { status: 403 }
        );
      }
    }

    if (
      target.id === admin.id &&
      (action === "disable-account" || action === "revoke-admin")
    ) {
      return NextResponse.json(
        { error: "不能停用或撤销当前管理员自身" },
        { status: 400 },
      );
    }
    if (target.id === admin.id && action === "reject-alumni") {
      return NextResponse.json(
        { error: "不能撤销当前管理员的校友认证" },
        { status: 400 },
      );
    }

    if (action === "resend-verification") {
      if (!target.email || target.emailVerified) {
        return NextResponse.json({ success: true, emailSent: false });
      }
      const verification = createOneTimeToken();
      await prisma.user.update({
        where: { id: target.id },
        data: {
          emailVerifyTokenHash: verification.hash,
          emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      const emailSent = await sendVerificationEmail(
        target.email,
        verification.token,
      );
      return NextResponse.json({ success: true, emailSent });
    }

    if (action === "send-reset-password") {
      if (!target.email) {
        return NextResponse.json({ success: true, emailSent: false });
      }
      const reset = createOneTimeToken();
      await prisma.user.update({
        where: { id: target.id },
        data: {
          passwordResetTokenHash: reset.hash,
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const emailSent = await sendPasswordResetEmail(target.email, reset.token);
      return NextResponse.json({ success: true, emailSent });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (
        action === "approve-alumni" &&
        target.name?.trim() &&
        target.graduationClass?.trim()
      ) {
        await upsertRosterEntry(tx, {
          name: target.name,
          graduationClass: target.graduationClass,
          className: target.className,
          email: target.email,
          contact: target.contact,
        });
      }
      const data =
        action === "approve-alumni"
          ? { role: "ALUMNI", status: "VERIFIED", sessionVersion: { increment: 1 } }
          : action === "reject-alumni"
            ? { role: "GUEST", status: "REJECTED", sessionVersion: { increment: 1 } }
            : action === "disable-account"
              ? { accountStatus: "DISABLED", sessionVersion: { increment: 1 } }
              : action === "enable-account"
                ? { accountStatus: "ACTIVE", sessionVersion: { increment: 1 } }
                : action === "logout-all-sessions"
                  ? { sessionVersion: { increment: 1 } }
                  : action === "grant-admin"
                    ? { role: "ADMIN", sessionVersion: { increment: 1 } }
                    : { role: target.status === "VERIFIED" ? "ALUMNI" : "GUEST", sessionVersion: { increment: 1 } };
      const result = await tx.user.update({ where: { id: target.id }, data });
      await tx.auditLog.create({
        data: {
          action,
          targetType: "User",
          targetId: target.id,
          adminId: admin.id,
          before: snapshot(target),
          after: snapshot(result),
        },
      });
      return result;
    });
    return NextResponse.json({ user: updated });
  } catch (error: any) {
    console.error("Admin users action error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
