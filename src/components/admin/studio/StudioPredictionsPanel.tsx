"use client";

import { useEffect, useState } from "react";
import { StudioCard, StudioField, StudioInput, StudioToast } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioPredictionsPanel() {
  const [basePoints, setBasePoints] = useState(10);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  return (
    <StudioModulePanel
      title="Predicciones"
      lead="Puntos que ganan los usuarios al acertar el ganador de un partido."
      apiPath="/api/cms/admin/predictions"
    >
      {(data) => {
        const scoring = (data.scoring ?? []) as { base_points: number }[];
        return (
          <PredictionsForm
            scoring={scoring[0]}
            basePoints={basePoints}
            setBasePoints={setBasePoints}
            msg={msg}
            error={error}
            setMsg={setMsg}
            setError={setError}
          />
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
      <StudioField label="Puntos por acertar ganador" hint="Por cada voto correcto en un partido">
        <StudioInput type="number" min={1} max={50} value={basePoints} onChange={(e) => setBasePoints(Number(e.target.value))} />
      </StudioField>
      <button type="button" className="bp-btn bp-btn-gold" onClick={save}>
        Guardar puntos
      </button>
      <StudioToast message={msg} error={error} />
    </StudioCard>
  );
}
