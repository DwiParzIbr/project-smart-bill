import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "smart_bill_admin_session";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "smart-bill-admin-secret-key-2025-secure";
const SESSION_DURATION_HOURS = 24 * 7; // 7 days

export function getExpectedAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return { username, password };
}

export function validateAdminCredentials(user: string, pass: string): boolean {
  const { username, password } = getExpectedAdminCredentials();
  return user.trim() === username && pass.trim() === password;
}

export function generateAdminToken(username: string): string {
  const expiresAt = Date.now() + SESSION_DURATION_HOURS * 3600 * 1000;
  const payload = `${username}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

export function verifyAdminToken(token: string | undefined | null): { isValid: boolean; username?: string } {
  if (!token || typeof token !== "string") return { isValid: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { isValid: false };

  try {
    const payload = Buffer.from(parts[0], "base64url").toString("utf-8");
    const [username, expiresAtStr] = payload.split(":");
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { isValid: false };
    }

    const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedHmac))) {
      return { isValid: true, username };
    }
  } catch {
    return { isValid: false };
  }

  return { isValid: false };
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token).isValid;
}

export function verifyAdminRequest(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminToken(cookieToken).isValid) return true;

  // Also support Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyAdminToken(token).isValid;
  }

  return false;
}

export { ADMIN_COOKIE_NAME };
