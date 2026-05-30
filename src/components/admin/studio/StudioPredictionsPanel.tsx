"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Target, Trophy } from "lucide-react";
import {
  DEFAULT_PICKEM_STAGE_POINTS,
  type PickemStagePointsConfig,
  PICKEM_STAGE_OPTIONS,
} from "@/lib/data/pickem-reward-points";
import { StudioCard, StudioField, StudioInput, StudioToast } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

type MatchRow = {
  id: string;
  status: string;
  team_a_slug: string;
  team_b_slug: string;
  tournament_slug: string;
  stage?: string | null;
};

type ScoringRow = {
  base_points: number;
  rules?: Record<string, unknown>;
};

export function StudioPredictionsPanel() {
  const [basePoints, setBasePoints] = useState(10);
  const [stagePoints, setStagePoints] = useState<PickemStagePointsConfig>({
    ...DEFAULT_PICKEM_STAGE_POINTS,
  });
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
      lead="En /predictions: jornada/grupos (grid normal), cuartos (grid normal), semis (partidos clave) y gran final (1 card grande). Puntos por fase abajo."
      apiPath="/api/cms/admin/predictions"
    >
      {(data) => {
        const scoring = (data.scoring ?? []) as ScoringRow[];
        return (
          <>
            <StudioCard title="Calendario y partidos">
              <p className="bf-studio-hint" style={{ marginTop: 0 }}>
                En cada partido elige la <strong>fase</strong>: jornada/grupos → sección normal; cuartos → fila
                de cuartos; semifinal → partidos clave; gran final → 1 duelo grande abajo.
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
                <Link href="/admin?module=competicion&tab=matches" className="bp-btn bp-btn-gold">
                  <Calendar size={16} /> Lista de partidos (en vivo)
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
              stagePoints={stagePoints}
              setStagePoints={setStagePoints}
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
  stagePoints,
  setStagePoints,
  msg,
  error,
  setMsg,
  setError,
}: {
  scoring?: ScoringRow;
  basePoints: number;
  setBasePoints: (n: number) => void;
  stagePoints: PickemStagePointsConfig;
  setStagePoints: (p: PickemStagePointsConfig) => void;
  msg: string;
  error: boolean;
  setMsg: (s: string) => void;
  setError: (b: boolean) => void;
}) {
  useEffect(() => {
    if (!scoring) return;
    setBasePoints(scoring.base_points);
    const rules = scoring.rules ?? {};
    setStagePoints({
      group:
        typeof rules.points_group === "number"
          ? rules.points_group
          : DEFAULT_PICKEM_STAGE_POINTS.group,
      quarter:
        typeof rules.points_quarter === "number"
          ? rules.points_quarter
          : DEFAULT_PICKEM_STAGE_POINTS.quarter,
      semi:
        typeof rules.points_semi === "number" ? rules.points_semi : DEFAULT_PICKEM_STAGE_POINTS.semi,
      final:
        typeof rules.points_final === "number"
          ? rules.points_final
          : DEFAULT_PICKEM_STAGE_POINTS.final,
    });
  }, [scoring, setBasePoints, setStagePoints]);

  async function save() {
    const res = await fetch("/api/cms/admin/predictions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scoring: {
          base_points: basePoints,
          rules: {
            points_group: stagePoints.group,
            points_quarter: stagePoints.quarter,
            points_semi: stagePoints.semi,
            points_final: stagePoints.final,
          },
        },
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Puntuación y fases guardadas." : data.error);
    setError(!res.ok);
  }

  return (
    <StudioCard title="Puntos por fase (Pick'em)">
      <p className="bf-studio-hint" style={{ marginTop: 0 }}>
        La web usa estos valores al acertar ganador. Coinciden con las etiquetas de fase en Partidos.
      </p>
      <StudioField label="Puntos base (referencia CMS)" hint="Mercados legacy">
        <StudioInput
          type="number"
          min={1}
          max={100}
          value={basePoints}
          onChange={(e) => setBasePoints(Number(e.target.value))}
        />
      </StudioField>
      <div className="bf-studio-stage-points-grid">
        {PICKEM_STAGE_OPTIONS.map((opt) => (
          <StudioField key={opt.id} label={`${opt.label} (+pts)`}>
            <StudioInput
              type="number"
              min={5}
              max={150}
              value={stagePoints[opt.pointsKey]}
              onChange={(e) =>
                setStagePoints({
                  ...stagePoints,
                  [opt.pointsKey]: Number(e.target.value),
                })
              }
            />
          </StudioField>
        ))}
      </div>
      <p className="bf-studio-hint">
        <Trophy size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Por defecto en código: grupos{" "}
        {DEFAULT_PICKEM_STAGE_POINTS.group}, cuartos {DEFAULT_PICKEM_STAGE_POINTS.quarter}, semis{" "}
        {DEFAULT_PICKEM_STAGE_POINTS.semi}, final {DEFAULT_PICKEM_STAGE_POINTS.final}. Tras guardar aquí, alinea
        partidos en admin con la misma fase.
      </p>
      <button type="button" className="bp-btn bp-btn-gold" onClick={save}>
        Guardar puntos por fase
      </button>
      <StudioToast message={msg} error={error} />
    </StudioCard>
  );
}
