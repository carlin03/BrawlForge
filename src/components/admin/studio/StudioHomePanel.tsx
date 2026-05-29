"use client";

import { StudioModulePanel } from "./StudioModulePanel";

export function StudioHomePanel() {
  return (
    <StudioModulePanel
      title="Home Builder (Fase 4)"
      description="Bloques, club marquee y límites de partidos. Activa cms.home_builder.enabled para composición CMS."
      apiPath="/api/cms/admin/home"
    >
      {(data) => (
        <>
          <p className="bf-studio-muted">
            Bloques registrados: {(data.registry as unknown[])?.length ?? 0} · Bloques en página:{" "}
            {(data.blocks as unknown[])?.length ?? 0}
          </p>
          <pre className="bf-studio-json" style={{ maxHeight: 240 }}>
            {JSON.stringify(data.curated, null, 2)}
          </pre>
        </>
      )}
    </StudioModulePanel>
  );
}
