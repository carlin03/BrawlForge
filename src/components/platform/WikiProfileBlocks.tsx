"use client";

import type { CareerHighlight, WikiSection } from "@/lib/data/profile-wiki";

const SOCIAL_LABELS: Record<string, string> = {
  twitter: "Twitter / X",
  youtube: "YouTube",
  discord: "Discord",
  twitch: "Twitch",
  instagram: "Instagram",
  tiktok: "TikTok",
  website: "Web oficial",
};

export function WikiDetailBanner({ url }: { url?: string }) {
  if (!url?.trim()) return null;
  return (
    <div className="bf-wiki-banner-wrap">
      <img src={url.trim()} alt="" className="bf-wiki-banner-img" />
      <div className="bf-wiki-banner-fade" aria-hidden />
    </div>
  );
}

export function WikiSectionsBlock({ sections }: { sections: WikiSection[] }) {
  if (!sections?.length) return null;
  return (
    <>
      {sections.map((sec) => (
        <section key={sec.id} className="bf-info-block-premium bf-wiki-section">
          <h3>{sec.title}</h3>
          {sec.paragraphs.map((p, i) => (
            <p key={i} className="bf-detail-prose">
              {p}
            </p>
          ))}
        </section>
      ))}
    </>
  );
}

export function WikiFunFactsBlock({ facts, title = "Datos curiosos" }: { facts: string[]; title?: string }) {
  if (!facts?.length) return null;
  return (
    <section className="bf-info-block-premium">
      <h3>{title}</h3>
      <ul className="bf-wiki-facts">
        {facts.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </section>
  );
}

export function WikiRivalsBlock({ rivals }: { rivals: string[] }) {
  if (!rivals?.length) return null;
  return (
    <section className="bf-info-block-premium">
      <h3>Rivales históricos</h3>
      <div className="bf-wiki-chip-row">
        {rivals.map((r) => (
          <span key={r} className="bp-chip bp-chip-red">
            {r}
          </span>
        ))}
      </div>
    </section>
  );
}

export function WikiGalleryBlock({ urls }: { urls: string[] }) {
  const list = (urls ?? []).filter((u) => u?.trim());
  if (!list.length) return null;
  return (
    <section className="bf-team-section">
      <h2 className="bf-home-block-title">Galería</h2>
      <div className="bf-wiki-gallery">
        {list.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bf-wiki-gallery-item bf-hover-lift"
          >
            <img src={url} alt="" loading="lazy" />
          </a>
        ))}
      </div>
    </section>
  );
}

export function WikiSocialBlock({ social }: { social: Record<string, string> }) {
  const entries = Object.entries(social).filter(([, v]) => v?.trim());
  if (!entries.length) return null;
  return (
    <div className="bf-info-block-premium">
      <h3>Redes y comunidad</h3>
      <ul className="bf-detail-links">
        {entries.map(([key, href]) => (
          <li key={key}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {SOCIAL_LABELS[key] ?? key}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WikiCareerTimeline({ items }: { items: CareerHighlight[] }) {
  if (!items?.length) return null;
  return (
    <section className="bf-panel bf-detail-card">
      <h2 className="bf-home-block-title">Trayectoria</h2>
      <div className="bf-wiki-timeline">
        {items.map((h, i) => (
          <div key={i} className="bf-wiki-timeline-row">
            <span className="bf-wiki-timeline-year">{h.year || "—"}</span>
            <div>
              <strong>{h.title}</strong>
              {h.detail && <p className="bf-detail-prose">{h.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
