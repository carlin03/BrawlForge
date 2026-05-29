"use client";

import { useEffect, useState } from "react";
import { Layers, GripVertical } from "lucide-react";
import { StudioCard, StudioField, StudioInput, StudioToast, BLOCK_LABELS } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

type BlockRow = {
  id: string;
  block_type: string;
  enabled: boolean;
};

export function StudioHomePanel() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [limits, setLimits] = useState({ live: 8, upcoming: 8, results: 8 });

  async function saveLimits() {
    setMsg("");
    const res = await fetch("/api/cms/admin/home", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curated: { match_limits: limits } }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Preferencias de la home guardadas." : data.error);
    setError(!res.ok);
  }

  return (
    <StudioModulePanel
      title="Página de inicio"
      lead="Ordena las secciones que ven los usuarios al entrar."
      apiPath="/api/cms/admin/home"
    >
      {(data) => <HomePanelBody data={data} limits={limits} setLimits={setLimits} saveLimits={saveLimits} msg={msg} error={error} />}
    </StudioModulePanel>
  );
}

function HomePanelBody({
  data,
  limits,
  setLimits,
  saveLimits,
  msg,
  error,
}: {
  data: Record<string, unknown>;
  limits: { live: number; upcoming: number; results: number };
  setLimits: (l: typeof limits) => void;
  saveLimits: () => void;
  msg: string;
  error: boolean;
}) {
  const blocks = (data.blocks ?? []) as BlockRow[];
  const registry = (data.registry ?? []) as { block_type: string }[];

  useEffect(() => {
    const c = data.curated as { match_limits?: { live?: number; upcoming?: number; results?: number } } | undefined;
    if (c?.match_limits) {
      setLimits({
        live: c.match_limits.live ?? 8,
        upcoming: c.match_limits.upcoming ?? 8,
        results: c.match_limits.results ?? 8,
      });
    }
  }, [data.curated, setLimits]);

  const displayBlocks =
    blocks.length > 0
      ? blocks
      : registry.map((r) => ({
          id: r.block_type,
          block_type: r.block_type,
          enabled: true,
        }));

  return (
    <>
      <StudioCard title="Secciones de la home">
        <ul className="bf-studio-block-list">
          {displayBlocks.map((b) => (
            <li key={b.id} className={`bf-studio-block-item ${b.enabled !== false ? "" : "is-off"}`}>
              <GripVertical size={16} className="bf-studio-block-grip" aria-hidden />
              <Layers size={18} />
              <div>
                <strong>{BLOCK_LABELS[b.block_type] ?? b.block_type}</strong>
                <span>{b.enabled !== false ? "Visible en la web" : "Oculto"}</span>
              </div>
            </li>
          ))}
        </ul>
      </StudioCard>

      <StudioCard title="Cuántos partidos mostrar en la portada">
        <div className="bf-studio-form-visual">
          <StudioField label="Partidos en vivo">
            <StudioInput type="number" min={1} max={20} value={limits.live} onChange={(e) => setLimits({ ...limits, live: Number(e.target.value) })} />
          </StudioField>
          <StudioField label="Próximos partidos">
            <StudioInput type="number" min={1} max={20} value={limits.upcoming} onChange={(e) => setLimits({ ...limits, upcoming: Number(e.target.value) })} />
          </StudioField>
          <StudioField label="Resultados recientes">
            <StudioInput type="number" min={1} max={20} value={limits.results} onChange={(e) => setLimits({ ...limits, results: Number(e.target.value) })} />
          </StudioField>
        </div>
        <button type="button" className="bp-btn bp-btn-gold" onClick={saveLimits}>
          Guardar preferencias
        </button>
        <StudioToast message={msg} error={error} />
      </StudioCard>
    </>
  );
}
