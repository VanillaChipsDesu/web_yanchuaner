import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizeUsername, readJsonBody } from "@/lib/auth-utils";
import { AUTH_COOKIE } from "@/lib/admin-auth";
import { getClientIp, authLimiter } from "@/lib/rate-limit";
import { signToken, TOKEN_TTL_SECONDS } from "@/lib/verify-token";

type LoginBody = { username?: unknown; password?: unknown };

export async function POST(req: NextRequest) {
  // 使用 Upstash Redis 滑动窗口限流（5次/分钟），无 Redis 时自动降级为内存限流
  // TODO: 生产环境请配置 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN 环境变量
  const limiterResult = await authLimiter.limit(getClientIp(req));
  if (!limiterResult.success) {
    return NextResponse.json(
      { error: "尝试过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(limiterResult.retryAfter) } },
    );
  }
  try {
    const body = await readJsonBody<LoginBody>(req, 4096);
    const username = normalizeUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";
    const user = username
      ? await prisma.user.findUnique({ where: { username } })
      : null;
    const passwordOk =
      !!user?.passwordHash && password.length <= 64
        ? await compare(password, user.passwordHash)
        : false;
    if (!user || !passwordOk || user.accountStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 },
      );
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "邮箱尚未验证", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 },
      );
    }
    const role = user.role === "ADMIN" ? "admin" : "user";
    const token = signToken({
      role,
      userId: user.id,
      sessionVersion: user.sessionVersion,
    });
    const response = NextResponse.json({ success: true, role });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_TTL_SECONDS,
      expires: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000),
    });
    return response;
  } catch {
    return NextResponse.json({ error: "登录失败，请稍后再试" }, { status: 500 });
  }
}
