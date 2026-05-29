import { players } from "./players";
import { BSC_2026_PLAYER_SLUGS, BSC_2026_ROSTERS } from "./bsc-2026-rosters";
import { BSC_2026_ACTIVE_TEAM_SLUGS, isBsc2026ActiveTeam } from "./bsc-2026-active-teams";
import { getBsc2026TeamRegion } from "./bsc-2026-team-regions";
import { getTeam } from "./teams";
import { type AdminPlayerCatalogRow, pickPlayerFromDb } from "./admin-catalog-fields";
import { parseSocial } from "./profile-wiki";

export type { AdminPlayerCatalogRow };

const BSC_TEAM_SET = new Set<string>(BSC_2026_ACTIVE_TEAM_SLUGS);

function isBscCircuitPlayer(p: { slug: string; teamSlug: string }): boolean {
  if (BSC_2026_PLAYER_SLUGS.has(p.slug)) return true;
  return Boolean(p.teamSlug && BSC_TEAM_SET.has(p.teamSlug));
}

export function adminPlayerToCatalogRow(p: (typeof players)[number]): AdminPlayerCatalogRow {
  const region =
    (p.teamSlug ? getBsc2026TeamRegion(p.teamSlug) : undefined) ??
    getTeam(p.teamSlug)?.region ??
    p.region;

  return {
    slug: p.slug,
    ign: p.ign,
    real_name: p.realName ?? null,
    team_slug: p.teamSlug || null,
    region,
    role: p.role,
    status: p.status,
    fantasy_points: p.fantasyPoints,
    fantasy_ownership: p.fantasyOwnership,
    rating: p.rating,
    bio: null,
    photo_url: null,
    social: {},
    meta: {},
  };
}

/** Jugadores del circuito BSC 2026 (plantillas curadas + catálogo local) */
export function getAdminCatalogPlayerRows(): AdminPlayerCatalogRow[] {
  const seen = new Set<string>();
  const out: AdminPlayerCatalogRow[] = [];

  for (const p of players) {
    if (!isBscCircuitPlayer(p) || seen.has(p.slug)) continue;
    seen.add(p.slug);
    out.push(adminPlayerToCatalogRow(p));
  }

  // Asegurar slugs de plantilla aunque falten en players[]
  for (const [teamSlug, roster] of Object.entries(BSC_2026_ROSTERS)) {
    if (!isBsc2026ActiveTeam(teamSlug)) continue;
    for (const pl of roster) {
      if (seen.has(pl)) continue;
      const found = players.find((x) => x.slug === pl);
      if (found) {
        seen.add(pl);
        out.push(adminPlayerToCatalogRow(found));
      } else {
        seen.add(pl);
        out.push({
          slug: pl,
          ign: pl,
          real_name: null,
          team_slug: teamSlug,
          region: getBsc2026TeamRegion(teamSlug) ?? "GLOBAL",
          role: "Player",
          status: "active",
          fantasy_points: 70,
          fantasy_ownership: 20,
          rating: 1,
          bio: null,
          photo_url: null,
          social: {},
          meta: {},
        });
      }
    }
  }

  return out.sort((a, b) => b.fantasy_points - a.fantasy_points || a.ign.localeCompare(b.ign));
}

export function mergeAdminPlayerRows(
  catalogRows: Array<Record<string, unknown>> | null | undefined,
): AdminPlayerCatalogRow[] {
  const bySlug = new Map<string, AdminPlayerCatalogRow>();
  for (const row of getAdminCatalogPlayerRows()) {
    bySlug.set(row.slug, { ...row });
  }
  for (const row of catalogRows ?? []) {
    const slug = String(row.slug ?? "").trim().toLowerCase();
    if (!slug) continue;
    const base = bySlug.get(slug);
    const teamSlug = String(row.team_slug ?? "");
    if (!base && !isBscCircuitPlayer({ slug, teamSlug })) {
      bySlug.set(slug, {
        slug,
        ign: String(row.ign ?? slug),
        real_name: row.real_name ? String(row.real_name) : null,
        team_slug: teamSlug || null,
        region: String(row.region ?? "GLOBAL"),
        role: String(row.role ?? "Player"),
        status: String(row.status ?? "active"),
        fantasy_points: Number(row.fantasy_points ?? 70),
        fantasy_ownership: Number(row.fantasy_ownership ?? 20),
        rating: Number(row.rating ?? 1),
        bio: row.bio ? String(row.bio) : null,
        photo_url: row.photo_url ? String(row.photo_url) : null,
        social: parseSocial(row.social ?? {}),
        meta:
          row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
            ? (row.meta as Record<string, unknown>)
            : {},
        ...pickPlayerFromDb(row),
      });
      continue;
    }
    bySlug.set(slug, {
      ...(base ?? {
        slug,
        ign: String(row.ign ?? slug),
        real_name: null,
        team_slug: null,
        region: "GLOBAL",
        role: "Player",
        status: "active",
        fantasy_points: 70,
        fantasy_ownership: 20,
        rating: 1,
        bio: null,
        photo_url: null,
        social: {},
        meta: {},
      }),
      ign: String(row.ign ?? base?.ign ?? slug),
      real_name: row.real_name ? String(row.real_name) : base?.real_name ?? null,
      team_slug: row.team_slug ? String(row.team_slug) : base?.team_slug ?? null,
      region: String(row.region ?? base?.region ?? "GLOBAL"),
      role: String(row.role ?? base?.role ?? "Player"),
      status: String(row.status ?? base?.status ?? "active"),
      fantasy_points: Number(row.fantasy_points ?? base?.fantasy_points ?? 70),
      fantasy_ownership: Number(row.fantasy_ownership ?? base?.fantasy_ownership ?? 20),
      rating: Number(row.rating ?? base?.rating ?? 1),
      bio: row.bio ? String(row.bio) : base?.bio ?? null,
      photo_url: row.photo_url ? String(row.photo_url) : base?.photo_url ?? null,
      social: parseSocial(row.social ?? base?.social),
      meta:
        row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
          ? (row.meta as Record<string, unknown>)
          : (base?.meta ?? {}),
      ...pickPlayerFromDb(row),
    });
  }
  return [...bySlug.values()].sort(
    (a, b) => b.fantasy_points - a.fantasy_points || a.ign.localeCompare(b.ign),
  );
}
