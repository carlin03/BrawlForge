"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Target, Trophy } from "lucide-react";
import { StudioCard, StudioField, StudioInput, StudioToast } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

type MatchRow = {
  id: string;
  status: string;
  team_a_slug: string;
  team_b_slug: string;
  tournament_slug: string;
};

export function StudioPredictionsPanel() {
  const [basePoints, setBasePoints] = useState(10);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [matchStats, setMatchStats] = useState({ upcoming: 0, live: 0, finished: 0 });

  const loadMatchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/catalog?type=matches");
      const data = await res.json();
      const rows = (data.matches ?? []) as MatchRow[];
      setMatchStats({
        upcoming: rows.filter((m) => m.status === "upcoming").length,
        live: rows.filter((m) => m.status === "live").length,
        finished: rows.filter((m) => m.status === "finished").length,
      });
    } catch {
      setMatchStats({ upcoming: 0, live: 0, finished: 0 });
    }
  }, []);

  useEffect(() => {
    void loadMatchStats();
  }, [loadMatchStats]);

  return (
    <StudioModulePanel
      title="Predicciones"
      lead="Los partidos del calendario alimentan las predicciones abiertas en la web. Configura puntos y gestiona el calendario."
      apiPath="/api/cms/admin/predictions"
    >
      {(data) => {
        const scoring = (data.scoring ?? []) as { base_points: number }[];
        return (
          <>
            <StudioCard title="Calendario y partidos">
              <p className="bf-studio-hint" style={{ marginTop: 0 }}>
                Cada partido <strong>próximo</strong> o <strong>en directo</strong> aparece automáticamente en{" "}
                <Link href="/predictions" target="_blank">
                  /predictions
                </Link>{" "}
                para que los usuarios voten el ganador. Los finalizados pasan al historial y suman puntos si acertaron.
              </p>
              <div className="bf-studio-predict-stats">
                <span>
                  <Calendar size={14} /> {matchStats.upcoming} próximos
                </span>
                <span className="is-live">
                  <Target size={14} /> {matchStats.live} en directo
                </span>
                <span>{matchStats.finished} finalizados</span>
              </div>
              <div className="bf-studio-predict-actions">
                <Link href="/admin?module=matches" className="bp-btn bp-btn-gold">
                  <Calendar size={16} /> Gestionar partidos
                </Link>
                <Link href="/predictions" className="bp-btn bp-btn-ghost" target="_blank">
                  Ver predicciones en la web
                </Link>
                <button type="button" className="bp-btn bp-btn-ghost" onClick={() => void loadMatchStats()}>
                  Actualizar contadores
                </button>
              </div>
            </StudioCard>

            <PredictionsForm
              scoring={scoring[0]}
              basePoints={basePoints}
              setBasePoints={setBasePoints}
              msg={msg}
              error={error}
              setMsg={setMsg}
              setError={setError}
            />
          </>
        );
      }}
    </StudioModulePanel>
  );
}

function PredictionsForm({
  scoring,
  basePoints,
  setBasePoints,
  msg,
  error,
  setMsg,
  setError,
}: {
  scoring?: { base_points: number };
  basePoints: number;
  setBasePoints: (n: number) => void;
  msg: string;
  error: boolean;
  setMsg: (s: string) => void;
  setError: (b: boolean) => void;
}) {
  useEffect(() => {
    if (scoring) setBasePoints(scoring.base_points);
  }, [scoring, setBasePoints]);

  async function save() {
    const res = await fetch("/api/cms/admin/predictions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoring: { base_points: basePoints } }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Puntos de predicciones guardados." : data.error);
    setError(!res.ok);
  }

  return (
    <StudioCard title="Puntuación">
      <p className="bf-studio-hint" style={{ marginTop: 0 }}>
        En la web, Bo5/finales suelen dar +75, Bo3 +50 y grupos +35 (definido por formato del partido). Este valor es la
        base por defecto del CMS.
      </p>
      <StudioField label="Puntos base por acertar ganador" hint="Referencia para nuevos mercados">
        <StudioInput
          type="number"
          min={1}
          max={100}
          value={basePoints}
          onChange={(e) => setBasePoints(Number(e.target.value))}
        />
      </StudioField>
      <p className="bf-studio-hint">
        <Trophy size={12} style={{ display: "inline", verticalAlign: "middle" }} /> El ranking y las rachas se
        calculan al cerrar partidos según los votos en Supabase.
      </p>
      <button type="button" className="bp-btn bp-btn-gold" onClick={save}>
        Guardar puntos
      </button>
      <StudioToast message={msg} error={error} />
    </StudioCard>
  );
}
