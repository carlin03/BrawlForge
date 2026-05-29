"use client";

import { StudioCard, StudioEmpty } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioAutomationPanel() {
  return (
    <StudioModulePanel
      title="Automatizaciones"
      lead="Tareas que se ejecutan solas (por ejemplo, crear predicción al publicar un partido)."
      apiPath="/api/cms/admin/automation"
    >
      {(data) => {
        const rules = (data.rules ?? []) as { id: string; name: string; enabled: boolean }[];
        return (
          <>
            {rules.length === 0 ? (
              <StudioEmpty title="Sin automatizaciones activas">
                <p className="bf-studio-muted">Cuando haya reglas configuradas, aparecerán aquí con un interruptor on/off.</p>
              </StudioEmpty>
            ) : (
              <ul className="bf-studio-rule-list">
                {rules.map((r) => (
                  <li key={r.id} className="bf-studio-card">
                    <strong>{r.name}</strong>
                    <span className={r.enabled ? "bf-studio-pill-on" : "bf-studio-pill-off"}>
                      {r.enabled ? "Activa" : "Desactivada"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <StudioCard title="Próximamente">
              <p className="bf-studio-muted" style={{ margin: 0 }}>
                Podrás activar reglas con un clic, sin escribir configuraciones.
              </p>
            </StudioCard>
          </>
        );
      }}
    </StudioModulePanel>
  );
}
