import type { ReactNode } from "react";

interface StatItem {
  value: string | number;
  label: string;
  tone?: "gold" | "blue" | "red";
}

interface PageHeadProps {
  title: string;
  subtitle?: string;
  stats?: StatItem[];
  actions?: ReactNode;
}

export function PageHead({ title, subtitle, stats, actions }: PageHeadProps) {
  return (
    <header className="es-page-head">
      <div>
        <h1 className="es-page-title">{title}</h1>
        {subtitle && <p className="es-page-sub">{subtitle}</p>}
      </div>
      {(stats || actions) && (
        <div className="flex flex-wrap items-center gap-3">
          {stats && (
            <div className="es-page-stats">
              {stats.map((s) => (
                <div key={s.label} className={`es-stat es-stat-${s.tone ?? "blue"}`}>
                  <div className="es-stat-val">{s.value}</div>
                  <div className="es-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}
