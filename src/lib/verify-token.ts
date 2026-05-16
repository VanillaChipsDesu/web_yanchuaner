import { createHmac, timingSafeEqual } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "";
const TOKEN_TTL_DAYS = 7;

type TokenPayload = {
  v: number;
  role: "access" | "admin";
  exp: number;
};

export function signToken(
  role: "access" | "admin",
  expOverride?: number,
): string {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET not configured");
  }
  const exp =
    expOverride ?? Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ v: 2, role, exp });
  const b64 = Buffer.from(payload).toString("base64");
  const hmac = createHmac("sha256", SESSION_SECRET).update(b64).digest("hex");
  return b64 + "." + hmac;
}

export function verifyToken(token: string): TokenPayload | null {
  if (!SESSION_SECRET) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;

    const b64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", SESSION_SECRET)
      .update(b64)
      .digest("hex");

    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

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
