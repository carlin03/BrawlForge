import { createClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/admin-access";

export async function isAdminUser(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return process.env.NEXT_PUBLIC_DEMO_ADMIN === "true";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  return resolveIsAdmin(user.email, Boolean(data?.is_admin));
}

export async function requireAdmin(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!(await isAdminUser())) {
    return { ok: false, status: 403, error: "No autorizado" };
  }
  return { ok: true };
}
