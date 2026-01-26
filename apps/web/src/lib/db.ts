// apps/web/src/lib/db.ts
import "server-only";

/**
 * db.ts
 * Server-side Supabase clients.
 *
 * supabaseAnon:
 * - uses anon key (safe for limited server reads if needed)
 *
 * supabaseAdmin:
 * - uses SERVICE_ROLE key (server-only) for full DB access (bypasses RLS)
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function supabaseAnon() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export function supabaseAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
