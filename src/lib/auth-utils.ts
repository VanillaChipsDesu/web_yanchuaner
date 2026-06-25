import { createHash, randomBytes } from "crypto";

export const BCRYPT_COST = 12;
export const USERNAME_PATTERN = /^[a-z0-9_-]{3,32}$/;

export function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 64;
}

export function createOneTimeToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeRedirect(value: unknown, fallback = "/") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}

export async function readJsonBody<T>(
  req: Request,
  maxBytes = 16_384,
): Promise<T> {
  const length = Number(req.headers.get("content-length") || "0");
  if (length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  const buffer = await req.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }
  const text = new TextDecoder().decode(buffer);
  return JSON.parse(text) as T;
}
