import { createClient } from "@/lib/supabase/server";

export async function isAdminUser(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_DEMO_ADMIN === "true") return true;
  const supabase = await createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  return Boolean(data?.is_admin);
}

export async function requireAdmin(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!(await isAdminUser())) {
    return { ok: false, status: 403, error: "No autorizado" };
  }
  return { ok: true };
}
