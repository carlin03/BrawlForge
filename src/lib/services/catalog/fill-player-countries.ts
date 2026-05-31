import {
  getPlayerCountrySeedIso,
  listPlayerCountrySeedSlugs,
  playerCountrySeedStats,
} from "@/lib/data/bsc-player-countries";
import { countryValueForStorage } from "@/lib/data/country-picker";
import { logCmsAudit } from "@/lib/cms/audit";
import type { SupabaseServerClient } from "./roster-sync";

export type FillPlayerCountriesOptions = {
  regions?: string[];
  /** Si false, solo rellena jugadores sin país/nacionalidad */
  overwrite?: boolean;
};

export type FillPlayerCountriesResult = {
  message: string;
  updated: number;
  skipped: number;
  noSeed: number;
  regions: string[];
  seedStats: ReturnType<typeof playerCountrySeedStats>;
  samples: { slug: string; country: string }[];
};

function hasCountry(row: { country?: string | null; nationality?: string | null }): boolean {
  return Boolean(row.country?.trim() || row.nationality?.trim());
}

export async function fillPlayerCountriesFromSeed(
  supabase: SupabaseServerClient,
  options: FillPlayerCountriesOptions = {},
): Promise<FillPlayerCountriesResult> {
  const regions = (options.regions?.length ? options.regions : ["EMEA", "EA"]).map((r) =>
    r.trim().toUpperCase(),
  );
  const overwrite = options.overwrite === true;
  const seedSlugs = new Set(listPlayerCountrySeedSlugs(regions));

  const { data: rows, error } = await supabase.from("players_catalog").select("*");
  if (error) throw new Error(error.message);

  let updated = 0;
  let skipped = 0;
  let noSeed = 0;
  const samples: { slug: string; country: string }[] = [];

  for (const row of rows ?? []) {
    const slug = String(row.slug).trim().toLowerCase();
    const playerRegion = String(row.region ?? "").toUpperCase();
    if (!regions.includes(playerRegion)) continue;
    if (!seedSlugs.has(slug)) {
      noSeed++;
      continue;
    }
    if (!overwrite && hasCountry(row)) {
      skipped++;
      continue;
    }

    const iso = getPlayerCountrySeedIso(slug);
    if (!iso) {
      noSeed++;
      continue;
    }

    const syncedAt = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("players_catalog")
      .update({
        country: iso,
        nationality: iso,
        synced_at: syncedAt,
      })
      .eq("slug", slug);

    if (upErr) throw new Error(`${slug}: ${upErr.message}`);
    updated++;
    if (samples.length < 8) samples.push({ slug, country: iso });
  }

  await logCmsAudit({
    action: "players_catalog.fill_countries",
    entityType: "player",
    entityId: "batch",
    diff: { regions, overwrite, updated, skipped },
  });

  const seedStats = playerCountrySeedStats();
  return {
    message:
      updated > 0
        ? `País actualizado en ${updated} jugador(es) (${regions.join(", ")}).${skipped ? ` ${skipped} ya tenían país (omitidos).` : ""}`
        : `Ningún jugador actualizado.${skipped ? ` ${skipped} ya tenían país.` : ""}${noSeed ? ` ${noSeed} sin dato en plantilla Liquipedia.` : ""}`,
    updated,
    skipped,
    noSeed,
    regions,
    seedStats,
    samples,
  };
}

/** Normaliza país manual (CSV/admin) a ISO2 cuando se reconoce */
export function normalizePlayerCountryFields(country?: string | null, nationality?: string | null) {
  const raw = nationality?.trim() || country?.trim() || "";
  if (!raw) return { country: null as string | null, nationality: null as string | null };
  const iso = countryValueForStorage(raw);
  return { country: iso, nationality: iso };
}
