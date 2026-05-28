/** Valida URL/clave antes de crear el cliente (evita crash en build de Vercel). */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !anonKey) return null;

  let url = rawUrl;
  if (!/^https?:\/\//i.test(url)) {
    if (url.includes(".supabase.co")) url = `https://${url.replace(/^\/+/, "")}`;
    else return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!parsed.hostname.includes("supabase")) return null;
    return { url: parsed.origin, anonKey };
  } catch {
    return null;
  }
}

export function isSupabaseEnvValid(): boolean {
  return getSupabaseEnv() !== null;
}
