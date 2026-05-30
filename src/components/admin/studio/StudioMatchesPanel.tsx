"use client";

import { useEffect, useMemo, useState } from "react";
import { getBscCircuitTournaments } from "@/lib/data/matches";
import { teamName } from "@/lib/data";
import { MATCH_ROUND_OPTIONS } from "@/lib/data/match-round-types";
import {
  MATCH_IMPORTANCE_OPTIONS,
  MATCH_DISPLAY_STATUS_OPTIONS,
  parseMatchMeta,
  type MatchImportance,
  type MatchDisplayStatus,
  type MatchPredictionsConfig,
} from "@/lib/data/match-meta";
import Link from "next/link";
import { VisualMapPicker } from "@/components/admin/studio/VisualMapPicker";
import { VisualBrawlerPicker } from "@/components/admin/studio/VisualBrawlerPicker";
import {
  StudioCard,
  StudioField,
  StudioInput,
  StudioSelect,
  StudioPills,
  StudioToast,
  MATCH_STATUS_OPTIONS,
} from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";
import { AdminTeamLogoPicker } from "@/components/admin/AdminTeamLogoPicker";
import { TeamLogo } from "@/components/ui/TeamLogo";

type TeamOption = { slug: string; name: string; tag: string; region?: string };

const ROUND_PILLS = MATCH_ROUND_OPTIONS.map((o) => ({
  id: o.id,
  label: o.filterLabel,
}));

type MatchRow = {
  id: string;
  team_a_slug: string;
  team_b_slug: string;
  tournament_slug: string;
  scheduled_at: string;
  status: string;
  stage?: string | null;
  format?: string | null;
  score_a: number;
  score_b: number;
  meta?: Record<string, unknown>;
};

function buildMatchMeta(form: {
  importance: MatchImportance;
  display_status: MatchDisplayStatus;
  featured_label: string;
  pred_winner: boolean;
  pred_exact: boolean;
  pred_mvp: boolean;
  pred_first_map: boolean;
  pred_decisive_map: boolean;
  pred_brawler_used: boolean;
  pred_brawler_mvp: boolean;
  pred_advanced: boolean;
  map_pool: string[];
  map_order: string[];
  map_current: string;
  map_decisive: string;
  bans_maps_a: string[];
  bans_maps_b: string[];
  brawlers_meta: string[];
  brawlers_recommended: string[];
  brawlers_banned_a: string[];
  brawlers_banned_b: string[];
}) {
  const predictions: MatchPredictionsConfig = {
    winner: form.pred_winner,
    exact_score: form.pred_exact,
    mvp: form.pred_mvp,
    first_map: form.pred_first_map,
    decisive_map: form.pred_decisive_map,
    brawler_most_used: form.pred_brawler_used,
    brawler_mvp: form.pred_brawler_mvp,
    advanced: form.pred_advanced,
  };
  return {
    importance: form.importance,
    display_status: form.display_status,
    allow_exact_score: form.pred_exact,
    featured_label: form.featured_label.trim() || undefined,
    predictions,
    maps: form.map_pool.length
      ? {
          possible: form.map_pool,
          order: form.map_order.length ? form.map_order : form.map_pool,
          current: form.map_current || undefined,
          decisive: form.map_decisive || undefined,
        }
      : undefined,
    bans: {
      maps_a: form.bans_maps_a,
      maps_b: form.bans_maps_b,
      brawlers_a: form.brawlers_banned_a,
      brawlers_b: form.brawlers_banned_b,
    },
    brawlers: {
      meta: form.brawlers_meta.length ? form.brawlers_meta : undefined,
      recommended: form.brawlers_recommended.length ? form.brawlers_recommended : undefined,
    },
  };
}

type MatchFilter = "all" | "upcoming" | "live" | "finished";

function MatchScoreQuickRow({
  match,
  onSave,
}: {
  match: MatchRow;
  onSave: (patch: { score_a: number; score_b: number }) => void;
}) {
  const [scoreA, setScoreA] = useState(match.score_a);
  const [scoreB, setScoreB] = useState(match.score_b);

  useEffect(() => {
    setScoreA(match.score_a);
    setScoreB(match.score_b);
  }, [match.score_a, match.score_b]);

  function commit() {
    if (scoreA === match.score_a && scoreB === match.score_b) return;
    onSave({ score_a: scoreA, score_b: scoreB });
  }

  return (
    <div className="bf-studio-match-score-quick">
      <label>
        <span>Marcador A</span>
        <StudioInput
          type="number"
          min={0}
          value={scoreA}
          onChange={(e) => setScoreA(Number(e.target.value))}
          onBlur={commit}
        />
      </label>
      <span className="bf-studio-vs">–</span>
      <label>
        <span>Marcador B</span>
        <StudioInput
          type="number"
          min={0}
          value={scoreB}
          onChange={(e) => setScoreB(Number(e.target.value))}
          onBlur={commit}
        />
      </label>
      <button type="button" className="bp-btn bp-btn-ghost" onClick={commit}>
        Guardar marcador
      </button>
    </div>
  );
}

export function StudioMatchesPanel() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [listFilter, setListFilter] = useState<MatchFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<"general" | "predict" | "maps" | "brawlers">("general");
  const [form, setForm] = useState({
    team_a_slug: "",
    team_b_slug: "",
    tournament_slug: "bsc-2026-challengers-spain",
    scheduled_at: new Date().toISOString().slice(0, 16),
    status: "upcoming" as (typeof MATCH_STATUS_OPTIONS)[number]["id"],
    stage: "Group Stage",
    format: "Bo5",
    score_a: 0,
    score_b: 0,
    importance: "normal" as MatchImportance,
    display_status: "upcoming" as MatchDisplayStatus,
    featured_label: "",
    pred_winner: true,
    pred_exact: false,
    pred_mvp: false,
    pred_first_map: false,
    pred_decisive_map: false,
    pred_brawler_used: false,
    pred_brawler_mvp: false,
    pred_advanced: false,
    map_pool: [] as string[],
    map_order: [] as string[],
    map_current: "",
    map_decisive: "",
    bans_maps_a: [] as string[],
    bans_maps_b: [] as string[],
    brawlers_meta: [] as string[],
    brawlers_recommended: [] as string[],
    brawlers_banned_a: [] as string[],
    brawlers_banned_b: [] as string[],
  });

  const tournaments = useMemo(
    () => getBscCircuitTournaments(40).map((t) => ({ slug: t.slug, name: t.shortName || t.name })),
    [],
  );

  useEffect(() => {
    fetch("/api/admin/catalog?type=teams")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.teams ?? []) as { slug: string; name?: string; tag?: string; region?: string }[];
        setTeams(
          list.map((t) => ({
            slug: t.slug,
            name: t.name || teamName(t.slug),
            tag: t.tag || teamName(t.slug).slice(0, 3).toUpperCase(),
            region: t.region,
          })),
        );
      })
      .catch(() => setTeams([]));
  }, []);

  function suggestId() {
    const d = form.scheduled_at.slice(0, 10).replace(/-/g, "");
    return `${form.team_a_slug}-vs-${form.team_b_slug}-${d}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  }

  function loadMatchForEdit(m: MatchRow) {
    const meta = parseMatchMeta(m.meta);
    const preds = meta.predictions ?? {};
    setEditingId(m.id);
    setForm({
      team_a_slug: m.team_a_slug,
      team_b_slug: m.team_b_slug,
      tournament_slug: m.tournament_slug,
      scheduled_at: m.scheduled_at.slice(0, 16),
      status: (MATCH_STATUS_OPTIONS.some((s) => s.id === m.status) ? m.status : "upcoming") as (typeof MATCH_STATUS_OPTIONS)[number]["id"],
      stage: m.stage ?? "Group Stage",
      format: m.format ?? "Bo5",
      score_a: m.score_a ?? 0,
      score_b: m.score_b ?? 0,
      importance: meta.importance ?? "normal",
      display_status: meta.display_status ?? "upcoming",
      featured_label: meta.featured_label ?? "",
      pred_winner: preds.winner !== false,
      pred_exact: !!preds.exact_score,
      pred_mvp: !!preds.mvp,
      pred_first_map: !!preds.first_map,
      pred_decisive_map: !!preds.decisive_map,
      pred_brawler_used: !!preds.brawler_most_used,
      pred_brawler_mvp: !!preds.brawler_mvp,
      pred_advanced: !!preds.advanced,
      map_pool: meta.maps?.possible ?? [],
      map_order: meta.maps?.order ?? meta.maps?.possible ?? [],
      map_current: meta.maps?.current ?? "",
      map_decisive: meta.maps?.decisive ?? "",
      bans_maps_a: meta.bans?.maps_a ?? [],
      bans_maps_b: meta.bans?.maps_b ?? [],
      brawlers_meta: meta.brawlers?.meta ?? [],
      brawlers_recommended: meta.brawlers?.recommended ?? [],
      brawlers_banned_a: meta.bans?.brawlers_a ?? [],
      brawlers_banned_b: meta.bans?.brawlers_b ?? [],
    });
    setFormTab("general");
    setMsg(`Editando: ${m.id}`);
    setError(false);
  }

  function resetNewMatchForm() {
    setEditingId(null);
    setForm({
      team_a_slug: "",
      team_b_slug: "",
      tournament_slug: "bsc-2026-challengers-spain",
      scheduled_at: new Date().toISOString().slice(0, 16),
      status: "upcoming",
      stage: "Group Stage",
      format: "Bo5",
      score_a: 0,
      score_b: 0,
      importance: "normal",
      display_status: "upcoming",
      featured_label: "",
      pred_winner: true,
      pred_exact: false,
      pred_mvp: false,
      pred_first_map: false,
      pred_decisive_map: false,
      pred_brawler_used: false,
      pred_brawler_mvp: false,
      pred_advanced: false,
      map_pool: [],
      map_order: [],
      map_current: "",
      map_decisive: "",
      bans_maps_a: [],
      bans_maps_b: [],
      brawlers_meta: [],
      brawlers_recommended: [],
      brawlers_banned_a: [],
      brawlers_banned_b: [],
    });
  }

  async function patchMatch(
    matchId: string,
    patch: {
      status?: string;
      score_a?: number;
      score_b?: number;
      stage?: string;
    },
    reload: () => void,
  ) {
    setMsg("");
    setError(false);
    const res = await fetch("/api/cms/admin/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "No se pudo actualizar");
      setError(true);
      return;
    }
    reload();
  }

  async function patchMatchStage(matchId: string, stage: string, reload: () => void) {
    setMsg("");
    setError(false);
    const res = await fetch("/api/cms/admin/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId, stage }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "No se pudo actualizar la fase");
      setError(true);
      return;
    }
    setMsg(`Fase actualizada: ${ROUND_PILLS.find((p) => p.id === stage)?.label ?? stage}`);
    reload();
  }

  async function saveMatch(reload: () => void) {
    if (!form.team_a_slug || !form.team_b_slug) {
      setMsg("Elige los dos equipos del partido.");
      setError(true);
      return;
    }
    setMsg("");
    setError(false);
    const id = editingId ?? suggestId();
    const res = await fetch("/api/cms/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match: {
          id,
          team_a_slug: form.team_a_slug,
          team_b_slug: form.team_b_slug,
          tournament_slug: form.tournament_slug,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          status: form.status,
          stage: form.stage,
          format: form.format,
          score_a: form.score_a,
          score_b: form.score_b,
          meta: buildMatchMeta(form),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "No se pudo guardar");
      setError(true);
      return;
    }
    setMsg("Partido guardado correctamente.");
    setError(false);
    reload();
  }

  return (
    <StudioModulePanel
      title="Partidos"
      lead="Crea y edita enfrentamientos con un formulario sencillo. Aparecerán en la web y en predicciones."
      apiPath="/api/cms/admin/matches"
      emptyTitle="No hay partidos guardados en el panel"
      emptyHint="Usa el formulario de arriba para crear el primero."
    >
      {(data, reload) => {
        const matches = (data.matches ?? []) as MatchRow[];
        return (
          <>
            <StudioCard title={editingId ? `Editar partido · ${editingId}` : "Nuevo partido"}>
              <div className="bf-studio-match-pick-head">
                <div className={`bf-studio-match-picked ${form.team_a_slug ? "has-team" : ""}`}>
                  {form.team_a_slug ? (
                    <TeamLogo slug={form.team_a_slug} name={teamName(form.team_a_slug)} size={48} />
                  ) : (
                    <span className="bf-studio-match-picked-empty">Local</span>
                  )}
                  <span>{form.team_a_slug ? teamName(form.team_a_slug) : "Equipo A"}</span>
                </div>
                <span className="bf-studio-vs">VS</span>
                <div className={`bf-studio-match-picked ${form.team_b_slug ? "has-team" : ""}`}>
                  {form.team_b_slug ? (
                    <TeamLogo slug={form.team_b_slug} name={teamName(form.team_b_slug)} size={48} />
                  ) : (
                    <span className="bf-studio-match-picked-empty">Visitante</span>
                  )}
                  <span>{form.team_b_slug ? teamName(form.team_b_slug) : "Equipo B"}</span>
                </div>
              </div>

              <div className="bf-studio-form-visual bf-studio-match-teams-pick">
                <StudioField label="Equipo local (azul)" hint="Clic en el escudo — lado izquierdo en web y predicciones">
                  <AdminTeamLogoPicker
                    teams={teams}
                    selected={form.team_a_slug}
                    onChange={(slug) => setForm({ ...form, team_a_slug: slug })}
                    disabledSlugs={form.team_b_slug ? [form.team_b_slug] : []}
                    maxHeight="220px"
                    compact
                    showRegionFilter={false}
                  />
                </StudioField>

                <StudioField label="Equipo visitante (rojo)" hint="Clic en el escudo — lado derecho">
                  <AdminTeamLogoPicker
                    teams={teams}
                    selected={form.team_b_slug}
                    onChange={(slug) => setForm({ ...form, team_b_slug: slug })}
                    disabledSlugs={form.team_a_slug ? [form.team_a_slug] : []}
                    maxHeight="220px"
                    compact
                    showRegionFilter={false}
                  />
                </StudioField>
              </div>

              <div className="bf-studio-form-tabs">
                {(
                  [
                    ["general", "General"],
                    ["predict", "Predicciones"],
                    ["maps", "Mapas"],
                    ["brawlers", "Brawlers"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`bf-studio-form-tab ${formTab === id ? "is-on" : ""}`}
                    onClick={() => setFormTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="bf-studio-form-visual">
                {formTab === "general" && (
                  <>
                <StudioField label="Torneo">
                  <StudioSelect
                    value={form.tournament_slug}
                    onChange={(e) => setForm({ ...form, tournament_slug: e.target.value })}
                  >
                    {tournaments.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                  </StudioSelect>
                </StudioField>

                <StudioField label="Fecha y hora">
                  <StudioInput
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  />
                </StudioField>

                <StudioField label="Estado del partido">
                  <StudioPills
                    options={MATCH_STATUS_OPTIONS}
                    value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                  />
                </StudioField>

                <StudioField label="Tipo de ronda" hint="Badges visuales en la web y filtros de /predictions">
                  <div className="bf-studio-round-badges">
                    {MATCH_ROUND_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`bf-studio-round-badge ${form.stage === o.id ? "is-on" : ""}`}
                        onClick={() => setForm({ ...form, stage: o.id })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </StudioField>

                <StudioField label="Importancia del partido">
                  <StudioPills
                    options={MATCH_IMPORTANCE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                    value={form.importance}
                    onChange={(v) => setForm({ ...form, importance: v })}
                  />
                </StudioField>

                {form.importance !== "normal" && (
                  <StudioField label="Etiqueta destacado (opcional)" hint="Vacío = etiqueta por defecto">
                    <StudioInput
                      value={form.featured_label}
                      onChange={(e) => setForm({ ...form, featured_label: e.target.value })}
                      placeholder="Partido de la semana"
                    />
                  </StudioField>
                )}

                <StudioField label="Estado visible">
                  <StudioPills
                    options={MATCH_DISPLAY_STATUS_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                    value={form.display_status}
                    onChange={(v) => setForm({ ...form, display_status: v })}
                  />
                </StudioField>

                <StudioField label="Formato">
                  <StudioSelect
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                  >
                    <option value="Bo1">Bo1</option>
                    <option value="Bo3">Bo3</option>
                    <option value="Bo5">Bo5</option>
                    <option value="Bo7">Bo7</option>
                  </StudioSelect>
                </StudioField>

                {(form.status === "live" || form.status === "finished") && (
                  <div className="bf-studio-score-row">
                    <StudioField label="Marcador local">
                      <StudioInput
                        type="number"
                        min={0}
                        value={form.score_a}
                        onChange={(e) => setForm({ ...form, score_a: Number(e.target.value) })}
                      />
                    </StudioField>
                    <StudioField label="Marcador visitante">
                      <StudioInput
                        type="number"
                        min={0}
                        value={form.score_b}
                        onChange={(e) => setForm({ ...form, score_b: Number(e.target.value) })}
                      />
                    </StudioField>
                  </div>
                )}
                  </>
                )}

                {formTab === "predict" && (
                  <div className="bf-studio-check-col">
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_winner}
                        onChange={(e) => setForm({ ...form, pred_winner: e.target.checked })}
                      />
                      Ganador
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_exact}
                        onChange={(e) => setForm({ ...form, pred_exact: e.target.checked })}
                      />
                      Resultado exacto (BO3/BO5/BO7)
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_mvp}
                        onChange={(e) => setForm({ ...form, pred_mvp: e.target.checked })}
                      />
                      MVP jugador
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_first_map}
                        onChange={(e) => setForm({ ...form, pred_first_map: e.target.checked })}
                      />
                      Primer mapa
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_decisive_map}
                        onChange={(e) => setForm({ ...form, pred_decisive_map: e.target.checked })}
                      />
                      Mapa decisivo
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_brawler_used}
                        onChange={(e) => setForm({ ...form, pred_brawler_used: e.target.checked })}
                      />
                      Brawler más usado
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_brawler_mvp}
                        onChange={(e) => setForm({ ...form, pred_brawler_mvp: e.target.checked })}
                      />
                      Brawler MVP
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_advanced}
                        onChange={(e) => setForm({ ...form, pred_advanced: e.target.checked })}
                      />
                      Activar todas las avanzadas
                    </label>
                  </div>
                )}

                {formTab === "maps" && (
                  <>
                    <VisualMapPicker
                      label="Map pool (imágenes en web)"
                      selected={form.map_pool}
                      onChange={(map_pool) =>
                        setForm({
                          ...form,
                          map_pool,
                          map_order: map_pool.filter((m) => form.map_order.includes(m)).length
                            ? form.map_order.filter((m) => map_pool.includes(m))
                            : map_pool,
                        })
                      }
                    />
                    <VisualMapPicker
                      label="Orden de mapas"
                      pool={form.map_pool.map((name) => ({ name }))}
                      selected={form.map_order}
                      onChange={(map_order) => setForm({ ...form, map_order })}
                    />
                    <StudioField label="Mapa actual">
                      <StudioSelect
                        value={form.map_current}
                        onChange={(e) => setForm({ ...form, map_current: e.target.value })}
                      >
                        <option value="">—</option>
                        {form.map_order.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </StudioSelect>
                    </StudioField>
                    <StudioField label="Mapa decisivo">
                      <StudioSelect
                        value={form.map_decisive}
                        onChange={(e) => setForm({ ...form, map_decisive: e.target.value })}
                      >
                        <option value="">—</option>
                        {form.map_order.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </StudioSelect>
                    </StudioField>
                    <VisualMapPicker
                      label={`Bans · ${form.team_a_slug ? teamName(form.team_a_slug) : "Team A"}`}
                      pool={form.map_pool.map((name) => ({ name }))}
                      selected={form.bans_maps_a}
                      onChange={(bans_maps_a) => setForm({ ...form, bans_maps_a })}
                      variant="ban"
                    />
                    <VisualMapPicker
                      label={`Bans · ${form.team_b_slug ? teamName(form.team_b_slug) : "Team B"}`}
                      pool={form.map_pool.map((name) => ({ name }))}
                      selected={form.bans_maps_b}
                      onChange={(bans_maps_b) => setForm({ ...form, bans_maps_b })}
                      variant="ban"
                    />
                  </>
                )}

                {formTab === "brawlers" && (
                  <>
                    <VisualBrawlerPicker
                      label="Meta (iconos en ficha)"
                      selected={form.brawlers_meta}
                      onChange={(brawlers_meta) => setForm({ ...form, brawlers_meta })}
                    />
                    <VisualBrawlerPicker
                      label="Recomendados"
                      selected={form.brawlers_recommended}
                      onChange={(brawlers_recommended) => setForm({ ...form, brawlers_recommended })}
                    />
                    <VisualBrawlerPicker
                      label="Baneados Team A"
                      selected={form.brawlers_banned_a}
                      onChange={(brawlers_banned_a) => setForm({ ...form, brawlers_banned_a })}
                      variant="ban"
                    />
                    <VisualBrawlerPicker
                      label="Baneados Team B"
                      selected={form.brawlers_banned_b}
                      onChange={(brawlers_banned_b) => setForm({ ...form, brawlers_banned_b })}
                      variant="ban"
                    />
                  </>
                )}
              </div>

              <div className="bf-studio-actions-row">
                <button type="button" className="bp-btn bp-btn-gold" onClick={() => saveMatch(reload)}>
                  {editingId ? "Guardar cambios" : "Guardar partido"}
                </button>
                {editingId && (
                  <button type="button" className="bp-btn bp-btn-ghost" onClick={resetNewMatchForm}>
                    Cancelar edición
                  </button>
                )}
              </div>
              <StudioToast message={msg} error={error} />
            </StudioCard>

            <h3 className="bf-studio-list-title">
              Partidos creados ({matches.length})
              <span className="bf-studio-muted" style={{ fontWeight: 600, marginLeft: 8 }}>
                — resultados y estado se editan aquí (no hay API externa automática)
              </span>
            </h3>
            <div className="bf-studio-pills" role="group" style={{ marginBottom: 12 }}>
              {(
                [
                  ["all", "Todos"],
                  ["upcoming", "Próximos"],
                  ["live", "En vivo"],
                  ["finished", "Finalizados"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`bf-studio-pill ${listFilter === id ? "is-on" : ""}`}
                  onClick={() => setListFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {matches.length === 0 ? (
              <p className="bf-studio-muted">Crea el primero con el formulario de arriba.</p>
            ) : (
              <ul className="bf-studio-match-list">
                {matches
                  .filter((m) => listFilter === "all" || m.status === listFilter)
                  .map((m) => (
                  <li key={m.id} className="bf-studio-match-item">
                    <div className="bf-studio-match-item-main">
                      <div className="bf-studio-match-item-head">
                        <strong>
                          {teamName(m.team_a_slug)} vs {teamName(m.team_b_slug)}
                        </strong>
                        <code className="bf-studio-match-id">{m.id}</code>
                      </div>
                      <span className="bf-studio-match-meta">
                        {m.format ?? "Bo3"} · {new Date(m.scheduled_at).toLocaleString("es-ES")}
                      </span>
                      <StudioField label="Estado (web en vivo / marcador)">
                        <StudioPills
                          options={MATCH_STATUS_OPTIONS}
                          value={
                            MATCH_STATUS_OPTIONS.some((s) => s.id === m.status)
                              ? (m.status as (typeof MATCH_STATUS_OPTIONS)[number]["id"])
                              : "upcoming"
                          }
                          onChange={(v) => patchMatch(m.id, { status: v }, reload)}
                        />
                      </StudioField>
                      {(m.status === "live" || m.status === "finished") && (
                        <MatchScoreQuickRow match={m} onSave={(patch) => patchMatch(m.id, patch, reload)} />
                      )}
                      <StudioField label="Fase en web">
                        <StudioPills
                          options={ROUND_PILLS}
                          value={
                            ROUND_PILLS.some((p) => p.id === (m.stage ?? ""))
                              ? (m.stage as (typeof ROUND_PILLS)[number]["id"])
                              : "Group Stage"
                          }
                          onChange={(v) => patchMatchStage(m.id, v, reload)}
                        />
                      </StudioField>
                      <div className="bf-studio-match-item-actions">
                        <button
                          type="button"
                          className="bp-btn bp-btn-ghost"
                          onClick={() => loadMatchForEdit(m)}
                        >
                          Editar completo
                        </button>
                        <Link href={`/matches/${m.id}`} className="bp-btn bp-btn-ghost" target="_blank">
                          Ver en web
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      }}
    </StudioModulePanel>
  );
}
