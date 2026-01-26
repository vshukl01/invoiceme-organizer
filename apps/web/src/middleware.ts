// apps/web/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware runs on edge.
 * You CANNOT import server-only libs here (no Node crypto, no bcrypt, etc.)
 *
 * So we only check if cookie exists.
 * Actual verification happens server-side (API routes).
 */

const COOKIE_NAME = "invoiceme_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Protect dashboard + other authenticated pages
  const needsAuth = pathname.startsWith("/dashboard");
  if (!needsAuth) return NextResponse.next();

  const hasCookie = !!req.cookies.get(COOKIE_NAME)?.value;
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
