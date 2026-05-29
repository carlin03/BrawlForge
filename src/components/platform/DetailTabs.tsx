"use client";

import type { ReactNode } from "react";

export type DetailTab = { id: string; label: string; count?: number };

export function DetailTabs({
  tabs,
  active,
  onChange,
  logo,
}: {
  tabs: DetailTab[];
  active: string;
  onChange: (id: string) => void;
  /** Logo del club/jugador/torneo encima de las pestañas */
  logo?: ReactNode;
}) {
  return (
    <div className="bf-detail-tabs-wrap">
      {logo ? <div className="bf-detail-tabs-logo">{logo}</div> : null}
      <nav className="bf-detail-tabs" aria-label="Secciones">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`bf-detail-tab ${active === t.id ? "is-on" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null && t.count > 0 && <span className="bf-detail-tab-count">{t.count}</span>}
        </button>
      ))}
      </nav>
    </div>
  );
}
