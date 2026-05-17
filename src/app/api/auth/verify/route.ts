import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { signToken } from "@/lib/verify-token";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
// 兼容旧的 ACCESS_PASSWORD 和更安全的 ACCESS_PASSWORD_HASH
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || "";
const ACCESS_PASSWORD_HASH = process.env.ACCESS_PASSWORD_HASH || "";
const ADMIN_CONFIGURED = !!(ADMIN_USERNAME && ADMIN_PASSWORD_HASH);
const ACCESS_CONFIGURED = !!(ACCESS_PASSWORD || ACCESS_PASSWORD_HASH);
const TOKEN_TTL_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const exp = Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

    // 管理员模式：需要 username + password
    if (body.username) {
      if (!ADMIN_CONFIGURED) {
        return NextResponse.json(
          { error: "账号或口令错误" },
          { status: 401 },
        );
      }
      if (!body.password) {
        return NextResponse.json(
          { error: "账号或口令错误" },
          { status: 400 },
        );
      }
      if (body.username.trim() !== ADMIN_USERNAME) {
        return NextResponse.json(
          { error: "账号或口令错误" },
          { status: 401 },
        );
      }
      const inputHash = createHash("sha256")
        .update(body.password.trim())
        .digest("hex");
      if (inputHash !== ADMIN_PASSWORD_HASH) {
        return NextResponse.json(
          { error: "账号或口令错误" },
          { status: 401 },
        );
      }

      const token = signToken("admin", exp);
      const response = NextResponse.json({ success: true, role: "admin" });
      response.cookies.set("yc_access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60,
      });
      return response;
    }

    // 普通口令模式：只需要 password
    if (!ACCESS_CONFIGURED) {
      return NextResponse.json(
        { error: "口令错误，请查阅校友群公告" }, // 不泄露配置缺失
        { status: 401 },
      );
    }
    const password = (body.password || "").trim();
    if (!password) {
      return NextResponse.json({ error: "请输入内测口令" }, { status: 400 });
    }
    const inputHash = createHash("sha256").update(password).digest("hex");
    
    const isValidHash = ACCESS_PASSWORD_HASH && inputHash === ACCESS_PASSWORD_HASH;
    const isValidPlain = ACCESS_PASSWORD && password === ACCESS_PASSWORD;

    if (!isValidHash && !isValidPlain) {
      return NextResponse.json(
        { error: "口令错误，请查阅校友群公告" },
        { status: 401 },
      );
    }

    const token = signToken("access", exp);
    const response = NextResponse.json({ success: true, role: "access" });
    response.cookies.set("yc_access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 },
    );
  }
}
