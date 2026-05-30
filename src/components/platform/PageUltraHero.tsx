import type { ReactNode } from "react";

type PageUltraHeroProps = {
  kicker?: ReactNode;
  title: ReactNode;
  lead: string;
  stats?: ReactNode;
  actions?: ReactNode;
  showcase?: ReactNode;
  className?: string;
};

export function PageUltraHero({
  kicker,
  title,
  lead,
  stats,
  actions,
  showcase,
  className = "",
}: PageUltraHeroProps) {
  return (
    <section className={`fu-hero fu-page-hero fu-hero-live ${className}`.trim()}>
      <div className="fu-hero-orbs" aria-hidden>
        <span className="fu-orb fu-orb-1" />
        <span className="fu-orb fu-orb-2" />
        <span className="fu-orb fu-orb-3" />
      </div>
      <div className="fu-hero-bg" aria-hidden />
      <div className="fu-hero-mesh" aria-hidden />
      <div className="fu-hero-shine" aria-hidden />
      <div className="fu-hero-grid">
        <div>
          {kicker ? <p className="fu-kicker">{kicker}</p> : null}
          <h1 className="fu-title">{title}</h1>
          <p className="fu-lead">{lead}</p>
          {actions && <div className="fu-cta-row">{actions}</div>}
          {stats}
        </div>
        {showcase}
      </div>
    </section>
  );
}

export function DuelLogoShowcase({
  teamA,
  teamB,
  labelA,
  labelB,
  className,
}: {
  teamA: ReactNode;
  teamB: ReactNode;
  labelA: string;
  labelB: string;
  className?: string;
}) {
  return (
    <div className={["fu-duel-showcase", className].filter(Boolean).join(" ")} aria-hidden={false}>
      <div className="fu-duel-logo fu-card-float fu-card-float-1">
        {teamA}
        <span>{labelA}</span>
      </div>
      <span className="fu-duel-vs">VS</span>
      <div className="fu-duel-logo fu-card-float fu-card-float-3">
        {teamB}
        <span>{labelB}</span>
      </div>
    </div>
  );
}
