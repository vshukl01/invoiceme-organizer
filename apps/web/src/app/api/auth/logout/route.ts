// apps/web/src/app/api/auth/logout/route.ts
import "server-only";

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
