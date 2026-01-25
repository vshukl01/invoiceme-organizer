// src/lib/env.client.ts
// Only browser-safe env vars live here.

function requireClientEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const env = {
  // Browser-safe (NEXT_PUBLIC_ is required for Next.js to expose it to the browser)
  NEXT_PUBLIC_SUPABASE_URL: requireClientEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
} as const;
