import discoveredTournaments from "./generated/tournaments-discovered.json";
import { getTournamentLogoFile } from "./catalog";
import { tournaments, getTournament, getTierBPlusTournaments } from "./matches";
import type { EsportsTournament } from "./matches";
import type { Region } from "../types";

export type AdminTournamentRow = {
  slug: string;
  name: string;
  short_name: string | null;
  region: string;
  prize_pool: string | null;
  teams_count: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  stage: string | null;
  tier: number | null;
  logo_url: string | null;
  participant_slugs: string[];
  meta: Record<string, unknown>;
};

const DISCOVERED_SLUGS = new Set(
  (Array.isArray(discoveredTournaments) ? discoveredTournaments : []).map((t) =>
    String((t as { slug?: string }).slug ?? "").trim().toLowerCase(),
  ),
);

const BSC_SLUGS = new Set(tournaments.map((t) => t.slug));

export function isLiquipediaDiscoveredTournament(slug: string): boolean {
  return DISCOVERED_SLUGS.has(slug.trim().toLowerCase());
}

export function getAdminTournamentSource(row: AdminTournamentRow): string {
  const src = row.meta?.source;
  return typeof src === "string" ? src : BSC_SLUGS.has(row.slug) ? "bsc" : "liquipedia";
}

function defaultTournamentLogoUrl(slug: string): string | null {
  if (getTournamentLogoFile(slug)) return `/logos/tournaments/${slug}.png`;
  return null;
}

function localToRow(t: EsportsTournament, source: string): AdminTournamentRow {
  const discovered = isLiquipediaDiscoveredTournament(t.slug);
  return {
    slug: t.slug,
    name: t.name,
    short_name: t.shortName ?? null,
    region: t.region,
    prize_pool: t.prizePool ?? null,
    teams_count: t.teams ?? 0,
    status: t.status,
    start_date: t.startDate || null,
    end_date: t.endDate || null,
    location: t.location || null,
    stage: t.stage || null,
    tier: t.tier ?? null,
    logo_url: defaultTournamentLogoUrl(t.slug),
    participant_slugs: t.participantSlugs ?? [],
    meta: {
      source: discovered ? "liquipedia-discovered" : source,
      editable: true,
    },
  };
}

export function adminTournamentToCatalogRow(slug: string): AdminTournamentRow {
  const t = getTournament(slug);
  if (t) return localToRow(t, isLiquipediaDiscoveredTournament(slug) ? "liquipedia-discovered" : "liquipedia");
  const human = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    slug,
    name: human,
    short_name: human,
    region: "GLOBAL",
    prize_pool: null,
    teams_count: 0,
    status: "upcoming",
    start_date: null,
    end_date: null,
    location: null,
    stage: null,
    tier: null,
    logo_url: null,
    participant_slugs: [],
    meta: { source: "manual", editable: true },
  };
}

export function mergeAdminTournamentRows(
  catalogRows: Array<Record<string, unknown>> | null | undefined,
): AdminTournamentRow[] {
  const bySlug = new Map<string, AdminTournamentRow>();

  for (const t of tournaments) {
    bySlug.set(t.slug, localToRow(t, "bsc"));
  }

  for (const t of getTierBPlusTournaments()) {
    if (!bySlug.has(t.slug)) {
      bySlug.set(
        t.slug,
        localToRow(t, isLiquipediaDiscoveredTournament(t.slug) ? "liquipedia-discovered" : "liquipedia"),
      );
    }
  }

  for (const row of catalogRows ?? []) {
    const slug = String(row.slug ?? "").trim().toLowerCase();
    if (!slug) continue;
    const base = bySlug.get(slug) ?? adminTournamentToCatalogRow(slug);
    const participants = row.participant_slugs;
    const meta = row.meta;
    bySlug.set(slug, {
      ...base,
      name: String(row.name ?? base.name),
      short_name: row.short_name ? String(row.short_name) : base.short_name,
      region: String(row.region ?? base.region),
      prize_pool: row.prize_pool ? String(row.prize_pool) : base.prize_pool,
      teams_count: Number(row.teams_count ?? base.teams_count),
      status: String(row.status ?? base.status),
      start_date: row.start_date ? String(row.start_date) : base.start_date,
      end_date: row.end_date ? String(row.end_date) : base.end_date,
      location: row.location ? String(row.location) : base.location,
      stage: row.stage ? String(row.stage) : base.stage,
      tier: row.tier != null ? Number(row.tier) : base.tier,
      logo_url: row.logo_url ? String(row.logo_url) : base.logo_url,
      participant_slugs: Array.isArray(participants)
        ? (participants as string[])
        : base.participant_slugs,
      meta: {
        ...base.meta,
        ...(meta && typeof meta === "object" && !Array.isArray(meta)
          ? (meta as Record<string, unknown>)
          : {}),
        saved_in_catalog: true,
      },
    });
  }

  return [...bySlug.values()].sort((a, b) => {
    const aBsc = BSC_SLUGS.has(a.slug);
    const bBsc = BSC_SLUGS.has(b.slug);
    if (aBsc !== bBsc) return aBsc ? -1 : 1;
    const aSrc = getAdminTournamentSource(a);
    const bSrc = getAdminTournamentSource(b);
    if (aSrc !== bSrc) {
      const order = { bsc: 0, liquipedia: 1, "liquipedia-discovered": 2, manual: 3 };
      return (order[aSrc as keyof typeof order] ?? 9) - (order[bSrc as keyof typeof order] ?? 9);
    }
    return a.name.localeCompare(b.name);
  });
}

/** Listado mínimo para panel de logos (todos los tier B+ con partidos). */
export function getAdminLogoTournaments(): Pick<EsportsTournament, "slug" | "name" | "shortName">[] {
  return mergeAdminTournamentRows(null).map((r) => ({
    slug: r.slug,
    name: r.name,
    shortName: r.short_name ?? r.name,
  }));
}

const TOUR_STATUSES = new Set(["live", "upcoming", "finished"]);

/** Datos del formulario admin → aspecto de listado/ficha pública */
export function adminRowToEsportsPreview(row: AdminTournamentRow): EsportsTournament {
  const status = TOUR_STATUSES.has(row.status)
    ? (row.status as EsportsTournament["status"])
    : "upcoming";
  const participants = row.participant_slugs ?? [];
  return {
    slug: row.slug,
    name: row.name?.trim() || row.slug,
    shortName: row.short_name?.trim() || row.name?.trim() || row.slug,
    region: (row.region as Region) || "GLOBAL",
    prizePool: row.prize_pool?.trim() || "TBA",
    teams: row.teams_count || participants.length || 0,
    status,
    startDate: row.start_date?.trim() || "",
    endDate: row.end_date?.trim() || row.start_date?.trim() || "",
    location: row.location?.trim() || "—",
    stage: row.stage?.trim() || "",
    tier: row.tier ?? undefined,
    participantSlugs: participants,
  };
}

export function slugifyAdminId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
