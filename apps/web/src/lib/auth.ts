import "server-only";

import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/db";

export type SessionUser = {
  id: string;
  org_id: string;
  email: string;
  is_admin: boolean;
};

const COOKIE_NAME = "invoiceme_session";

/**
 * Very simple cookie session:
 * cookie value = userId|orgId|isAdmin|email
 * signed with AUTH_COOKIE_SECRET via a simple hash signature
 *
 * NOTE: MVP only. We'll harden later.
 */
function sign(value: string): string {
  const data = `${value}::${env.AUTH_COOKIE_SECRET}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31 + data.charCodeAt(i)) >>> 0;
  }
  return `${value}::${hash.toString(16)}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf("::");
  if (idx === -1) return null;

  const value = signed.slice(0, idx);
  return sign(value) === signed ? value : null;
}

export async function verifyLogin(email: string, password: string): Promise<SessionUser> {
  const sb = supabaseAdmin();

  const { data: user, error } = await sb
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Invalid email or password");

  if (!user.is_approved) {
    throw new Error("Your account is not approved yet. Please contact admin.");
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error("Invalid email or password");

  return {
    id: user.id,
    org_id: user.org_id,
    email: user.email,
    is_admin: !!user.is_admin,
  };
}

export function setSessionCookie(user: SessionUser) {
  const raw = `${user.id}|${user.org_id}|${user.is_admin ? "1" : "0"}|${user.email}`;

  cookies().set(COOKIE_NAME, sign(raw), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function getSessionUser(): SessionUser | null {
  const c = cookies().get(COOKIE_NAME)?.value;
  if (!c) return null;

  const raw = unsign(c);
  if (!raw) return null;

  const [id, org_id, isAdmin, email] = raw.split("|");
  if (!id || !org_id || !email) return null;

  return {
    id,
    org_id,
    email,
    is_admin: isAdmin === "1",
  };
}

export function requireUser(): SessionUser {
  const u = getSessionUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}
