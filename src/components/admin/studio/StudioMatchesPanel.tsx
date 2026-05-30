"use client";

import { useEffect, useMemo, useState } from "react";
import { getBscCircuitTournaments } from "@/lib/data/matches";
import { teamName } from "@/lib/data";
import { MATCH_ROUND_OPTIONS } from "@/lib/data/match-round-types";
import {
  MATCH_IMPORTANCE_OPTIONS,
  MATCH_DISPLAY_STATUS_OPTIONS,
  DEFAULT_MAP_POOL,
  DEFAULT_BRAWLER_POOL,
  type MatchImportance,
  type MatchDisplayStatus,
  type MatchPredictionsConfig,
} from "@/lib/data/match-meta";
import { StudioChipPicker } from "@/components/admin/studio/StudioChipPicker";
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

export function StudioMatchesPanel() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
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
    const id = suggestId();
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
            <StudioCard title="Nuevo partido">
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

                <StudioField label="Tipo de ronda" hint="Define filtros y sección en /predictions">
                  <StudioSelect
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  >
                    {MATCH_ROUND_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </StudioSelect>
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
                      MVP prediction (futuro)
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_first_map}
                        onChange={(e) => setForm({ ...form, pred_first_map: e.target.checked })}
                      />
                      Primer mapa (futuro)
                    </label>
                    <label className="bf-studio-check">
                      <input
                        type="checkbox"
                        checked={form.pred_advanced}
                        onChange={(e) => setForm({ ...form, pred_advanced: e.target.checked })}
                      />
                      Predicción avanzada (futuro)
                    </label>
                  </div>
                )}

                {formTab === "maps" && (
                  <>
                    <StudioChipPicker
                      label="Map pool"
                      pool={DEFAULT_MAP_POOL}
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
                      hint="Clic para añadir al pool"
                    />
                    <StudioChipPicker
                      label="Orden de mapas"
                      pool={form.map_pool.length ? form.map_pool : DEFAULT_MAP_POOL}
                      selected={form.map_order}
                      onChange={(map_order) => setForm({ ...form, map_order })}
                      hint="Orden de juego en el partido"
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
                    <StudioChipPicker
                      label={`Bans mapas · ${form.team_a_slug ? teamName(form.team_a_slug) : "Team A"}`}
                      pool={form.map_pool.length ? form.map_pool : DEFAULT_MAP_POOL}
                      selected={form.bans_maps_a}
                      onChange={(bans_maps_a) => setForm({ ...form, bans_maps_a })}
                      variant="ban"
                    />
                    <StudioChipPicker
                      label={`Bans mapas · ${form.team_b_slug ? teamName(form.team_b_slug) : "Team B"}`}
                      pool={form.map_pool.length ? form.map_pool : DEFAULT_MAP_POOL}
                      selected={form.bans_maps_b}
                      onChange={(bans_maps_b) => setForm({ ...form, bans_maps_b })}
                      variant="ban"
                    />
                  </>
                )}

                {formTab === "brawlers" && (
                  <>
                    <StudioChipPicker
                      label="Meta"
                      pool={DEFAULT_BRAWLER_POOL}
                      selected={form.brawlers_meta}
                      onChange={(brawlers_meta) => setForm({ ...form, brawlers_meta })}
                    />
                    <StudioChipPicker
                      label="Recomendados"
                      pool={DEFAULT_BRAWLER_POOL}
                      selected={form.brawlers_recommended}
                      onChange={(brawlers_recommended) => setForm({ ...form, brawlers_recommended })}
                    />
                    <StudioChipPicker
                      label="Baneados Team A"
                      pool={DEFAULT_BRAWLER_POOL}
                      selected={form.brawlers_banned_a}
                      onChange={(brawlers_banned_a) => setForm({ ...form, brawlers_banned_a })}
                      variant="ban"
                    />
                    <StudioChipPicker
                      label="Baneados Team B"
                      pool={DEFAULT_BRAWLER_POOL}
                      selected={form.brawlers_banned_b}
                      onChange={(brawlers_banned_b) => setForm({ ...form, brawlers_banned_b })}
                      variant="ban"
                    />
                  </>
                )}
              </div>

              <button type="button" className="bp-btn bp-btn-gold" onClick={() => saveMatch(reload)}>
                Guardar partido
              </button>
              <StudioToast message={msg} error={error} />
            </StudioCard>

            <h3 className="bf-studio-list-title">Partidos en el panel ({matches.length})</h3>
            {matches.length === 0 ? (
              <p className="bf-studio-muted">Crea el primero con el formulario de arriba.</p>
            ) : (
              <ul className="bf-studio-match-list">
                {matches.slice(0, 30).map((m) => (
                  <li key={m.id} className="bf-studio-match-item">
                    <div className="bf-studio-match-item-main">
                      <strong>
                        {teamName(m.team_a_slug)} vs {teamName(m.team_b_slug)}
                      </strong>
                      <span className="bf-studio-match-meta">
                        {m.format ?? "Bo3"} · {new Date(m.scheduled_at).toLocaleString("es-ES")} ·{" "}
                        {MATCH_STATUS_OPTIONS.find((s) => s.id === m.status)?.label ?? m.status}
                        {(m.status === "live" || m.status === "finished") &&
                          ` · ${m.score_a}-${m.score_b}`}
                      </span>
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
