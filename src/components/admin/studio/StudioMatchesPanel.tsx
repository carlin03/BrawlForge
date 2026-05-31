"use client";

import { useEffect, useMemo, useState } from "react";
import { getBscCircuitTournaments } from "@/lib/data/matches";
import { teamName } from "@/lib/data";
import { MATCH_ROUND_OPTIONS } from "@/lib/data/match-round-types";
import {
  MATCH_IMPORTANCE_OPTIONS,
  MATCH_DISPLAY_STATUS_OPTIONS,
  type MatchImportance,
  type MatchDisplayStatus,
} from "@/lib/data/match-meta";
import {
  buildMatchMetaFromForm,
  defaultAdminMatchPredictionFields,
  matchCatalogRowToForm,
  type AdminMatchFormState,
} from "@/lib/data/admin-match-form";
import { AdminMatchWebPreview } from "@/components/admin/AdminMatchWebPreview";
import { AdminMatchBracketCardPreview } from "@/components/admin/AdminMatchBracketCardPreview";
import Link from "next/link";
import { MapOrderFromLibrary } from "@/components/admin/studio/MapOrderFromLibrary";
import {
  applyTemplateToMatchForm,
  DEFAULT_TOURNAMENT_MATCH_TEMPLATES,
  suggestTemplateForTournament,
} from "@/lib/data/tournament-match-templates";
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

type MatchFilter = "all" | "upcoming" | "live" | "finished";
type MatchListLayout = "auto" | "1" | "2" | "3";

const MATCH_LIST_LAYOUT_KEY = "bf-admin-match-list-layout";

function readStoredLayout(): MatchListLayout {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(MATCH_LIST_LAYOUT_KEY);
  if (v === "1" || v === "2" || v === "3" || v === "auto") return v;
  return "auto";
}

function resolveListColumns(filter: MatchFilter, layout: MatchListLayout): 1 | 2 | 3 {
  if (layout === "1") return 1;
  if (layout === "2") return 2;
  if (layout === "3") return 3;
  return filter === "finished" ? 3 : 1;
}

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
  const [listLayout, setListLayout] = useState<MatchListLayout>("auto");
  const [panelView, setPanelView] = useState<"list" | "form">("list");
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<"general" | "predict" | "maps" | "brawlers">("general");
  const [form, setForm] = useState<AdminMatchFormState>({
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
    ...defaultAdminMatchPredictionFields(),
    points_winner: 0,
    points_exact: 0,
    points_mvp: 0,
    points_map_winner: 0,
    points_map_pick: 0,
    points_brawler_ban: 0,
    points_brawler_mvp: 0,
    points_brawler_used: 0,
    points_brawler_most_banned: 0,
    points_brawler_lowest_wr: 0,
    points_participation: 0,
    points_perfect_bonus: 0,
    result_mvp_player: "",
    result_brawler_wr: "",
    result_brawler_used: "",
    result_brawler_banned: "",
    result_brawler_low_wr: "",
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
  const matchTemplates = DEFAULT_TOURNAMENT_MATCH_TEMPLATES;
  const [templateId, setTemplateId] = useState("");

  function applyMatchTemplate(id: string) {
    setTemplateId(id);
    const t = matchTemplates.find((x) => x.id === id);
    if (!t || id === "custom-empty") return;
    const applied = applyTemplateToMatchForm(t);
    setForm((f) => ({
      ...f,
      format: applied.format,
      map_pool: applied.map_pool,
      map_order: applied.map_order,
      map_decisive: applied.map_decisive,
      ...defaultAdminMatchPredictionFields(),
    }));
    setMsg(`Plantilla aplicada: ${t.label}`);
    setError(false);
  }

  useEffect(() => {
    setListLayout(readStoredLayout());
  }, []);

  function setListLayoutPersisted(layout: MatchListLayout) {
    setListLayout(layout);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MATCH_LIST_LAYOUT_KEY, layout);
    }
  }

  useEffect(() => {
    fetch("/api/admin/teams")
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
    const rowForm = matchCatalogRowToForm(m);
    setEditingId(m.id);
    const { id: _id, ...rest } = rowForm;
    setForm({
      ...rest,
      status: (MATCH_STATUS_OPTIONS.some((s) => s.id === m.status) ? m.status : "upcoming") as (typeof MATCH_STATUS_OPTIONS)[number]["id"],
    });
    setFormTab("general");
    setPanelView("form");
    setMsg(`Editando: ${m.id}`);
    setError(false);
  }

  function clearMatchForm() {
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
      ...defaultAdminMatchPredictionFields(),
      points_winner: 0,
      points_exact: 0,
      points_mvp: 0,
      points_map_winner: 0,
      points_map_pick: 0,
      points_brawler_ban: 0,
      points_brawler_mvp: 0,
      points_brawler_used: 0,
      points_brawler_most_banned: 0,
      points_brawler_lowest_wr: 0,
      points_participation: 0,
      points_perfect_bonus: 0,
      result_mvp_player: "",
      result_brawler_wr: "",
      result_brawler_used: "",
      result_brawler_banned: "",
      result_brawler_low_wr: "",
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

  function resetNewMatchForm() {
    clearMatchForm();
    setPanelView("list");
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
          meta: buildMatchMetaFromForm(form),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "No se pudo guardar");
      setError(true);
      return;
    }
    setMsg(editingId ? "Partido actualizado." : "Partido guardado correctamente.");
    setError(false);
    clearMatchForm();
    setPanelView("list");
    reload();
  }

  async function syncFromWeb(reload: () => void) {
    setSyncing(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/matches", { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo importar");
      setMsg(data.message || `Importados ${data.imported ?? 0} partidos.`);
      setError(false);
      setPanelView("list");
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error al importar");
      setError(true);
    }
    setSyncing(false);
  }

  async function applyPredictionDefaultsToAll(reload: () => void) {
    setSyncing(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/matches/apply-prediction-defaults", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo aplicar");
      setMsg(data.message || `Actualizados ${data.updated ?? 0} partidos.`);
      setError(false);
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
      setError(true);
    }
    setSyncing(false);
  }

  async function syncFromSupercell(reload: () => void) {
    setSyncing(true);
    setMsg("");
    setError(false);
    try {
      const res = await fetch("/api/cms/admin/matches/sync-supercell", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo sincronizar");
      setMsg(data.message || "Sincronización Supercell completada.");
      setError(false);
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error Supercell");
      setError(true);
    }
    setSyncing(false);
  }

  return (
    <StudioModulePanel
      title="Partidos"
      lead="Pestaña Lista: en vivo y marcador. Pestaña Crear: equipos, mapas y predicciones del partido."
      apiPath="/api/cms/admin/matches"
      emptyTitle="No hay partidos guardados en el panel"
      emptyHint="Usa el formulario de arriba para crear el primero."
    >
      {(data, reload) => {
        const matches = (data.matches ?? []) as MatchRow[];
        const web = data.web as
          | { totalOnSite?: number; inCatalog?: number; pendingImport?: number }
          | undefined;
        const pendingImport = web?.pendingImport ?? 0;
        const totalOnSite = web?.totalOnSite ?? 0;
        const filtered = matches.filter((m) => listFilter === "all" || m.status === listFilter);
        const listColumns = resolveListColumns(listFilter, listLayout);
        return (
          <>
            <StudioToast message={msg} error={error} />
            <div className="bf-studio-match-mode-tabs" role="tablist" aria-label="Vista de partidos">
              <button
                type="button"
                role="tab"
                aria-selected={panelView === "list"}
                className={`bf-studio-competition-tab ${panelView === "list" ? "is-on" : ""}`}
                onClick={() => setPanelView("list")}
              >
                Lista ({matches.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panelView === "form"}
                className={`bf-studio-competition-tab ${panelView === "form" ? "is-on" : ""}`}
                onClick={() => {
                  if (!editingId) clearMatchForm();
                  setPanelView("form");
                }}
              >
                {editingId ? "Editar partido" : "Crear partido"}
              </button>
            </div>

            {panelView === "list" && (
              <StudioCard title={`Partidos en el catálogo (${matches.length})`}>
                <p className="bf-studio-hint" style={{ marginTop: 0 }}>
                  Lista en Supabase: en vivo, marcador y fase.{" "}
                  <strong>Sincronizar Supercell</strong> actualiza LIVE/FIN y marcador sin duplicar partidos
                  manuales. Predicciones en <strong>Editar completo</strong>.
                </p>
                <div className="bf-studio-match-sync-actions">
                  <button
                    type="button"
                    className="bp-btn bp-btn-gold"
                    disabled={syncing}
                    onClick={() => syncFromSupercell(reload)}
                  >
                    {syncing ? "Sincronizando…" : "Sincronizar Supercell (LIVE + marcador)"}
                  </button>
                  {pendingImport > 0 && (
                    <button
                      type="button"
                      className="bp-btn bp-btn-ghost"
                      disabled={syncing}
                      onClick={() => syncFromWeb(reload)}
                    >
                      Importar {pendingImport} de la web (código)
                    </button>
                  )}
                </div>
                <div className="bf-studio-match-list-toolbar">
                  <div>
                    <span className="bf-studio-match-toolbar-label">Estado</span>
                    <div className="bf-studio-pills" role="group">
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
                  </div>
                  <div>
                    <span className="bf-studio-match-toolbar-label">
                      Partidos por fila
                      {listLayout === "auto" && (
                        <span className="bf-studio-match-toolbar-hint">
                          {" "}
                          (auto: 3 en Finalizados, 1 en el resto — ahora {listColumns})
                        </span>
                      )}
                    </span>
                    <div className="bf-studio-pills" role="group">
                      {(
                        [
                          ["auto", "Auto"],
                          ["1", "1×1"],
                          ["2", "2×2"],
                          ["3", "3×3"],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          className={`bf-studio-pill ${listLayout === id ? "is-on" : ""}`}
                          onClick={() => setListLayoutPersisted(id)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {filtered.length === 0 ? (
                  <div className="bf-studio-empty-inline">
                    <p className="bf-studio-muted">
                      {matches.length === 0
                        ? "No hay partidos en Supabase todavía. Importa desde la web o crea uno nuevo."
                        : "Ningún partido con este filtro."}
                    </p>
                    {pendingImport > 0 && (
                      <button
                        type="button"
                        className="bp-btn bp-btn-gold"
                        disabled={syncing}
                        onClick={() => syncFromWeb(reload)}
                      >
                        {syncing ? "Importando…" : `Importar ${pendingImport} de la web`}
                      </button>
                    )}
                    <button
                      type="button"
                      className="bp-btn bp-btn-ghost"
                      onClick={() => {
                        clearMatchForm();
                        setPanelView("form");
                      }}
                    >
                      Crear partido manual
                    </button>
                  </div>
                ) : (
                  <ul
                    className={`bf-studio-match-list bf-studio-match-list--cols-${listColumns}`}
                    id="bf-studio-match-list"
                    data-layout={listLayout}
                    data-filter={listFilter}
                  >
                    {filtered.map((m) => (
                      <li key={m.id} className="bf-studio-match-item">
                        <AdminMatchBracketCardPreview match={matchCatalogRowToForm(m)} />
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
                          <StudioField label="Estado (En vivo / marcador en web)">
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
                            <MatchScoreQuickRow
                              match={m}
                              onSave={(patch) => patchMatch(m.id, patch, reload)}
                            />
                          )}
                          <StudioField label="Fase en /predictions">
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
                              className="bp-btn bp-btn-gold"
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
                <div className="bf-studio-actions-row" style={{ marginTop: 16 }}>
                  <button type="button" className="bp-btn bp-btn-ghost" onClick={() => reload()}>
                    Actualizar lista
                  </button>
                  <button
                    type="button"
                    className="bp-btn bp-btn-gold"
                    onClick={() => {
                      clearMatchForm();
                      setPanelView("form");
                    }}
                  >
                    + Nuevo partido
                  </button>
                </div>
              </StudioCard>
            )}

            {panelView === "form" && (
            <StudioCard title={editingId ? `Editar partido · ${editingId}` : "Nuevo partido"}>
              <div className="bf-studio-match-pick-head">
                <div className={`bf-studio-match-picked ${form.team_a_slug ? "has-team" : ""}`}>
                  {form.team_a_slug ? (
                    <TeamLogo
                      key={form.team_a_slug || "a-empty"}
                      slug={form.team_a_slug}
                      name={teamName(form.team_a_slug)}
                      size={48}
                    />
                  ) : (
                    <span className="bf-studio-match-picked-empty">Local</span>
                  )}
                  <span>{form.team_a_slug ? teamName(form.team_a_slug) : "Equipo A"}</span>
                </div>
                <span className="bf-studio-vs">VS</span>
                <div className={`bf-studio-match-picked ${form.team_b_slug ? "has-team" : ""}`}>
                  {form.team_b_slug ? (
                    <TeamLogo
                      key={form.team_b_slug || "b-empty"}
                      slug={form.team_b_slug}
                      name={teamName(form.team_b_slug)}
                      size={48}
                    />
                  ) : (
                    <span className="bf-studio-match-picked-empty">Visitante</span>
                  )}
                  <span>{form.team_b_slug ? teamName(form.team_b_slug) : "Equipo B"}</span>
                </div>
              </div>

              <AdminMatchWebPreview matchId={editingId} form={form as AdminMatchFormState} />

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
                    onChange={(e) => {
                      const slug = e.target.value;
                      const suggested = suggestTemplateForTournament(slug, matchTemplates);
                      setForm({ ...form, tournament_slug: slug });
                      if (suggested && !templateId) {
                        applyMatchTemplate(suggested.id);
                      }
                    }}
                  >
                    {tournaments.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                  </StudioSelect>
                </StudioField>

                <StudioField
                  label="Plantilla de partido"
                  hint="Rellena formato, pool y orden. Imagen y estrategia vienen de Biblioteca global."
                >
                  <StudioSelect
                    value={templateId}
                    onChange={(e) => applyMatchTemplate(e.target.value)}
                  >
                    <option value="">— Elegir plantilla BSC —</option>
                    {matchTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </StudioSelect>
                </StudioField>

                {form.map_order.length > 0 && (
                  <p className="bf-studio-hint">
                    Serie: <strong>{form.format}</strong> · {form.map_order.length} mapas en orden (
                    {form.map_order.slice(0, 4).join(" → ")}
                    {form.map_order.length > 4 ? "…" : ""})
                  </p>
                )}

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
                    <p className="bf-studio-hint">
                      Por defecto <strong>todas</strong> las categorías están activas en la web (ganador,
                      marcador, mapas, brawlers). Los puntos globales son por dificultad: serie &gt; mapas &gt;
                      meta brawlers. Deja 0 en un campo para usar el valor global.
                    </p>
                    <button
                      type="button"
                      className="bp-btn bp-btn-ghost"
                      disabled={syncing}
                      onClick={() => void applyPredictionDefaultsToAll(reload)}
                    >
                      Activar predicciones completas en todos los partidos
                    </button>
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
                      Brawler más usado (repetido)
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_brawler_mvp}
                        onChange={(e) => setForm({ ...form, pred_brawler_mvp: e.target.checked })}
                      />
                      Brawler mayor WR
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_brawler_most_banned}
                        onChange={(e) =>
                          setForm({ ...form, pred_brawler_most_banned: e.target.checked })
                        }
                      />
                      Brawler más bloqueado
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_brawler_lowest_wr}
                        onChange={(e) =>
                          setForm({ ...form, pred_brawler_lowest_wr: e.target.checked })
                        }
                      />
                      Brawler menor WR
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_map_winners}
                        onChange={(e) => setForm({ ...form, pred_map_winners: e.target.checked })}
                      />
                      Ganador por mapa (serie)
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_map_picks}
                        onChange={(e) => setForm({ ...form, pred_map_picks: e.target.checked })}
                      />
                      Picks y bans de brawlers por mapa
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_advanced}
                        onChange={(e) => setForm({ ...form, pred_advanced: e.target.checked })}
                      />
                      Activar todas las avanzadas
                    </label>
                    <div className="bf-studio-points-grid">
                      <p className="bf-studio-hint">Puntos por acierto en este partido (0 = usar global)</p>
                      {(
                        [
                          ["points_winner", "Ganador"],
                          ["points_exact", "Resultado exacto"],
                          ["points_mvp", "MVP jugador"],
                          ["points_map_winner", "Ganador mapa"],
                          ["points_map_pick", "Pick brawler"],
                          ["points_brawler_ban", "Ban brawler"],
                          ["points_brawler_mvp", "Brawler MVP"],
                          ["points_brawler_used", "Más usado (repetido)"],
                          ["points_brawler_most_banned", "Más bloqueado"],
                          ["points_brawler_lowest_wr", "Menor WR"],
                          ["points_participation", "Participar"],
                          ["points_perfect_bonus", "Bonus perfecto"],
                        ] as const
                      ).map(([key, label]) => (
                        <StudioField key={key} label={label}>
                          <StudioInput
                            type="number"
                            min={0}
                            value={form[key]}
                            onChange={(e) =>
                              setForm({ ...form, [key]: Number(e.target.value) || 0 })
                            }
                          />
                        </StudioField>
                      ))}
                    </div>
                    <div className="bf-studio-results-block">
                      <p className="bf-studio-hint">
                        Resultados reales (al cerrar el partido). Con esto se recalculan los puntos
                        de todos los predictores.
                      </p>
                      {(
                        [
                          ["result_mvp_player", "MVP jugador (slug)"],
                          ["result_brawler_wr", "Brawler mayor WR"],
                          ["result_brawler_used", "Brawler más usado (repetido)"],
                          ["result_brawler_banned", "Brawler más bloqueado"],
                          ["result_brawler_low_wr", "Brawler menor WR"],
                        ] as const
                      ).map(([key, label]) => (
                        <StudioField key={key} label={label}>
                          <StudioInput
                            value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            placeholder="Nombre del brawler o slug jugador"
                          />
                        </StudioField>
                      ))}
                    </div>
                  </div>
                )}

                {formTab === "maps" && (
                  <div className="bf-studio-map-catalog-panel">
                    <MapOrderFromLibrary
                      mapOrder={form.map_order}
                      mapPool={form.map_pool}
                      onChangeOrder={(map_order) => setForm({ ...form, map_order })}
                      onChangePool={(map_pool) => setForm({ ...form, map_pool })}
                    />
                  </div>
                )}

                {formTab === "brawlers" && (
                  <div className="bf-studio-brawler-catalog-panel">
                    <p className="bf-studio-hint">
                      Los datos de brawlers (imagen, rareza, clase, descripción) se cargan automáticamente desde
                      la biblioteca al mostrar el partido. Aquí solo configuras predicciones y draft por mapa en
                      la pestaña <strong>Predicciones</strong>.
                    </p>
                    <Link href="/admin?module=biblioteca" className="bp-btn bp-btn-ghost">
                      Abrir Biblioteca global → Brawlers
                    </Link>
                  </div>
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
              <button
                type="button"
                className="bp-btn bp-btn-ghost"
                style={{ marginTop: 12 }}
                onClick={() => setPanelView("list")}
              >
                ← Volver a la lista
              </button>
            </StudioCard>
            )}
          </>
        );
      }}
    </StudioModulePanel>
  );
}
