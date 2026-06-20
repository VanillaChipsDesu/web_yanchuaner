import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { TokenPayload, verifyToken } from "@/lib/verify-token";

export const AUTH_COOKIE = "yc_access_token";

export type AuthenticatedUser = {
  id: string;
  username: string | null;
  email: string | null;
  emailVerified: Date | null;
  name: string | null;
  graduationClass: string | null;
  className: string | null;
  role: string;
  status: string;
  accountStatus: string;
  sessionVersion: number;
};

function unauthorized(message = "Unauthorized", status = 401) {
  return NextResponse.json({ error: message }, { status });
}

function tokenFromRequest(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

async function resolveUser(payload: TokenPayload | null) {
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      name: true,
      graduationClass: true,
      className: true,
      role: true,
      status: true,
      accountStatus: true,
      sessionVersion: true,
    },
  });
  if (
    !user ||
    user.accountStatus !== "ACTIVE" ||
    !user.emailVerified ||
    user.sessionVersion !== payload.sessionVersion
  ) {
    return null;
  }
  const expectedRole = user.role === "ADMIN" ? "admin" : "user";
  if (payload.role !== expectedRole) return null;
  return user;
}

export async function getAuthenticatedUser(
  req: NextRequest,
): Promise<AuthenticatedUser | null> {
  return resolveUser(tokenFromRequest(req));
}

export async function requireUser(
  req: NextRequest,
): Promise<Response | null> {
  return (await getAuthenticatedUser(req)) ? null : unauthorized();
}

export async function requireVerifiedAlumni(
  req: NextRequest,
): Promise<Response | null> {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized();
  if (
    user.role !== "ADMIN" &&
    (user.role !== "ALUMNI" || user.status !== "VERIFIED")
  ) {
    return unauthorized("Forbidden", 403);
  }
  return null;
}

export async function requireAdmin(
  req: NextRequest,
): Promise<Response | null> {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return unauthorized("Forbidden", 403);
  return null;
}

async function pageUser() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  return resolveUser(token ? verifyToken(token) : null);
}

export async function getPageUser() {
  return pageUser();
}

export async function requirePageUser() {
  const user = await pageUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePageAlumni() {
  const user = await pageUser();
  if (!user) redirect("/login");
  if (
    user.role !== "ADMIN" &&
    (user.role !== "ALUMNI" || user.status !== "VERIFIED")
  ) {
    redirect("/me");
  }
  return user;
}

export async function requirePageAdmin() {
  const user = await pageUser();
  if (!user || user.role !== "ADMIN") redirect("/login?redirect=/admin");
  return user;
}
