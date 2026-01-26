// apps/web/src/lib/auth.ts
import "server-only";

/**
 * Session auth utilities (server-only).
 *
 * Cookie format (payload):
 *   userId|orgId|isAdmin|email
 *
 * Stored as:
 *   payload::signature
 *
 * NOTE: MVP approach. Later you can replace with JWT or server-side sessions.
 */

import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type SessionUser = {
  id: string;
  org_id: string;
  email: string;
  is_admin: boolean;
};

export const COOKIE_NAME = "invoiceme_session";

/**
 * Simple deterministic signature (MVP tamper detection).
 * Not crypto-strong; good enough for now to detect casual edits.
 */
function signature(input: string): string {
  const data = `${input}::${env.AUTH_COOKIE_SECRET}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31 + data.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

export function signSession(payload: string): string {
  return `${payload}::${signature(payload)}`;
}

export function unsignSession(signed: string): string | null {
  const idx = signed.lastIndexOf("::");
  if (idx === -1) return null;

  const payload = signed.slice(0, idx);
  const sig = signed.slice(idx + 2);

  if (signature(payload) !== sig) return null;
  return payload;
}

/**
 * Read cookie and decode -> SessionUser
 */
export function getSessionUser(): SessionUser | null {
  const c = cookies().get(COOKIE_NAME)?.value;
  if (!c) return null;

  const payload = unsignSession(c);
  if (!payload) return null;

  const [id, org_id, isAdmin, email] = payload.split("|");
  if (!id || !email) return null;

  return {
    id,
    org_id: org_id || "",
    email,
    is_admin: isAdmin === "1",
  };
}

/**
 * Require a logged-in user.
 * Use this inside Route Handlers (app/api/**) and server actions.
 *
 * If not logged in -> throw (caught by your handler try/catch)
 */
export function requireUser(): SessionUser {
  const user = getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * Require an admin user.
 */
export function requireAdmin(): SessionUser {
  const user = requireUser();
  if (!user.is_admin) throw new Error("Forbidden");
  return user;
}

/**
 * Write cookie.
 */
export function setSessionCookie(user: SessionUser) {
  const payload = `${user.id}|${user.org_id || ""}|${user.is_admin ? "1" : "0"}|${user.email}`;
  const signed = signSession(payload);

  cookies().set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear cookie.
 */
export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}
