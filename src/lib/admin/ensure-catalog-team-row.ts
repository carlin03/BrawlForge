import type { SupabaseClient } from "@supabase/supabase-js";

const CIRCUIT_TEAM_DEFAULTS: Record<
  string,
  { name: string; tag: string; region: string; country?: string }
> = {
  "ninguem-segura": { name: "Ninguém Segura", tag: "NS", region: "SA", country: "Brazil" },
  "big-talents": { name: "Big Talents", tag: "BT", region: "EMEA", country: "United States" },
};

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Crea fila en teams_catalog si el club solo existía en overrides (p. ej. 51.º equipo). */
export async function ensureCatalogTeamRow(
  supabase: SupabaseClient,
  slug: string,
  logoUrl: string,
  syncedAt: string,
): Promise<string | null> {
  const key = slug.trim().toLowerCase();
  const { data: existing } = await supabase.from("teams_catalog").select("slug").eq("slug", key).maybeSingle();
  if (existing?.slug) return null;

  const preset = CIRCUIT_TEAM_DEFAULTS[key];
  const { error } = await supabase.from("teams_catalog").upsert({
    slug: key,
    name: preset?.name ?? humanizeSlug(key),
    tag: preset?.tag ?? key.slice(0, 3).toUpperCase(),
    region: preset?.region ?? "GLOBAL",
    country: preset?.country ?? "",
    logo_url: logoUrl,
    synced_at: syncedAt,
  });
  if (error) return error.message;
  return null;
}
