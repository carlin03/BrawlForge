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
  allow_exact_score: boolean;
  featured_label: string;
  maps_possible: string;
  bans_maps_a: string;
  bans_maps_b: string;
}) {
  const maps = form.maps_possible
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    importance: form.importance,
    display_status: form.display_status,
    allow_exact_score: form.allow_exact_score,
    featured_label: form.featured_label.trim() || undefined,
    maps: maps.length ? { possible: maps } : undefined,
    bans: {
      maps_a: form.bans_maps_a.split(",").map((s) => s.trim()).filter(Boolean),
      maps_b: form.bans_maps_b.split(",").map((s) => s.trim()).filter(Boolean),
    },
  };
}

export function StudioMatchesPanel() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
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
    allow_exact_score: false,
    featured_label: "",
    maps_possible: "",
    bans_maps_a: "",
    bans_maps_b: "",
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

              <div className="bf-studio-form-visual">

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

                <StudioField label="Predicción avanzada">
                  <label className="bf-studio-check">
                    <input
                      type="checkbox"
                      checked={form.allow_exact_score}
                      onChange={(e) => setForm({ ...form, allow_exact_score: e.target.checked })}
                    />
                    Permitir resultado exacto (BO3/BO5)
                  </label>
                </StudioField>

                <StudioField label="Mapas posibles" hint="Separados por coma">
                  <StudioInput
                    value={form.maps_possible}
                    onChange={(e) => setForm({ ...form, maps_possible: e.target.value })}
                    placeholder="Belle's Rock, Bridge Too Far, …"
                  />
                </StudioField>

                <StudioField label="Bans de mapas (A / B)" hint="Slugs o nombres, separados por coma">
                  <div className="bf-studio-score-row">
                    <StudioInput
                      value={form.bans_maps_a}
                      onChange={(e) => setForm({ ...form, bans_maps_a: e.target.value })}
                      placeholder="Team A bans"
                    />
                    <StudioInput
                      value={form.bans_maps_b}
                      onChange={(e) => setForm({ ...form, bans_maps_b: e.target.value })}
                      placeholder="Team B bans"
                    />
                  </div>
                </StudioField>

                <StudioField label="Formato">
                  <StudioSelect
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                  >
                    <option value="Bo3">Bo3</option>
                    <option value="Bo5">Bo5</option>
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
