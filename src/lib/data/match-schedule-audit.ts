import { isBscCircuitSlug } from "./bsc-tournaments";
import type { EsportsMatch } from "./esports-match-types";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { isBracketPlaceholderSlug } from "./bracket-slot-display";
import { isPendingTeamSlug } from "./match-meta";
import { getMatchStageMeta } from "./match-stage-meta";
import {
  canonicalTournamentSlug,
  matchDedupeKey,
  normalizePlayoffPool,
} from "./playoff-pool-normalize";
import { isKnownTeamSlug, isDisplayableMatch } from "./pickem-eligibility";
import {
  isPickemTemplateMatch,
  isPublicScheduleMatch,
  isStaleTournamentUpcoming,
} from "./match-schedule-trust";
import { getTournament } from "./matches";

export type MatchAuditSeverity = "error" | "warn" | "info";

export type MatchAuditCode =
  | "duplicate_crux"
  | "unknown_team"
  | "pickem_template"
  | "stale_upcoming"
  | "placeholder_team"
  | "same_team_both_sides"
  | "incomplete_bracket"
  | "unknown_tournament"
  | "score_status_mismatch"
  | "hidden_by_public_filter";

export interface MatchAuditIssue {
  code: MatchAuditCode;
  severity: MatchAuditSeverity;
  matchId: string;
  message: string;
  tournamentSlug?: string;
  dedupeKey?: string;
  relatedIds?: string[];
}

export interface TournamentBracketSnapshot {
  slug: string;
  quarters: number;
  semis: number;
  grandFinals: number;
  issueCount: number;
}

export interface MatchScheduleAuditReport {
  scannedAt: string;
  poolSize: number;
  publicScheduleSize: number;
  issues: MatchAuditIssue[];
  summary: Partial<Record<MatchAuditCode, number>>;
  tournaments: TournamentBracketSnapshot[];
  recommendations: string[];
}

function roundKey(m: EsportsMatch): string {
  return getMatchStageMeta(m.stage).roundKey;
}

function bump(summary: Partial<Record<MatchAuditCode, number>>, code: MatchAuditCode) {
  summary[code] = (summary[code] ?? 0) + 1;
}

function push(
  issues: MatchAuditIssue[],
  summary: Partial<Record<MatchAuditCode, number>>,
  issue: MatchAuditIssue,
) {
  issues.push(issue);
  bump(summary, issue.code);
}

/** Analiza un pool (legacy, CMS o fusionado) y devuelve problemas accionables. */
export function auditMatchPool(pool: EsportsMatch[]): MatchScheduleAuditReport {
  const issues: MatchAuditIssue[] = [];
  const summary: Partial<Record<MatchAuditCode, number>> = {};
  const recommendations: string[] = [];
  const publicMatches = pool.filter(isPublicScheduleMatch);

  const byDedupe = new Map<string, EsportsMatch[]>();
  for (const m of pool) {
    const key = matchDedupeKey(m);
    const arr = byDedupe.get(key) ?? [];
    arr.push(m);
    byDedupe.set(key, arr);
  }

  for (const [key, group] of byDedupe) {
    if (group.length < 2) continue;
    const ids = group.map((m) => m.id);
    for (const m of group) {
      push(issues, summary, {
        code: "duplicate_crux",
        severity: "error",
        matchId: m.id,
        dedupeKey: key,
        tournamentSlug: m.tournamentSlug,
        relatedIds: ids.filter((id) => id !== m.id),
        message: `Mismo cruce duplicado (${group.length} filas). Deja una en CMS y borra el resto.`,
      });
    }
  }

  for (const m of pool) {
    if (isPickemTemplateMatch(m)) {
      push(issues, summary, {
        code: "pickem_template",
        severity: "info",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "Plantilla pick'em (no es calendario oficial). No debería estar en matches_catalog.",
      });
      continue;
    }

    if (m.teamASlug === m.teamBSlug) {
      push(issues, summary, {
        code: "same_team_both_sides",
        severity: "error",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "El mismo equipo aparece en ambos lados.",
      });
    }

    if (
      isPendingTeamSlug(m.teamASlug) ||
      isPendingTeamSlug(m.teamBSlug) ||
      isBracketPlaceholderSlug(m.teamASlug) ||
      isBracketPlaceholderSlug(m.teamBSlug)
    ) {
      push(issues, summary, {
        code: "placeholder_team",
        severity: "warn",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "Falta rival real (TBD o winner-qf-*). Oculto en /matches hasta confirmar equipos.",
      });
    }

    if (!isDisplayableMatch(m)) {
      const bad = [m.teamASlug, m.teamBSlug].filter((s) => !isKnownTeamSlug(s));
      push(issues, summary, {
        code: "unknown_team",
        severity: "error",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: `Equipo desconocido en catálogo: ${bad.join(", ")}. Corrige slug o da de alta el club.`,
      });
    }

    if (isStaleTournamentUpcoming(m)) {
      push(issues, summary, {
        code: "stale_upcoming",
        severity: "warn",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "Torneo ya terminó pero el partido sigue como próximo. Márcalo finished o bórralo.",
      });
    }

    if (isBscCircuitSlug(m.tournamentSlug) && !getTournament(m.tournamentSlug)) {
      push(issues, summary, {
        code: "unknown_tournament",
        severity: "warn",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "Slug de torneo no reconocido en el circuito BSC 2026.",
      });
    }

    const effective = getEffectiveMatchStatus(m);
    const hasScore = m.scoreA !== m.scoreB && (m.scoreA > 0 || m.scoreB > 0);
    if (effective === "finished" && !hasScore) {
      push(issues, summary, {
        code: "score_status_mismatch",
        severity: "warn",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "Marcado como terminado sin marcador válido.",
      });
    }
    if (effective === "upcoming" && hasScore && m.status !== "live") {
      push(issues, summary, {
        code: "score_status_mismatch",
        severity: "warn",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "Tiene marcador pero sigue upcoming. Actualiza estado o CMS.",
      });
    }

    if (!isPublicScheduleMatch(m) && !isPickemTemplateMatch(m) && isDisplayableMatch(m)) {
      push(issues, summary, {
        code: "hidden_by_public_filter",
        severity: "info",
        matchId: m.id,
        tournamentSlug: m.tournamentSlug,
        message: "No se muestra en calendario público (placeholder, torneo pasado, etc.).",
      });
    }
  }

  const bracketByTour = new Map<string, { quarters: number; semis: number; grandFinals: number }>();
  const displayable = pool.filter((m) => isDisplayableMatch(m) && !isPickemTemplateMatch(m));

  for (const m of displayable) {
    const rk = roundKey(m);
    if (rk !== "quarter" && rk !== "semi" && rk !== "grand_final" && rk !== "final") continue;
    const canon = canonicalTournamentSlug(m.tournamentSlug);
    const snap = bracketByTour.get(canon) ?? { quarters: 0, semis: 0, grandFinals: 0 };
    if (rk === "quarter") snap.quarters += 1;
    else if (rk === "semi") snap.semis += 1;
    else snap.grandFinals += 1;
    bracketByTour.set(canon, snap);
  }

  const normalized = normalizePlayoffPool(displayable);
  const normByTour = new Map<string, { quarters: number; semis: number; grandFinals: number }>();
  for (const m of normalized) {
    const rk = roundKey(m);
    if (rk !== "quarter" && rk !== "semi" && rk !== "grand_final" && rk !== "final") continue;
    const canon = canonicalTournamentSlug(m.tournamentSlug);
    const snap = normByTour.get(canon) ?? { quarters: 0, semis: 0, grandFinals: 0 };
    if (rk === "quarter") snap.quarters += 1;
    else if (rk === "semi") snap.semis += 1;
    else snap.grandFinals += 1;
    normByTour.set(canon, snap);
  }

  const tournaments: TournamentBracketSnapshot[] = [];

  for (const [slug, snap] of bracketByTour) {
    let issueCount = 0;
    const norm = normByTour.get(slug);
    if (snap.quarters > 0 && snap.quarters !== 4) {
      issueCount += 1;
      push(issues, summary, {
        code: "incomplete_bracket",
        severity: "warn",
        matchId: `${slug}:bracket`,
        tournamentSlug: slug,
        message: `Bracket: ${snap.quarters} cuartos (se esperan 0 o 4). Tras limpiar duplicados quedan ${norm?.quarters ?? 0}.`,
      });
    }
    if (snap.quarters === 4 && snap.semis > 0 && snap.semis !== 2) {
      issueCount += 1;
      push(issues, summary, {
        code: "incomplete_bracket",
        severity: "warn",
        matchId: `${slug}:bracket`,
        tournamentSlug: slug,
        message: `Bracket: ${snap.semis} semis (se esperan 2). Tras normalizar: ${norm?.semis ?? 0}.`,
      });
    }
    if (snap.semis > 0 && snap.grandFinals === 0) {
      issueCount += 1;
      push(issues, summary, {
        code: "incomplete_bracket",
        severity: "warn",
        matchId: `${slug}:bracket`,
        tournamentSlug: slug,
        message: "Hay semifinales pero falta la gran final en datos.",
      });
    }
    tournaments.push({
      slug,
      quarters: snap.quarters,
      semis: snap.semis,
      grandFinals: snap.grandFinals,
      issueCount,
    });
  }

  const dupes = summary.duplicate_crux ?? 0;
  const templates = summary.pickem_template ?? 0;
  if (dupes > 0) {
    recommendations.push(
      "Fusiona duplicados: en Admin → Partidos, borra IDs viejos (mf26-*, lp-*) y deja solo la fila CMS con schedule_trust confirmed.",
    );
  }
  if (templates > 0) {
    recommendations.push(
      "Quita plantillas pick'em de matches_catalog; solo deben vivir en predicciones (seed), no en el catálogo.",
    );
  }
  if ((summary.unknown_team ?? 0) > 0) {
    recommendations.push(
      "Revisa slugs de equipo en CSV/import: deben coincidir con teams (fut-esports, sk-gaming, …).",
    );
  }
  if (publicMatches.length < pool.length * 0.5 && pool.length > 10) {
    recommendations.push(
      "Más de la mitad del pool no es público: prioriza sync Supercell + edición manual y desactiva import masivo desde código.",
    );
  }
  recommendations.push(
    "Fuente de verdad recomendada: matches_catalog (CMS) + cron Supercell para LIVE/marcador; legacy Liquipedia solo como respaldo.",
  );

  return {
    scannedAt: new Date().toISOString(),
    poolSize: pool.length,
    publicScheduleSize: publicMatches.length,
    issues,
    summary,
    tournaments: tournaments.sort((a, b) => b.issueCount - a.issueCount),
    recommendations,
  };
}
