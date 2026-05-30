"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBscCircuitTournaments } from "@/lib/data/matches";
import { teamName } from "@/lib/data";
import {
  emptyBracketConfig,
  type BracketLayoutMode,
  type BracketSlot,
  type PlayoffBracketConfig,
} from "@/lib/data/bracket-config";
import {
  StudioCard,
  StudioField,
  StudioSelect,
  StudioPills,
  StudioToast,
  StudioInput,
  StudioPanel,
} from "./studio-ui";
import { AdminTeamLogoPicker } from "@/components/admin/AdminTeamLogoPicker";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { BracketLivePreview } from "@/components/admin/studio/BracketLivePreview";

type TeamOption = { slug: string; name: string; tag: string; region?: string };

function SlotEditor({
  slot,
  onChange,
  teams,
  label,
}: {
  slot: BracketSlot;
  onChange: (s: BracketSlot) => void;
  teams: TeamOption[];
  label: string;
}) {
  return (
    <div className="bf-bracket-builder-slot-editor">
      <strong>{label}</strong>
      <div className="bf-bracket-builder-slot-pickers">
        <StudioField label="Equipo A">
          <AdminTeamLogoPicker
            teams={teams}
            selected={slot.team_a_slug}
            onChange={(slug) => onChange({ ...slot, team_a_slug: slug })}
            disabledSlugs={slot.team_b_slug ? [slot.team_b_slug] : []}
            compact
            maxHeight="160px"
            showRegionFilter={false}
          />
        </StudioField>
        <StudioField label="Equipo B">
          <AdminTeamLogoPicker
            teams={teams}
            selected={slot.team_b_slug}
            onChange={(slug) => onChange({ ...slot, team_b_slug: slug })}
            disabledSlugs={slot.team_a_slug ? [slot.team_a_slug] : []}
            compact
            maxHeight="160px"
            showRegionFilter={false}
          />
        </StudioField>
      </div>
    </div>
  );
}

export function StudioBracketBuilderPanel() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [store, setStore] = useState<Record<string, PlayoffBracketConfig>>({});
  const [tournamentSlug, setTournamentSlug] = useState("bsc-2026-s3-emea-mf");
  const [config, setConfig] = useState<PlayoffBracketConfig>(() => emptyBracketConfig("bsc-2026-s3-emea-mf"));
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16));

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

  const loadBrackets = useCallback(() => {
    fetch("/api/cms/admin/bracket")
      .then((r) => r.json())
      .then((data) => {
        if (data.brackets) setStore(data.brackets);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBrackets();
  }, [loadBrackets]);

  useEffect(() => {
    const saved = store[tournamentSlug];
    setConfig(saved ? { ...saved } : emptyBracketConfig(tournamentSlug));
  }, [tournamentSlug, store]);

  async function saveConfig() {
    setMsg("");
    setError(false);
    const res = await fetch("/api/cms/admin/bracket", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: { ...config, tournament_slug: tournamentSlug } }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Error al guardar");
      setError(true);
      return;
    }
    setStore((s) => ({ ...s, [tournamentSlug]: data.config }));
    setMsg("Bracket guardado.");
  }

  async function publishMatches() {
    setMsg("");
    setError(false);
    const res = await fetch("/api/cms/admin/bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournament_slug: tournamentSlug, scheduled_at: new Date(scheduledAt).toISOString() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Error al publicar");
      setError(true);
      return;
    }
    setMsg(`Publicados ${data.count ?? 0} partidos en el catálogo.`);
  }

  return (
    <StudioPanel
      title="Bracket builder"
      lead="Constructor visual de playoffs: equipos con logos, vista previa en tiempo real y publicación a partidos."
    >
      <StudioCard title="Torneo y layout">
        <div className="bf-studio-form-visual">
          <StudioField label="Torneo">
            <StudioSelect value={tournamentSlug} onChange={(e) => setTournamentSlug(e.target.value)}>
              {tournaments.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </StudioSelect>
          </StudioField>
          <StudioField label="Layout en /predictions">
            <StudioPills
              options={[
                { id: "auto", label: "Auto" },
                { id: "1", label: "1 por fila" },
                { id: "2", label: "2 por fila" },
              ]}
              value={config.layout}
              onChange={(v) => setConfig({ ...config, layout: v as BracketLayoutMode })}
            />
          </StudioField>
          <StudioField label="Rondas activas">
            <div className="bf-studio-check-row">
              {(
                [
                  ["quarters", "Cuartos"],
                  ["semis", "Semis"],
                  ["final", "Final"],
                  ["third_place", "3er puesto"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="bf-studio-check">
                  <input
                    type="checkbox"
                    checked={config.rounds[key]}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rounds: { ...config.rounds, [key]: e.target.checked },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </StudioField>
          <StudioField label="Formato">
            <StudioSelect
              value={config.format ?? "Bo5"}
              onChange={(e) => setConfig({ ...config, format: e.target.value })}
            >
              <option value="Bo3">Bo3</option>
              <option value="Bo5">Bo5</option>
            </StudioSelect>
          </StudioField>
        </div>
      </StudioCard>

      <div className="bf-bracket-builder-split">
        <StudioCard title="Equipos por enfrentamiento">
          {config.rounds.quarters &&
            config.slots.quarters.map((slot, i) => (
              <SlotEditor
                key={`qf-${i}`}
                label={`Cuartos ${i + 1}`}
                slot={slot}
                teams={teams}
                onChange={(s) => {
                  const q = [...config.slots.quarters];
                  q[i] = s;
                  setConfig({ ...config, slots: { ...config.slots, quarters: q } });
                }}
              />
            ))}
          {config.rounds.semis &&
            config.slots.semis.map((slot, i) => (
              <SlotEditor
                key={`sf-${i}`}
                label={`Semifinal ${i + 1}`}
                slot={slot}
                teams={teams}
                onChange={(s) => {
                  const arr = [...config.slots.semis];
                  arr[i] = s;
                  setConfig({ ...config, slots: { ...config.slots, semis: arr } });
                }}
              />
            ))}
          {config.rounds.final && config.slots.final && (
            <SlotEditor
              label="Gran final"
              slot={config.slots.final}
              teams={teams}
              onChange={(s) => setConfig({ ...config, slots: { ...config.slots, final: s } })}
            />
          )}
          {config.rounds.third_place && (
            <SlotEditor
              label="3er puesto"
              slot={config.slots.third_place ?? { team_a_slug: "", team_b_slug: "" }}
              teams={teams}
              onChange={(s) => setConfig({ ...config, slots: { ...config.slots, third_place: s } })}
            />
          )}
        </StudioCard>

        <StudioCard title="Vista previa — igual que /predictions">
          <BracketLivePreview config={config} />
        </StudioCard>
      </div>

      <StudioField label="Fecha base para publicar partidos">
        <StudioInput
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </StudioField>

      <div className="bf-studio-actions-row">
        <button type="button" className="bp-btn bp-btn-gold" onClick={() => void saveConfig()}>
          Guardar bracket
        </button>
        <button type="button" className="bp-btn bp-btn-ghost" onClick={() => void publishMatches()}>
          Publicar partidos al catálogo
        </button>
      </div>
      <StudioToast message={msg} error={error} />
    </StudioPanel>
  );
}
