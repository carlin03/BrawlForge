import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv, isSupabaseEnvValid } from "@/lib/supabase/env";

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}

export function isSupabaseConfigured(): boolean {
  return isSupabaseEnvValid();
}
