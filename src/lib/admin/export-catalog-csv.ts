import type { AdminPlayerCatalogRow, AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";

function escCsv(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function jsonCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value) && !Object.keys(value as object).length) {
    return "";
  }
  if (Array.isArray(value) && !value.length) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

const TEAM_HEADER =
  "slug,name,tag,region,country,earnings,rank,rank_change,description,logo_url,roster_slugs,form,coach,founded_year,headquarters,website,circuit_summary,social_json,achievements_json,meta_json";

export function teamRowToCsvLine(team: AdminTeamCatalogRow): string {
  const meta = team.meta as Record<string, unknown> | undefined;
  const social = team.social as Record<string, unknown> | undefined;
  return [
    team.slug,
    team.name,
    team.tag,
    team.region,
    team.country ?? "",
    team.earnings ?? 0,
    team.rank ?? "",
    team.rank_change ?? 0,
    team.description ?? "",
    team.logo_url ?? "",
    (team.roster_slugs ?? []).join("|"),
    (team.form ?? []).join("|"),
    team.coach ?? "",
    team.founded_year ?? "",
    team.headquarters ?? "",
    team.website ?? "",
    team.circuit_summary ?? "",
    jsonCell(social),
    jsonCell(team.achievements),
    jsonCell(meta),
  ]
    .map(escCsv)
    .join(",");
}

export function buildTeamsCsv(teams: AdminTeamCatalogRow[], singleSlug?: string): string {
  const list = singleSlug ? teams.filter((t) => t.slug === singleSlug) : teams;
  const lines = [
    "# Equipos — exportado desde BrawlForge Admin (incluye meta/redes/logros si existen)",
    TEAM_HEADER,
    ...list.map(teamRowToCsvLine),
  ];
  return `${lines.join("\n")}\n`;
}

const PLAYER_HEADER =
  "slug,ign,real_name,team_slug,region,role,status,fantasy_points,fantasy_ownership,rating,bio,photo_url,previous_teams,social_json,meta_json";

export function playerRowToCsvLine(p: AdminPlayerCatalogRow): string {
  const meta = { ...(p.meta as Record<string, unknown> | undefined) };
  if (p.photo_url && !meta.photo_url) meta.photo_url = p.photo_url;
  const social = p.social as Record<string, unknown> | undefined;
  return [
    p.slug,
    p.ign,
    p.real_name ?? "",
    p.team_slug ?? "",
    p.region,
    p.role,
    p.status,
    p.fantasy_points ?? 0,
    p.fantasy_ownership ?? 0,
    p.rating ?? 0,
    p.bio ?? "",
    p.photo_url ?? "",
    (p.previous_teams ?? []).join("|"),
    jsonCell(social),
    jsonCell(Object.keys(meta).length ? meta : undefined),
  ]
    .map(escCsv)
    .join(",");
}

export function buildPlayersCsv(
  players: AdminPlayerCatalogRow[],
  teamSlug?: string,
): string {
  const list = teamSlug
    ? players.filter((p) => p.team_slug === teamSlug)
    : players;
  const lines = [
    "# Jugadores — exportado desde BrawlForge Admin (incluye meta/redes si existen)",
    PLAYER_HEADER,
    ...list.map(playerRowToCsvLine),
  ];
  return `${lines.join("\n")}\n`;
}

export function downloadCsvText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
