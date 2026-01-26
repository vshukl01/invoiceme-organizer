// apps/web/src/lib/db.ts
import "server-only";

/**
 * This file ONLY runs on the server.
 *
 * It creates:
 * - anon client (safe, limited)
 * - admin client (SERVICE_ROLE - full DB access)
 *
 * IMPORTANT:
 * - Never use service role key in the browser.
 * - Only import supabaseAdmin() from server files (route handlers, server actions).
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Public client:
 * - Uses anon key
 * - Can be used for safe reads if needed
 */
export function supabaseAnon() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Admin client:
 * - Uses SERVICE ROLE key
 * - Bypasses RLS
 * - Use ONLY on server
 */
export function supabaseAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
