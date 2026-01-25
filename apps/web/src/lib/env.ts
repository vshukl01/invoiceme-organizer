/**
 * Centralized environment variable loader for InvoiceMe Organizer (Next.js)
 *
 * Why we do this:
 * ✅ Prevents "undefined" env crashes on Vercel builds
 * ✅ Gives clean error messages like:
 *    "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"
 * ✅ Enforces which variables are PUBLIC vs SERVER-only
 *
 * IMPORTANT:
 * - NEXT_PUBLIC_* variables are exposed to the browser.
 * - Never put secrets as NEXT_PUBLIC_*.
 */

/**
 * Throws a readable error if the env var is missing.
 * Use this for env vars that MUST exist.
 */
export function requireEnv(name: string): string {
  const v = process.env[name];

  // Catch: missing, empty string, whitespace-only
  if (!v || v.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return v.trim();
}

/**
 * Use optionalEnv for things that are NOT required in every environment
 * (for example local testing vs production, or if a feature is optional).
 */
export function optionalEnv(name: string, defaultValue: string = ""): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) return defaultValue;
  return v.trim();
}

/**
 * ENV object used everywhere in the app
 * ------------------------------------
 * ✅ Public vars (browser-safe) -> MUST be prefixed with NEXT_PUBLIC_
 * ✅ Server-only vars -> never exposed to browser
 */
export const ENV = {
  /**
   * PUBLIC (Browser-safe)
   * These are required because your frontend uses Supabase client.
   */
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  /**
   * SERVER-ONLY (Do NOT expose to the browser)
   * Only API routes / server actions should use these.
   */
  SUPABASE_SERVICE_ROLE_KEY: optionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  WORKER_BASE_URL: optionalEnv("WORKER_BASE_URL"),
  WORKER_API_TOKEN: optionalEnv("WORKER_API_TOKEN"),
  AUTH_COOKIE_SECRET: optionalEnv("AUTH_COOKIE_SECRET"),
};
