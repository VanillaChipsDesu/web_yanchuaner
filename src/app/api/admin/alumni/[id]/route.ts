import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeTags } from "@/lib/tags";

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
      { error: "Failed to fetch alumni" },
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

    const body = await req.json();
    const name = (body.name || "").trim();
    const graduationClass = (body.graduationClass || "").trim() || null;
    const className = (body.className || "").trim() || null;
    const email = (body.email || "").trim().toLowerCase() || null;
    const contact = (body.contact || "").trim() || null;
    const tags = normalizeTags((body.tags || "").trim()) || null;
    const certificateNo = (body.certificateNo || "").trim() || null;

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

    const alumni = await prisma.whitelistRoster.update({
      where: { id: params.id },
      data: {
        name,
        graduationClass,
        className,
        email,
        contact,
        tags,
        certificateNo,
      },
    });

    return NextResponse.json({ alumni });
  } catch (error) {
    console.error("Admin alumni PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update alumni" },
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
      { error: "Failed to delete alumni" },
      { status: 500 },
    );
  }
}
