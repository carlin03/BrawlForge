"use client";

export type DetailTab = { id: string; label: string; count?: number };

export function DetailTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: DetailTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
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
  );
}
