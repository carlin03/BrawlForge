import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Cliente con service role — solo rutas admin en servidor. */
export function createServiceClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!env || !serviceKey) return null;
  return createClient(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
