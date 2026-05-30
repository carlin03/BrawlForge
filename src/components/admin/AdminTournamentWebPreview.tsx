"use client";

import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import { formatTournamentDates } from "@/lib/data/tournament-stats";
import { adminRowToEsportsPreview, type AdminTournamentRow } from "@/lib/data/admin-tournaments";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";
import { teamName } from "@/lib/data";

type TeamOption = { slug: string; name: string; tag: string };

function TournamentPreviewLogo({
  slug,
  name,
  logoUrl,
  size,
}: {
  slug: string;
  name: string;
  logoUrl?: string | null;
  size: number;
}) {
  const custom = logoUrl?.trim();
  if (custom) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${slug}-${custom}`}
        src={toClientLogoUrl(custom)}
        alt={name}
        width={size}
        height={size}
        className="bf-admin-tournament-custom-logo"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }
  return <TournamentLogo key={slug} slug={slug} name={name} size={size} />;
}

export function AdminTournamentWebPreview({
  row,
  teams,
}: {
  row: AdminTournamentRow;
  teams: TeamOption[];
}) {
  const t = adminRowToEsportsPreview(row);
  const previewKey = [
    row.slug,
    row.name,
    row.short_name,
    row.status,
    row.region,
    row.prize_pool,
    row.start_date,
    row.end_date,
    row.location,
    row.stage,
    row.tier,
    row.logo_url,
    row.participant_slugs.join(","),
  ].join("|");

  const statusLabel =
    t.status === "live" ? "LIVE" : t.status === "upcoming" ? "Próximo" : "Finalizado";
  const badgeClass =
    t.status === "live"
      ? "bf-badge-red"
      : t.status === "upcoming"
        ? "bf-badge-blue"
        : "bf-badge-yellow";

  const start = t.startDate || "2026-01-01";
  const end = t.endDate || start;
  const dateLabel = formatTournamentDates(start, end);
  const leadParts = [t.prizePool, dateLabel, t.location !== "—" ? t.location : null, t.stage || null].filter(
    Boolean,
  );
  const description =
    typeof row.meta?.description === "string" && row.meta.description.trim()
      ? row.meta.description.trim()
      : null;

  const participantTeams = (row.participant_slugs ?? [])
    .slice(0, 12)
    .map((slug) => {
      const hit = teams.find((x) => x.slug === slug);
      return { slug, name: hit?.name ?? teamName(slug), tag: hit?.tag ?? slug.slice(0, 3).toUpperCase() };
    });

  return (
    <div className="bf-admin-tournament-preview" key={previewKey}>
      <p className="bf-studio-hint bf-admin-tournament-preview-title">Vista previa en la web</p>
      <p className="bf-admin-field-hint" style={{ margin: "0 0 14px" }}>
        Actualiza al editar campos (sin guardar). Arriba: listado · abajo: cabecera de la ficha.
      </p>

      <div className="bf-admin-tournament-preview-block">
        <span className="bf-admin-tournament-preview-label">Listado · /tournaments</span>
        <div className="bf-admin-tournament-preview-frame">
          <div className="es-event-row bf-admin-tournament-list-row" aria-hidden>
            <TournamentPreviewLogo
              slug={t.slug}
              name={t.shortName}
              logoUrl={row.logo_url}
              size={40}
            />
            <div className="es-event-main">
              <div className="es-event-title">{t.shortName}</div>
              <div className="es-event-sub">{t.name}</div>
            </div>
            <span className={`bf-badge ${badgeClass}`}>{statusLabel}</span>
            <span className="es-event-meta">{t.region}</span>
            <span className="es-event-prize c-yellow">{t.prizePool}</span>
          </div>
        </div>
      </div>

      <div className="bf-admin-tournament-preview-block">
        <span className="bf-admin-tournament-preview-label">Ficha · /tournaments/{row.slug}</span>
        <div className="bf-admin-tournament-hero-preview">
          <div className="bf-admin-tournament-hero-top">
            <TournamentPreviewLogo
              slug={t.slug}
              name={t.shortName}
              logoUrl={row.logo_url}
              size={72}
            />
            <div className="bf-admin-tournament-hero-copy">
              <div className="bf-team-hero-badges">
                {t.tier != null && (
                  <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                )}
                <span className="bp-chip">{t.region}</span>
                {t.status === "live" && (
                  <span className="bp-chip bp-chip-live">
                    <span className="bp-live-dot" /> LIVE
                  </span>
                )}
                <span className={`bf-badge ${badgeClass}`}>{statusLabel}</span>
              </div>
              <h3 className="bf-admin-tournament-hero-name">{t.name}</h3>
              <p className="bf-admin-tournament-hero-lead">{leadParts.join(" · ")}</p>
              {description && <p className="bf-admin-tournament-hero-desc">{description}</p>}
            </div>
          </div>

          <div className="fu-stats bf-admin-tournament-hero-stats">
            <div className="fu-stat">
              <b>{participantTeams.length || t.teams}</b>
              <span>Equipos</span>
            </div>
            <div className="fu-stat">
              <b>—</b>
              <span>Partidos</span>
            </div>
            <div className="fu-stat">
              <b>{t.status === "live" ? "LIVE" : t.status === "upcoming" ? "Próx." : "Fin"}</b>
              <span>Estado</span>
            </div>
            <div className="fu-stat">
              <b>{t.tier ?? "—"}</b>
              <span>Tier</span>
            </div>
          </div>

          {participantTeams.length > 0 && (
            <div className="bf-admin-tournament-participants">
              <span className="bf-admin-tournament-preview-label">Participantes</span>
              <div className="bf-admin-tournament-participants-grid">
                {participantTeams.map((pt) => (
                  <span key={pt.slug} className="bf-admin-tournament-participant-chip" title={pt.name}>
                    <TeamLogo key={`${previewKey}-${pt.slug}`} slug={pt.slug} name={pt.name} size={28} />
                    <span>{pt.tag}</span>
                  </span>
                ))}
                {(row.participant_slugs?.length ?? 0) > participantTeams.length && (
                  <span className="bf-admin-tournament-participant-more">
                    +{(row.participant_slugs?.length ?? 0) - participantTeams.length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
