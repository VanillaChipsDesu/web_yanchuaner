import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";
import {
  isAchievementCategory,
  isAchievementStatus,
} from "@/lib/achievements";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.achievement.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "成就记录不存在" }, { status: 404 });
    }

    const body = await readJsonBody<{
      alumniName?: unknown;
      title?: unknown;
      description?: unknown;
      category?: unknown;
      status?: unknown;
      graduationClass?: unknown;
      organization?: unknown;
      yearLabel?: unknown;
      sortOrder?: unknown;
    }>(req, 524288);

    const alumniName = typeof body.alumniName === "string" ? body.alumniName.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "OTHER";
    const status = typeof body.status === "string" ? body.status.trim() : "DRAFT";
    const graduationClass = typeof body.graduationClass === "string" ? body.graduationClass.trim() : "";
    const organization = typeof body.organization === "string" ? body.organization.trim() : "";
    const yearLabel = typeof body.yearLabel === "string" ? body.yearLabel.trim() : "";

    if (!alumniName || alumniName.length > 50) {
      return NextResponse.json(
        { error: "校友姓名不能为空且不超过50字" },
        { status: 400 },
      );
    }
    if (!title || title.length > 120) {
      return NextResponse.json(
        { error: "成就标题不能为空且不超过120字" },
        { status: 400 },
      );
    }
    if (description.length > 2000) {
      return NextResponse.json(
        { error: "成就简介不超过2000字" },
        { status: 400 },
      );
    }
    if (graduationClass.length > 50) {
      return NextResponse.json(
        { error: "届别长度不超过50字" },
        { status: 400 },
      );
    }
    if (organization.length > 100) {
      return NextResponse.json(
        { error: "单位/组织长度不超过100字" },
        { status: 400 },
      );
    }
    if (yearLabel.length > 20) {
      return NextResponse.json(
        { error: "年份标签长度不超过20字" },
        { status: 400 },
      );
    }
    if (!isAchievementCategory(category)) {
      return NextResponse.json({ error: "成就类别无效" }, { status: 400 });
    }
    if (!isAchievementStatus(status)) {
      return NextResponse.json({ error: "发布状态无效" }, { status: 400 });
    }

    const achievement = await prisma.achievement.update({
      where: { id: params.id },
      data: {
        alumniName,
        title,
        description,
        category,
        status,
        graduationClass: graduationClass || null,
        organization: organization || null,
        yearLabel: yearLabel || null,
        sortOrder: Number.isFinite(Number(body.sortOrder))
          ? Math.trunc(Number(body.sortOrder))
          : 0,
      },
    });

    return NextResponse.json({ achievement });
  } catch (error: any) {
    console.error("Admin achievements PUT error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.achievement.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "成就记录不存在" }, { status: 404 });
    }

    await prisma.achievement.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin achievements DELETE error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
