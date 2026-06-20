import { NextRequest, NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "";

type TokenPayload = {
  v: 3;
  role: "user" | "admin";
  userId: string;
  sessionVersion: number;
  exp: number;
};

const PUBLIC_PAGES = new Set([
  "/",
  "/about",
  "/login",
  "/register",
  "/verify-email",
  "/reset-password",
]);

const PUBLIC_APIS = new Set([
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/graduation-classes",
]);

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  if (!SESSION_SECRET) return null;
  try {
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra) return null;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      new TextEncoder().encode(encoded),
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encoded)),
    ) as Partial<TokenPayload>;
    if (
      payload.v !== 3 ||
      (payload.role !== "user" && payload.role !== "admin") ||
      typeof payload.userId !== "string" ||
      !Number.isInteger(payload.sessionVersion) ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

function isStatic(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/leaflet/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/card.jpg" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|txt|webmanifest|webp|woff2?)$/i.test(
      pathname,
    )
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  const next = () => NextResponse.next({ request: { headers } });

  if (isStatic(pathname) || PUBLIC_APIS.has(pathname)) {
    return next();
  }

  const token = req.cookies.get("yc_access_token")?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

  if (pathname === "/admin/login") {
    if (payload?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (payload?.role === "user") {
      return NextResponse.redirect(new URL("/me", req.url));
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", "/admin");
    return NextResponse.redirect(url);
  }

  if (PUBLIC_PAGES.has(pathname)) {
    return next();
  }

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && payload.role !== "admin") {
    return pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
      : NextResponse.redirect(new URL("/me", req.url));
  }
  return next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
