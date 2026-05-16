import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verify-token";

export function requireAdmin(req: NextRequest): Response | null {
  const token = req.cookies.get("yc_access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
