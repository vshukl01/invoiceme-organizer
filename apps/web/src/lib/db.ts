import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env.server";

/**
 * Server-side Supabase clients.
 * - anon client: safe for limited reads
 * - admin client: uses SERVICE_ROLE key (server-only)
 */
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
