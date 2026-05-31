import { detectTeamsMasterSchema, TEAM_REGIONS, TEAM_STATUSES } from "@/lib/admin/teams-master-csv-schema";

export type TeamMasterCsvRowIssue = {
  slug: string;
  line: number;
  errors: string[];
  warnings: string[];
};

export type TeamMasterCsvValidationResult = {
  schema: "v2" | "v1" | "unknown";
  rows: { raw: Record<string, string>; line: number }[];
  valid: { raw: Record<string, string>; line: number }[];
  issues: TeamMasterCsvRowIssue[];
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function splitPipeList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseForm(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[|,]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseJson(raw: string | undefined): { ok: true; value: unknown } | { ok: false } {
  if (!raw?.trim()) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false };
  }
}

function normalizeRawRow(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = k.trim().toLowerCase();
    if (key === "city" && !("headquarters" in out) && !raw.headquarters) {
      out.headquarters = v;
    } else if (key === "rank" && !raw.global_rank) {
      out.global_rank = v;
    } else if (key === "bsc_qualified_2026" && !raw.bsc_qualified) {
      out.bsc_qualified = v;
    } else {
      out[key] = v;
    }
  }
  return out;
}

export function validateTeamsMasterCsvRows(
  rows: { raw: Record<string, string>; line: number }[],
  headers: string[],
  options?: { knownPlayerSlugs?: Set<string> },
): TeamMasterCsvValidationResult {
  const schema = detectTeamsMasterSchema(headers);
  const valid: { raw: Record<string, string>; line: number }[] = [];
  const issues: TeamMasterCsvRowIssue[] = [];
  const slugLines = new Map<string, number>();

  for (const { raw: rawIn, line } of rows) {
    const raw = normalizeRawRow(rawIn);
    const slug = String(raw.slug ?? "")
      .trim()
      .toLowerCase();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!slug) {
      errors.push("slug obligatorio");
    } else if (!SLUG_RE.test(slug)) {
      errors.push("slug inválido (solo a-z, 0-9 y guiones)");
    } else if (slugLines.has(slug)) {
      errors.push(`slug duplicado (primera aparición línea ${slugLines.get(slug)})`);
    } else {
      slugLines.set(slug, line);
    }

    if (!String(raw.name ?? "").trim()) errors.push("name obligatorio");
    if (!String(raw.tag ?? "").trim()) warnings.push("tag vacío");
    const region = String(raw.region ?? "").trim().toUpperCase();
    if (!region) errors.push("region obligatoria");
    else if (!TEAM_REGIONS.includes(region as (typeof TEAM_REGIONS)[number])) {
      errors.push(`region inválida: ${region}`);
    }

    const status = String(raw.status ?? "active").trim().toLowerCase();
    if (status && !TEAM_STATUSES.includes(status as (typeof TEAM_STATUSES)[number])) {
      errors.push(`status inválido: ${status}`);
    }

    if (raw.global_rank?.trim() && Number.isNaN(Number(raw.global_rank))) {
      errors.push("global_rank debe ser número");
    }
    if (raw.rank_change?.trim() && Number.isNaN(Number(raw.rank_change))) {
      errors.push("rank_change debe ser número");
    }
    if (raw.peak_rank?.trim() && Number.isNaN(Number(raw.peak_rank))) {
      errors.push("peak_rank debe ser número");
    }
    if (raw.earnings?.trim() && Number.isNaN(Number(raw.earnings))) {
      errors.push("earnings debe ser número");
    }
    if (raw.founded_year?.trim() && Number.isNaN(Number(raw.founded_year))) {
      errors.push("founded_year debe ser número");
    }

    const form = parseForm(raw.form);
    for (const f of form) {
      if (f !== "W" && f !== "L" && f !== "D") {
        errors.push(`form inválido: ${f} (usa W, L o D separados por |)`);
        break;
      }
    }

    const trophies = parseJson(raw.trophies_json);
    if (!trophies.ok) errors.push("trophies_json no es JSON válido");
    else if (trophies.value != null && !Array.isArray(trophies.value)) {
      errors.push("trophies_json debe ser un array JSON");
    }

    const sponsors = parseJson(raw.sponsors_json);
    if (!sponsors.ok) errors.push("sponsors_json no es JSON válido");
    else if (sponsors.value != null && !Array.isArray(sponsors.value)) {
      errors.push("sponsors_json debe ser un array JSON");
    }

    const cardTheme = parseJson(raw.card_theme_json);
    if (!cardTheme.ok) errors.push("card_theme_json no es JSON válido");

    for (const key of [
      "twitter_url",
      "youtube_url",
      "twitch_url",
      "discord_url",
      "instagram_url",
      "tiktok_url",
      "website_url",
      "logo_url",
      "banner_url",
      "wiki_url",
    ] as const) {
      const v = raw[key]?.trim();
      if (v && !isValidUrl(v)) warnings.push(`${key} no parece URL válida`);
    }

    const roster = splitPipeList(raw.roster_slugs);
    if (options?.knownPlayerSlugs?.size) {
      for (const ps of roster) {
        if (!options.knownPlayerSlugs.has(ps)) {
          warnings.push(`roster_slugs: jugador "${ps}" no está en players_catalog`);
        }
      }
    }

    const captain = raw.captain_slug?.trim();
    if (captain && roster.length && !roster.includes(captain)) {
      warnings.push("captain_slug no está en roster_slugs");
    }

    if (!String(raw.main_description ?? "").trim() && !String(raw.history_content ?? "").trim()) {
      warnings.push("sin main_description ni history_content");
    }

    if (errors.length) {
      issues.push({ slug: slug || `(línea ${line})`, line, errors, warnings });
    } else {
      if (warnings.length) issues.push({ slug, line, errors: [], warnings });
      valid.push({ raw, line });
    }
  }

  return { schema, rows, valid, issues };
}
