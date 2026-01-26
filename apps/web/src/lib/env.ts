// apps/web/src/lib/env.ts
/**
 * Centralized environment variable access.
 *
 * Why:
 * - Prevents "undefined" env usage at build/runtime
 * - Gives clear error messages when a required env var is missing
 * - Keeps a single source of truth for env names
 */

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Fail fast (especially on Vercel builds) so errors are obvious
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

/**
 * NOTE:
 * - NEXT_PUBLIC_* is exposed to the browser by Next.js
 * - Everything else must be server-only (never read from client components)
 */
export const env = {
  // -----------------------
  // Public (browser-safe)
  // -----------------------
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  // -----------------------
  // Server-only secrets
  // -----------------------
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  AUTH_COOKIE_SECRET: requireEnv("AUTH_COOKIE_SECRET"),
  WORKER_BASE_URL: requireEnv("WORKER_BASE_URL"),
  WORKER_API_TOKEN: requireEnv("WORKER_API_TOKEN"),
};
