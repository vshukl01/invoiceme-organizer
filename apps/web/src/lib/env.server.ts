// src/lib/env.server.ts
import "server-only";

// Server-side env + also includes the public ones (handy for server code)

function requireServerEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// Accept either NEXT_PUBLIC_* or the old names (so you don't break your current Vercel setup)
// Still recommended: rename in Vercel to NEXT_PUBLIC_* (see section 3)
const publicUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const publicAnon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

if (!publicUrl) throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
if (!publicAnon) throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)");

export const env = {
  // Public
  NEXT_PUBLIC_SUPABASE_URL: publicUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publicAnon,

  // Server-only
  SUPABASE_SERVICE_ROLE_KEY: requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
  WORKER_BASE_URL: requireServerEnv("WORKER_BASE_URL"),
  WORKER_API_TOKEN: requireServerEnv("WORKER_API_TOKEN"),
  AUTH_COOKIE_SECRET: requireServerEnv("AUTH_COOKIE_SECRET"),
} as const;
