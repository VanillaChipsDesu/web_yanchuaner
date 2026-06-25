import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeTags } from "@/lib/tags";
import { upsertRosterEntry } from "@/lib/roster";
import { readJsonBody } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const graduationClass = (
      searchParams.get("graduationClass") || ""
    ).trim();

    // 强校验分页参数，防御 NaN / 负数导致的 Prisma 崩溃
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    const rawPageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const pageSize = Number.isInteger(rawPageSize) && rawPageSize > 0 ? Math.min(200, rawPageSize) : 50;

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
      { error: "获取校友花名册失败" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await readJsonBody<{
      name?: unknown;
      graduationClass?: unknown;
      className?: unknown;
      email?: unknown;
      contact?: unknown;
      tags?: unknown;
      certificateNo?: unknown;
    }>(req, 16384); // 16KB limit

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
  } catch (error: any) {
    console.error("Admin alumni POST error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "添加校友记录失败" },
      { status: 500 },
    );
  }
}
