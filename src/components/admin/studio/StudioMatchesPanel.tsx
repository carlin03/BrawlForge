"use client";

import { useEffect, useMemo, useState } from "react";
import { getBscCircuitTournaments } from "@/lib/data/matches";
import { teamName } from "@/lib/data";
import { DEFAULT_PICKEM_STAGE_POINTS, PICKEM_STAGE_OPTIONS } from "@/lib/data/pickem-reward-points";
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
};

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
    stage: "Quarterfinal",
    format: "Bo5",
    score_a: 0,
    score_b: 0,
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
          ...form,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
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

                <StudioField
                  label="Fase (bracket / puntos)"
                  hint="Cuartos → 4 duelos arriba · Semifinal → 2 · Gran final → 1 grande abajo"
                >
                  <StudioSelect
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  >
                    {PICKEM_STAGE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label} (+{DEFAULT_PICKEM_STAGE_POINTS[o.pointsKey]} pts)
                      </option>
                    ))}
                  </StudioSelect>
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
                    <div>
                      <strong>
                        {teamName(m.team_a_slug)} vs {teamName(m.team_b_slug)}
                      </strong>
                      <span className="bf-studio-match-meta">
                        {m.stage ? `${m.stage} · ` : ""}
                        {m.format ?? "Bo3"} · {new Date(m.scheduled_at).toLocaleString("es-ES")} ·{" "}
                        {MATCH_STATUS_OPTIONS.find((s) => s.id === m.status)?.label ?? m.status}
                        {(m.status === "live" || m.status === "finished") &&
                          ` · ${m.score_a}-${m.score_b}`}
                      </span>
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
