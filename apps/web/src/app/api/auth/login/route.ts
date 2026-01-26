// apps/web/src/app/api/auth/login/route.ts
import "server-only";

/**
 * Login route:
 * - Looks up user from public.users
 * - Checks approved flag
 * - Verifies password_hash via bcrypt
 * - Sets session cookie
 */

import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  /**
   * IMPORTANT:
   * This must query the app table `public.users`, not `auth.users`.
   */
  const { data: user, error } = await sb
    .from("users")
    .select("id,email,password_hash,approved,is_admin,org_id")
    .eq("email", email)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Approved check
  if (!user.approved) {
    return NextResponse.json(
      { error: "Your account is not approved yet. Please contact admin." },
      { status: 403 }
    );
  }

  // Password check
  const ok = await bcrypt.compare(password, user.password_hash || "");
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Set cookie session
  setSessionCookie({
    id: user.id,
    org_id: user.org_id || "",
    email: user.email,
    is_admin: !!user.is_admin,
  });

  return NextResponse.json({ ok: true, is_admin: !!user.is_admin });
}
