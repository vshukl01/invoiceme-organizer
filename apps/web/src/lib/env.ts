// apps/web/src/lib/env.ts
import "server-only";

/**
 * env.ts
 * Centralized environment variable access.
 *
 * Why:
 * - Avoid "undefined env" issues during Next build.
 * - Keep server-only secrets off the client.
 * - Provide a single source of truth for variable names.
 *
 * NOTE:
 * - NEXT_PUBLIC_* are safe to use in the browser.
 * - Everything else is server-only.
 */

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const ENV = {
  // ✅ Public (browser-safe)
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  // ✅ Server-only (never expose to browser)
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  WORKER_BASE_URL: requireEnv("WORKER_BASE_URL"),
  WORKER_API_TOKEN: requireEnv("WORKER_API_TOKEN"),
  AUTH_COOKIE_SECRET: requireEnv("AUTH_COOKIE_SECRET"),
} as const;

/**
 * Backward-compat export:
 * Your existing code imports { env } from "@/lib/env".
 * Keep that working without touching every file.
 */
export const env = ENV;
