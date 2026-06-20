import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeTags } from "@/lib/tags";
import { upsertRosterEntry } from "@/lib/roster";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const graduationClass = (
      searchParams.get("graduationClass") || ""
    ).trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)),
    );

    const where: Record<string, unknown> = {};
    const andConditions: Record<string, unknown>[] = [];

    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q } },
          { tags: { contains: q } },
          { graduationClass: { contains: q } },
          { className: { contains: q } },
          { email: { contains: q } },
        ],
      });
    }
    if (graduationClass) {
      andConditions.push({ graduationClass: { contains: graduationClass } });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, rows] = await Promise.all([
      prisma.whitelistRoster.count({ where }),
      prisma.whitelistRoster.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ alumni: rows, total, page, pageSize });
  } catch (error) {
    console.error("Admin alumni GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alumni" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
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

    const { entry: alumni, created } = await upsertRosterEntry(prisma, {
      name,
      graduationClass,
      className,
      email,
      contact,
      tags,
      certificateNo,
    });

    return NextResponse.json(
      { alumni, created },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Admin alumni POST error:", error);
    return NextResponse.json(
      { error: "Failed to create alumni" },
      { status: 500 },
    );
  }
}
