import type { ReactNode } from "react";

export function NovaPageHero({
  kicker,
  live,
  title,
  accent,
  subtitle,
  actions,
  tone = "default",
}: {
  kicker?: string;
  live?: boolean;
  title: string;
  accent?: string;
  subtitle?: string;
  actions?: ReactNode;
  tone?: "default" | "yellow" | "blue" | "red";
}) {
  const toneClass = tone !== "default" ? `nv-premium-hero-${tone}` : "";

  return (
    <div className={`nv-premium-hero ${toneClass}`.trim()}>
      <div className="nv-premium-hero-bg" />
      <div className="nv-premium-hero-content">
        <div>
          {kicker && (
            <div className="nv-premium-kicker">
              {live && <span className="nv-live-dot" />}
              {kicker}
            </div>
          )}
          <h1 className="nv-premium-title">
            {title}
            {accent && <span>{accent}</span>}
          </h1>
          {subtitle && <p className="nv-premium-sub">{subtitle}</p>}
        </div>
        {actions && <div className="nv-premium-cta">{actions}</div>}
      </div>
      <div className="nv-premium-stripe" />
    </div>
  );
}
