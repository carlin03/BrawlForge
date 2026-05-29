"use client";

import { useEffect, useState } from "react";
import { StudioCard, StudioField, StudioInput, StudioToast } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioFantasyPanel() {
  const [budget, setBudget] = useState(100);
  const [squadSize, setSquadSize] = useState(5);
  const [captainMult, setCaptainMult] = useState(2);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  return (
    <StudioModulePanel
      title="Fantasy"
      lead="Reglas de la temporada: presupuesto, tamaño de plantilla y capitán."
      apiPath="/api/cms/admin/fantasy"
    >
      {(data) => {
        const rules = (data.rules ?? []) as { budget: number; squad_size: number; captain_multiplier: number }[];
        const active = rules[0];
        return (
          <FantasyForm
            active={active}
            budget={budget}
            setBudget={setBudget}
            squadSize={squadSize}
            setSquadSize={setSquadSize}
            captainMult={captainMult}
            setCaptainMult={setCaptainMult}
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

function FantasyForm({
  active,
  budget,
  setBudget,
  squadSize,
  setSquadSize,
  captainMult,
  setCaptainMult,
  msg,
  error,
  setMsg,
  setError,
}: {
  active?: { budget: number; squad_size: number; captain_multiplier: number };
  budget: number;
  setBudget: (n: number) => void;
  squadSize: number;
  setSquadSize: (n: number) => void;
  captainMult: number;
  setCaptainMult: (n: number) => void;
  msg: string;
  error: boolean;
  setMsg: (s: string) => void;
  setError: (b: boolean) => void;
}) {
  useEffect(() => {
    if (active) {
      setBudget(active.budget);
      setSquadSize(active.squad_size);
      setCaptainMult(Number(active.captain_multiplier));
    }
  }, [active, setBudget, setSquadSize, setCaptainMult]);

  async function save() {
    const res = await fetch("/api/cms/admin/fantasy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleset: {
          id: "bsc-2026-default",
          budget,
          squad_size: squadSize,
          captain_multiplier: captainMult,
        },
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Reglas Fantasy guardadas." : data.error);
    setError(!res.ok);
  }

  return (
    <StudioCard title="Reglas de la temporada">
      <StudioField label="Presupuesto (millones)" hint="Ej: 100 = 100M para fichar">
        <StudioInput type="number" min={50} max={200} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
      </StudioField>
      <StudioField label="Jugadores en plantilla">
        <StudioInput type="number" min={3} max={8} value={squadSize} onChange={(e) => setSquadSize(Number(e.target.value))} />
      </StudioField>
      <StudioField label="Multiplicador del capitán">
        <StudioInput type="number" min={1} max={3} step={0.5} value={captainMult} onChange={(e) => setCaptainMult(Number(e.target.value))} />
      </StudioField>
      <button type="button" className="bp-btn bp-btn-gold" onClick={save}>
        Guardar reglas
      </button>
      <StudioToast message={msg} error={error} />
    </StudioCard>
  );
}
