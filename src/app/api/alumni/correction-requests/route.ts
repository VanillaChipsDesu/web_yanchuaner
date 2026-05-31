import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`correction:${ip}`, 5, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "提交过于频繁，请稍后再试" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  try {
    // Honeypot: 如果 website 被填写，静默拒绝
    const honeypot = formData.get("website");
    if (honeypot && typeof honeypot === "string" && honeypot.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    const rosterId = ((formData.get("rosterId") as string) || "").trim();
    const requestedName = ((formData.get("requestedName") as string) || "").trim() || null;
    const requestedGraduationClass = ((formData.get("requestedGraduationClass") as string) || "").trim() || null;
    const requestedTags = ((formData.get("requestedTags") as string) || "").trim() || null;
    const contact = ((formData.get("contact") as string) || "").trim();
    const reason = ((formData.get("reason") as string) || "").trim();

    // 验证 rosterId 存在
    if (!rosterId) {
      return NextResponse.json({ error: "请选择要修改的校友" }, { status: 400 });
    }
    const roster = await prisma.whitelistRoster.findUnique({
      where: { id: rosterId },
    });
    if (!roster) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }

    // 验证 contact
    if (!contact || contact.length > 100) {
      return NextResponse.json(
        { error: "请填写联系方式（不超过100字）" },
        { status: 400 },
      );
    }

    // 验证 reason
    if (!reason || reason.length < 5 || reason.length > 1000) {
      return NextResponse.json(
        { error: "修改说明至少5字，不超过1000字" },
        { status: 400 },
      );
    }

    // 至少有一项修改内容非空
    if (!requestedName && !requestedGraduationClass && !requestedTags) {
      return NextResponse.json(
        { error: "请至少填写一项要修改的内容" },
        { status: 400 },
      );
    }

    // 检查是否与当前值不同
    const hasDiff =
      (requestedName && requestedName !== roster.name) ||
      (requestedGraduationClass && requestedGraduationClass !== (roster.graduationClass || "")) ||
      (requestedTags && requestedTags !== (roster.tags || ""));
    if (!hasDiff) {
      return NextResponse.json(
        { error: "修改内容与当前信息相同，请检查后重新提交" },
        { status: 400 },
      );
    }

    // 长度校验
    if ((requestedName?.length || 0) > 50) {
      return NextResponse.json({ error: "姓名不超过50字" }, { status: 400 });
    }
    if ((requestedGraduationClass?.length || 0) > 50) {
      return NextResponse.json({ error: "届别不超过50字" }, { status: 400 });
    }
    if ((requestedTags?.length || 0) > 500) {
      return NextResponse.json({ error: "标签不超过500字" }, { status: 400 });
    }

    await prisma.alumniCorrectionRequest.create({
      data: {
        rosterId,
        currentName: roster.name,
        currentGraduationClass: roster.graduationClass,
        currentTags: roster.tags,
        requestedName,
        requestedGraduationClass,
        requestedTags,
        contact,
        reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Correction request error:", error);
    return NextResponse.json(
      { error: "提交失败，请稍后重试" },
      { status: 500 },
    );
  }
}
