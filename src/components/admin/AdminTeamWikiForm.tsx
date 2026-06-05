"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Image, Save, Trash2 } from "lucide-react";
import { AdminField, AdminFieldRow, AdminMeta } from "@/components/admin/AdminField";
import { AdminCountryPicker } from "@/components/admin/AdminCountryPicker";
import { countryValueForStorage } from "@/lib/data/country-picker";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";
import {
  parseAchievements,
  parseSocial,
  parseTeamMeta,
  type SocialLinks,
  type TeamProfileMeta,
  type WikiAchievement,
  type WikiSection,
} from "@/lib/data/profile-wiki";
import { parseTeamSponsors } from "@/lib/data/team-page-stats";
import {
  AdminTabBar,
  AdminSocialEditor,
  AdminAchievementsEditor,
  AdminSponsorsEditor,
  AdminWikiSectionsEditor,
  AdminFunFactsEditor,
  AdminRosterPicker,
  AdminGalleryUrlsEditor,
} from "@/components/admin/AdminProfileEditors";

export type TeamWikiState = AdminTeamCatalogRow & {
  achievements: WikiAchievement[];
  social: SocialLinks;
  profile: TeamProfileMeta;
};

export function teamRowToWikiState(row: AdminTeamCatalogRow & Record<string, unknown>): TeamWikiState {
  const profile = parseTeamMeta(row.meta ?? {});
  const sponsors = row.sponsors_json?.length
    ? row.sponsors_json
    : parseTeamSponsors(profile.sponsors);
  return {
    ...row,
    manager: row.manager ?? profile.manager ?? null,
    captain_slug: row.captain_slug ?? null,
    peak_rank: row.peak_rank ?? profile.peak_rank ?? null,
    achievements: parseAchievements(row.achievements ?? []),
    social: parseSocial(row.social ?? {}),
    sponsors_json: sponsors,
    profile: {
      ...profile,
      manager: row.manager ?? profile.manager,
      peak_rank: row.peak_rank ?? profile.peak_rank,
      sponsors: sponsors.length ? sponsors : profile.sponsors,
    },
  };
}

type Tab = "basico" | "historia" | "plantilla" | "palmares" | "redes" | "medios";

const TABS: { id: Tab; label: string }[] = [
  { id: "basico", label: "Básico" },
  { id: "historia", label: "Historia" },
  { id: "plantilla", label: "Plantilla" },
  { id: "palmares", label: "Palmarés" },
  { id: "redes", label: "Redes" },
  { id: "medios", label: "Imágenes" },
];

const REGIONS = ["GLOBAL", "EMEA", "EA", "NA", "SA", "CN"] as const;

export function AdminTeamWikiForm({
  team,
  players,
  loading,
  onChange,
  onSave,
  onOpenLogos,
  onDelete,
  toolbar,
}: {
  team: TeamWikiState;
  players: { slug: string; ign: string; team_slug: string | null }[];
  loading: boolean;
  onChange: (t: TeamWikiState) => void;
  onSave: () => void;
  onOpenLogos: () => void;
  onDelete?: () => void;
  /** Barra superior (p. ej. exportar CSV) — mismo panel que el editor, como en Jugadores */
  toolbar?: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("basico");
  const p = team.profile;

  return (
    <form
      className="bf-admin-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      {toolbar}
      <div className="bf-admin-editor-head">
        <TeamLogo key={team.slug} slug={team.slug} name={team.name} size={72} />
        <div>
          <h2>{team.name}</h2>
          <p className="bf-admin-field-hint" style={{ margin: 0 }}>
            {team.tag} · {team.country || "—"}
          </p>
        </div>
      </div>

      <AdminTabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "basico" && (
        <div className="bf-admin-tab-panel">
          <AdminFieldRow>
            <AdminField label="Nombre del club">
              <input value={team.name} onChange={(e) => onChange({ ...team, name: e.target.value })} />
            </AdminField>
            <AdminField label="Tag (abreviatura)">
              <input value={team.tag} onChange={(e) => onChange({ ...team, tag: e.target.value })} />
            </AdminField>
          </AdminFieldRow>
          <AdminFieldRow>
            <AdminField label="Región">
              <select value={team.region} onChange={(e) => onChange({ ...team, region: e.target.value })}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="País" hint="Busca el país del club en la lista">
              <AdminCountryPicker
                value={countryValueForStorage(team.country ?? "")}
                onChange={(code) => onChange({ ...team, country: code })}
              />
            </AdminField>
          </AdminFieldRow>
          <AdminFieldRow>
            <AdminField label="Ranking global">
              <input
                type="number"
                value={team.rank ?? ""}
                onChange={(e) =>
                  onChange({ ...team, rank: e.target.value ? Number(e.target.value) : null })
                }
              />
            </AdminField>
            <AdminField label="Δ ranking" hint="Positivo sube, negativo baja">
              <input
                type="number"
                value={team.rank_change ?? 0}
                onChange={(e) => onChange({ ...team, rank_change: Number(e.target.value) })}
              />
            </AdminField>
          </AdminFieldRow>
          <AdminFieldRow>
            <AdminField label="Premios totales ($)">
              <input
                type="number"
                value={team.earnings}
                onChange={(e) => onChange({ ...team, earnings: Number(e.target.value) })}
              />
            </AdminField>
            <AdminField label="Mejor ranking histórico">
              <input
                type="number"
                value={team.peak_rank ?? p.peak_rank ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  onChange({
                    ...team,
                    peak_rank: v,
                    profile: { ...p, peak_rank: v ?? undefined },
                  });
                }}
              />
            </AdminField>
          </AdminFieldRow>
          <AdminField label="Forma reciente" hint="Últimos resultados: W|L|W (máx. 5)">
            <input
              value={(team.form ?? []).join("|")}
              onChange={(e) =>
                onChange({
                  ...team,
                  form: e.target.value
                    .split(/[|,]/)
                    .map((s) => s.trim().toUpperCase())
                    .filter((s) => s === "W" || s === "L" || s === "D"),
                })
              }
              placeholder="W|W|L|W|W"
            />
          </AdminField>
          <AdminField label="Frase corta (tagline)" hint="Aparece bajo el nombre en la ficha">
            <input
              value={p.tagline ?? ""}
              onChange={(e) =>
                onChange({ ...team, profile: { ...p, tagline: e.target.value } })
              }
            />
          </AdminField>
          <AdminField label="Resumen del circuito">
            <input
              value={team.circuit_summary ?? ""}
              onChange={(e) => onChange({ ...team, circuit_summary: e.target.value })}
            />
          </AdminField>
          <AdminFieldRow>
            <AdminField label="Entrenador">
              <input value={team.coach ?? ""} onChange={(e) => onChange({ ...team, coach: e.target.value })} />
            </AdminField>
            <AdminField label="Manager">
              <input
                value={team.manager ?? p.manager ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...team, manager: v, profile: { ...p, manager: v } });
                }}
              />
            </AdminField>
          </AdminFieldRow>
          <AdminFieldRow>
            <AdminField label="CEO">
              <input
                value={p.ceo ?? ""}
                onChange={(e) => onChange({ ...team, profile: { ...p, ceo: e.target.value } })}
              />
            </AdminField>
            <AdminField label="Año de fundación">
              <input
                type="number"
                value={team.founded_year ?? ""}
                onChange={(e) =>
                  onChange({
                    ...team,
                    founded_year: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </AdminField>
          </AdminFieldRow>
          <AdminField label="Sede / ciudad">
            <input
              value={team.headquarters ?? ""}
              onChange={(e) => onChange({ ...team, headquarters: e.target.value })}
            />
          </AdminField>
          <AdminFieldRow>
            <AdminField label="Estado en el circuito">
              <select
                value={team.circuit_status ?? "active"}
                onChange={(e) => onChange({ ...team, circuit_status: e.target.value })}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="disbanded">Disuelto</option>
              </select>
            </AdminField>
            <AdminField label="BSC 2026">
              <select
                value={team.bsc_qualified_2026 === false ? "0" : "1"}
                onChange={(e) =>
                  onChange({ ...team, bsc_qualified_2026: e.target.value === "1" })
                }
              >
                <option value="1">Clasificado / activo en circuito</option>
                <option value="0">No clasificado</option>
              </select>
            </AdminField>
          </AdminFieldRow>
          <AdminField label="Liquipedia / wiki externa">
            <input
              value={team.liquipedia_url ?? ""}
              onChange={(e) => onChange({ ...team, liquipedia_url: e.target.value })}
              placeholder="https://liquipedia.net/brawlstars/…"
            />
          </AdminField>
        </div>
      )}

      {tab === "historia" && (
        <div className="bf-admin-tab-panel">
          <AdminMeta>
            En la web pública esto aparece en la pestaña <strong>Historia</strong> con índice, galería y datos
            clave. La descripción corta va en Resumen.
          </AdminMeta>
          <AdminField label="Descripción principal" hint="Texto introductorio de la ficha">
            <textarea
              rows={5}
              value={team.description ?? ""}
              onChange={(e) => onChange({ ...team, description: e.target.value })}
            />
          </AdminField>
          <AdminField label="Lema o eslogan del club">
            <input
              value={p.motto ?? ""}
              onChange={(e) => onChange({ ...team, profile: { ...p, motto: e.target.value } })}
            />
          </AdminField>
          <AdminWikiSectionsEditor
            entitySlug={team.slug}
            value={p.wiki_sections ?? []}
            onChange={(wiki_sections) => onChange({ ...team, profile: { ...p, wiki_sections } })}
          />
          <AdminFunFactsEditor
            value={p.fun_facts ?? []}
            onChange={(fun_facts) => onChange({ ...team, profile: { ...p, fun_facts } })}
          />
          <AdminField label="Rivales históricos" hint="Un rival por línea">
            <textarea
              rows={2}
              value={(p.rivals ?? []).join("\n")}
              onChange={(e) =>
                onChange({
                  ...team,
                  profile: {
                    ...p,
                    rivals: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
            />
          </AdminField>
        </div>
      )}

      {tab === "plantilla" && (
        <div className="bf-admin-tab-panel">
          <AdminField label="Capitán (slug del jugador)" hint="Debe estar en la plantilla">
            <input
              value={team.captain_slug ?? ""}
              onChange={(e) => onChange({ ...team, captain_slug: e.target.value.trim() || null })}
              placeholder="ej: yoshi"
            />
          </AdminField>
          <AdminRosterPicker
            teamSlug={team.slug}
            allPlayers={players}
            selected={team.roster_slugs}
            onChange={(roster_slugs) => onChange({ ...team, roster_slugs })}
          />
        </div>
      )}

      {tab === "palmares" && (
        <div className="bf-admin-tab-panel">
          <AdminAchievementsEditor
            value={team.achievements}
            onChange={(achievements) => onChange({ ...team, achievements })}
          />
          <AdminSponsorsEditor
            value={team.sponsors_json ?? parseTeamSponsors(p.sponsors) ?? []}
            onChange={(sponsors_json) =>
              onChange({
                ...team,
                sponsors_json,
                profile: { ...p, sponsors: sponsors_json },
              })
            }
          />
        </div>
      )}

      {tab === "redes" && (
        <div className="bf-admin-tab-panel">
          <AdminSocialEditor value={team.social} onChange={(social) => onChange({ ...team, social })} />
        </div>
      )}

      {tab === "medios" && (
        <div className="bf-admin-tab-panel">
          <AdminField label="URL del logo">
            <input
              value={team.logo_url ?? ""}
              onChange={(e) => onChange({ ...team, logo_url: e.target.value })}
              placeholder="https://…"
            />
          </AdminField>
          <AdminField label="Banner de la ficha" hint="Imagen ancha de fondo (opcional)">
            <input
              value={p.banner_url ?? ""}
              onChange={(e) => onChange({ ...team, profile: { ...p, banner_url: e.target.value } })}
              placeholder="https://…"
            />
          </AdminField>
          {p.banner_url && (
            <div className="bf-admin-photo-preview bf-admin-banner-preview">
              <img src={p.banner_url} alt="" />
            </div>
          )}
          <AdminGalleryUrlsEditor
            value={p.gallery_urls ?? []}
            onChange={(gallery_urls) => onChange({ ...team, profile: { ...p, gallery_urls } })}
          />
        </div>
      )}

      <AdminMeta>Ficha pública: /teams/{team.slug}</AdminMeta>

      <div className="bf-admin-editor-actions">
        <button type="submit" className="bp-btn bp-btn-gold" disabled={loading}>
          <Save size={16} /> Guardar equipo
        </button>
        <button type="button" className="bp-btn bp-btn-ghost" onClick={onOpenLogos}>
          <Image size={16} /> Cambiar logo
        </button>
        <Link href={`/teams/${team.slug}`} className="bp-btn bp-btn-ghost" target="_blank">
          Ver en la web
        </Link>
        {onDelete && (
          <button type="button" className="bp-btn bp-btn-ghost" style={{ color: "var(--bp-red-bright)" }} onClick={onDelete}>
            <Trash2 size={16} /> Eliminar del catálogo
          </button>
        )}
      </div>
    </form>
  );
}
