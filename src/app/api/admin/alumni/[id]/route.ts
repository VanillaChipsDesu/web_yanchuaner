import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeTags } from "@/lib/tags";
import { readJsonBody } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const alumni = await prisma.whitelistRoster.findUnique({
      where: { id: params.id },
    });
    if (!alumni) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }
    return NextResponse.json({ alumni });
  } catch (error) {
    console.error("Admin alumni GET by id error:", error);
    return NextResponse.json(
      { error: "获取校友信息失败" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.whitelistRoster.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }

    const body = await readJsonBody<{
      name?: unknown;
      graduationClass?: unknown;
      className?: unknown;
      email?: unknown;
      contact?: unknown;
      tags?: unknown;
      certificateNo?: unknown;
    }>(req, 16384); // Roster forms are small, 16KB limit

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const graduationClass = typeof body.graduationClass === "string" ? body.graduationClass.trim() : "";
    const className = typeof body.className === "string" ? body.className.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    const tags = typeof body.tags === "string" ? normalizeTags(body.tags.trim()) : "";
    const certificateNo = typeof body.certificateNo === "string" ? body.certificateNo.trim() : "";

    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "姓名不能为空且长度不超过50字" },
        { status: 400 },
      );
    }
    if (graduationClass && graduationClass.length > 50) {
      return NextResponse.json(
        { error: "届别长度不超过50字" },
        { status: 400 },
      );
    }
    if (className && className.length > 64) {
      return NextResponse.json(
        { error: "班级长度不能超过 64 字" },
        { status: 400 },
      );
    }
    if (email && (email.length > 254 || !email.includes("@"))) {
      return NextResponse.json({ error: "邮箱格式无效" }, { status: 400 });
    }
    if (contact && !/^\d{11}$/.test(contact)) {
      return NextResponse.json({ error: "联系方式需为11位手机号" }, { status: 400 });
    }
    if (tags && tags.length > 500) {
      return NextResponse.json(
        { error: "标签长度不超过500字" },
        { status: 400 },
      );
    }
    if (certificateNo && certificateNo.length > 50) {
      return NextResponse.json(
        { error: "证书编号长度不超过50字" },
        { status: 400 },
      );
    }

    const alumni = await prisma.whitelistRoster.update({
      where: { id: params.id },
      data: {
        name,
        graduationClass: graduationClass || null,
        className: className || null,
        email: email || null,
        contact: contact || null,
        tags: tags || null,
        certificateNo: certificateNo || null,
      },
    });

    return NextResponse.json({ alumni });
  } catch (error: any) {
    console.error("Admin alumni PUT error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "更新校友失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.whitelistRoster.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }

    // 检查关联的待处理修正申请
    const pendingCount = await prisma.alumniCorrectionRequest.count({
      where: { rosterId: params.id, status: "PENDING" },
    });
    if (pendingCount > 0) {
      return NextResponse.json(
        { error: `该校友有 ${pendingCount} 条待处理修改申请，请先处理后再删除` },
        { status: 409 }
      );
    }

    await prisma.whitelistRoster.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin alumni DELETE error:", error);
    return NextResponse.json(
      { error: "删除校友失败" },
      { status: 500 },
    );
  }
}
