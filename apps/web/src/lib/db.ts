import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-side Supabase clients.
 * - anon client: safe for limited reads (not used much here)
 * - admin client: uses SERVICE_ROLE key (server-only) for full DB access
 *
 * IMPORTANT: Never expose SERVICE_ROLE to the browser.
 */
export function supabaseAnon() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
}

export function supabaseAdmin() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}
