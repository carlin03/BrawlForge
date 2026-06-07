"use client";

import { TeamLogo } from "@/components/ui/TeamLogo";
import { getMatchEnrichment, MATCH_IMPORTANCE_OPTIONS } from "@/lib/data/match-meta";
import { MATCH_ROUND_OPTIONS } from "@/lib/data/match-round-types";
import {
  adminMatchFormToEsportsMatch,
  countEnabledPredictions,
  type AdminMatchFormState,
} from "@/lib/data/admin-match-form";
import { AdminMatchBracketCardPreview } from "@/components/admin/AdminMatchBracketCardPreview";
import { teamName, tournamentName } from "@/lib/data";

function MatchListRowPreview({ match }: { match: ReturnType<typeof adminMatchFormToEsportsMatch> }) {
  if (!match) return null;
  const winnerA = match.status === "finished" && match.scoreA > match.scoreB;
  const winnerB = match.status === "finished" && match.scoreB > match.scoreA;
  const meta = getMatchEnrichment(match);

  return (
    <div
      className={`bf-match bf-match-rich bf-admin-match-preview-row ${match.status === "live" ? "bf-match-live" : ""}`}
      aria-hidden
    >
      <div className="w-16 shrink-0 text-center">
        {match.status === "live" ? (
          <span className="bf-badge bf-badge-live text-[9px]">
            <span className="bf-pulse" />
            LIVE
          </span>
        ) : match.status === "upcoming" ? (
          <span className="text-[10px] font-bold text-[var(--bf-muted)]">
            {new Date(match.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-[var(--bf-dim)]">FT</span>
        )}
      </div>

      <div className={`bf-match-team ${winnerA ? "font-bold" : ""}`}>
        <span className={`truncate text-sm ${winnerA ? "text-[var(--bf-yellow)]" : "text-[var(--bf-muted)]"}`}>
          {teamName(match.teamASlug, match)}
        </span>
        <TeamLogo key={`a-${match.teamASlug}`} slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={40} />
      </div>

      <div className="bf-match-score">
        {match.status === "upcoming" ? (
          <span className="text-[var(--bf-red)] text-base font-black">VS</span>
        ) : (
          <>
            <span className={winnerA ? "text-[var(--bf-yellow)]" : "text-[var(--bf-dim)]"}>{match.scoreA}</span>
            <span className="text-[var(--bf-dim)] mx-1">:</span>
            <span className={winnerB ? "text-[var(--bf-yellow)]" : "text-[var(--bf-dim)]"}>{match.scoreB}</span>
          </>
        )}
      </div>

      <div className={`bf-match-team end ${winnerB ? "font-bold" : ""}`}>
        <TeamLogo key={`b-${match.teamBSlug}`} slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={40} />
        <span className={`truncate text-sm ${winnerB ? "text-[var(--bf-yellow)]" : "text-[var(--bf-muted)]"}`}>
          {teamName(match.teamBSlug, match)}
        </span>
      </div>

      <div className="hidden shrink-0 sm:block w-36 text-right">
        <div className="text-[11px] font-semibold text-[var(--bf-blue)]">{tournamentName(match.tournamentSlug)}</div>
        <div className="text-[10px] text-[var(--bf-yellow)] mt-0.5">{meta.map}</div>
        <div className="text-[9px] text-[var(--bf-dim)] mt-0.5 truncate">Ban: {meta.bans.slice(0, 2).join(", ")}</div>
        <div className="text-[9px] font-bold text-[var(--bf-muted)] mt-1">{meta.quickStat}</div>
      </div>
    </div>
  );
}

function MatchDetailHeroPreview({ match }: { match: NonNullable<ReturnType<typeof adminMatchFormToEsportsMatch>> }) {
  const winA = match.status === "finished" && match.scoreA > match.scoreB;
  const winB = match.status === "finished" && match.scoreB > match.scoreA;

  const scoreBlock =
    match.status === "upcoming" ? (
      <span className="fu-duel-vs">VS</span>
    ) : (
      <div className="fu-match-score-hero">
        <span className={winA ? "is-win" : ""}>{match.scoreA}</span>
        <span style={{ color: "var(--bp-dim)", margin: "0 12px" }}>–</span>
        <span className={winB ? "is-win" : ""}>{match.scoreB}</span>
      </div>
    );

  return (
    <div className="bf-admin-match-hero-preview">
      <p className="bf-admin-tournament-hero-lead" style={{ marginBottom: 12 }}>
        {new Date(match.date).toLocaleString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="fu-duel-showcase bf-admin-match-duel">
        <div className="fu-duel-logo">
          <TeamLogo key={`hero-a-${match.teamASlug}`} slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={72} glow />
          <span>{teamName(match.teamASlug, match)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2 }}>
          {scoreBlock}
          {match.status === "live" && (
            <span className="bp-chip bp-chip-live">
              <span className="bp-live-dot" /> LIVE
            </span>
          )}
        </div>
        <div className="fu-duel-logo">
          <TeamLogo key={`hero-b-${match.teamBSlug}`} slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={72} glow />
          <span>{teamName(match.teamBSlug, match)}</span>
        </div>
      </div>
    </div>
  );
}

function MatchPredictRowPreview({ match }: { match: NonNullable<ReturnType<typeof adminMatchFormToEsportsMatch>> }) {
  const stageLabel = MATCH_ROUND_OPTIONS.find((o) => o.id === match.stage)?.filterLabel ?? match.stage;
  return (
    <div className="bf-predict-match-row bf-admin-match-preview-predict" aria-hidden>
      <div className="bf-predict-row-logos">
        <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={40} glow={false} />
        <span className="bf-predict-row-vs">vs</span>
        <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={40} glow={false} />
      </div>
      <div className="bf-predict-row-copy">
        <p className="bf-predict-row-title">
          {teamName(match.teamASlug, match)} <span>vs</span> {teamName(match.teamBSlug, match)}
        </p>
        <p className="bf-predict-row-sub">
          {tournamentName(match.tournamentSlug)} · {stageLabel}
        </p>
      </div>
      <div className="bf-predict-row-end">
        <span className="bf-predict-row-pct is-muted">Votar</span>
        <span className="bf-predict-row-pts">+pts</span>
      </div>
    </div>
  );
}

export function AdminMatchWebPreview({
  matchId,
  form,
}: {
  matchId: string | null;
  form: AdminMatchFormState;
}) {
  const match = adminMatchFormToEsportsMatch(matchId, form);
  if (!match) {
    return (
      <div className="bf-admin-tournament-preview bf-admin-match-preview">
        <p className="bf-studio-hint bf-admin-tournament-preview-title">Vista previa en la web</p>
        <p className="bf-admin-field-hint">Elige los dos equipos para ver cómo quedará el partido.</p>
      </div>
    );
  }

  const previewKey = [
    match.id,
    match.teamASlug,
    match.teamBSlug,
    match.status,
    match.scoreA,
    match.scoreB,
    match.date,
    match.stage,
    match.format,
    JSON.stringify(match.meta),
  ].join("|");

  const roundLabel = MATCH_ROUND_OPTIONS.find((o) => o.id === form.stage)?.label ?? form.stage;
  const importanceOpt = MATCH_IMPORTANCE_OPTIONS.find((o) => o.id === form.importance);
  const featured =
    form.featured_label.trim() ||
    (importanceOpt?.featuredLabel && form.importance !== "normal" ? importanceOpt.featuredLabel : "");
  const predCount = countEnabledPredictions(form);
  const mapCount = form.map_pool.length;

  const formWithId = { ...form, id: matchId?.trim() || "vista-previa" };

  return (
    <div className="bf-admin-tournament-preview bf-admin-match-preview" key={previewKey}>
      <p className="bf-studio-hint bf-admin-tournament-preview-title">Vista previa en la web</p>
      <p className="bf-admin-field-hint" style={{ margin: "0 0 12px" }}>
        Se actualiza al editar (sin guardar). La tarjeta grande es la misma que en bracket y predicciones.
      </p>

      <AdminMatchBracketCardPreview match={formWithId} compactLabel={false} />

      <div className="bf-admin-match-preview-chips">
        <span className="bp-chip">{roundLabel}</span>
        <span className="bp-chip">{form.format}</span>
        {featured && <span className="bp-chip bp-chip-gold">{featured}</span>}
        {predCount > 0 && <span className="bp-chip bp-chip-blue">{predCount} predicciones</span>}
        {mapCount > 0 && <span className="bp-chip">{mapCount} mapas</span>}
        {form.map_current && <span className="bp-chip">Mapa: {form.map_current}</span>}
      </div>

      <div className="bf-admin-tournament-preview-block">
        <span className="bf-admin-tournament-preview-label">Listado · /matches</span>
        <div className="bf-admin-tournament-preview-frame">
          <MatchListRowPreview match={match} />
        </div>
      </div>

      <div className="bf-admin-tournament-preview-block">
        <span className="bf-admin-tournament-preview-label">Ficha · /matches/{match.id}</span>
        <div className="bf-admin-tournament-preview-frame bf-admin-match-hero-frame">
          <MatchDetailHeroPreview match={match} />
        </div>
      </div>

      <div className="bf-admin-tournament-preview-block">
        <span className="bf-admin-tournament-preview-label">Predicciones · /predictions</span>
        <div className="bf-admin-tournament-preview-frame">
          <MatchPredictRowPreview match={match} />
        </div>
      </div>
    </div>
  );
}
