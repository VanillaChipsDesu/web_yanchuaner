import { NextRequest, NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "";

type TokenPayload = {
  v: number;
  role: "access" | "admin";
  exp: number;
};

/**
 * Edge Runtime 兼容的 HMAC-SHA256 token 验证
 * middleware 不能使用 Node.js crypto 模块，改用 Web Crypto API
 */
async function verifyTokenEdge(
  token: string,
): Promise<TokenPayload | null> {
  if (!SESSION_SECRET) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;

    const b64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(b64),
    );
    const sigHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (sig.length !== sigHex.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++)
      diff |= sig.charCodeAt(i) ^ sigHex.charCodeAt(i);
    if (diff !== 0) return null;

    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    const payload = JSON.parse(decoded) as TokenPayload;

    if (
      payload.v !== 2 ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }
    if (payload.role !== "access" && payload.role !== "admin") return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * 燕中校友数字母港 — 路由中间件
 *
 * 职责:
 * 1. 保护 /admin/* 和 /api/admin/* 路由，只允许 admin role token
 * 2. /admin/login 已登录用户自动跳转到 /admin
 * 3. 透明放行其他所有路由
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = req.cookies.get("yc_access_token")?.value;
    const payload = token ? await verifyTokenEdge(token) : null;
    const isAdmin = !!payload && payload.role === "admin";

    if (pathname === "/admin/login") {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
