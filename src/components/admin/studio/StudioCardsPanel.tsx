"use client";

import { StudioCard, StudioEmpty } from "./studio-ui";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioCardsPanel() {
  return (
    <StudioModulePanel
      title="Tarjetas de equipos y jugadores"
      lead="Plantillas visuales para las fichas que ven los usuarios."
      apiPath="/api/cms/admin/cards"
    >
      {(data) => {
        const templates = (data.templates ?? []) as { id: string; name: string; entity_type: string; is_default: boolean }[];
        return templates.length === 0 ? (
          <StudioEmpty title="Usando diseño estándar de la web">
            <p className="bf-studio-muted">Las tarjetas actuales siguen igual. Próximamente podrás elegir plantillas aquí.</p>
          </StudioEmpty>
        ) : (
          <ul className="bf-studio-template-grid">
            {templates.map((t) => (
              <li key={t.id} className="bf-studio-template-card">
                <span className="bf-studio-template-type">{t.entity_type === "team" ? "Equipo" : "Jugador"}</span>
                <strong>{t.name}</strong>
                {t.is_default && <span className="bf-studio-badge-default">Por defecto</span>}
              </li>
            ))}
          </ul>
        );
      }}
    </StudioModulePanel>
  );
}
