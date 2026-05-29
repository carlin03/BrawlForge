"use client";

import { useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { AdminField, AdminFieldRow, AdminMeta } from "@/components/admin/AdminField";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import type { AdminPlayerCatalogRow } from "@/lib/data/admin-catalog-fields";
import {
  parsePlayerMeta,
  parseSocial,
  type PlayerProfileMeta,
  type SocialLinks,
} from "@/lib/data/profile-wiki";
import {
  AdminTabBar,
  AdminSocialEditor,
  AdminWikiSectionsEditor,
  AdminFunFactsEditor,
  AdminCareerHighlightsEditor,
  AdminGalleryUrlsEditor,
} from "@/components/admin/AdminProfileEditors";

export type PlayerWikiState = AdminPlayerCatalogRow & {
  social: SocialLinks;
  profile: PlayerProfileMeta;
};

export function playerRowToWikiState(row: AdminPlayerCatalogRow & Record<string, unknown>): PlayerWikiState {
  return {
    ...row,
    social: parseSocial(row.social ?? {}),
    profile: parsePlayerMeta(row.meta ?? {}),
  };
}

type Tab = "basico" | "bio" | "carrera" | "juego" | "fantasy" | "redes";

const TABS: { id: Tab; label: string }[] = [
  { id: "basico", label: "Básico" },
  { id: "bio", label: "Biografía" },
  { id: "carrera", label: "Carrera" },
  { id: "juego", label: "En el juego" },
  { id: "fantasy", label: "Fantasy" },
  { id: "redes", label: "Redes y foto" },
];

const REGIONS = ["GLOBAL", "EMEA", "EA", "NA", "SA", "CN"] as const;

export function AdminPlayerWikiForm({
  player,
  teams,
  loading,
  onChange,
  onSave,
}: {
  player: PlayerWikiState;
  teams: { slug: string; name: string; tag: string }[];
  loading: boolean;
  onChange: (p: PlayerWikiState) => void;
  onSave: () => void;
}) {
  const [tab, setTab] = useState<Tab>("basico");
  const p = player.profile;
  const mains = (p.main_brawlers ?? []).join(", ");

  return (
    <form
      className="bf-admin-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="bf-admin-editor-head">
        <PlayerPhoto
          playerSlug={player.slug}
          teamSlug={player.team_slug ?? undefined}
          size={96}
          photoUrlOverride={player.photo_url}
        />
        <div>
          <h2>{player.ign}</h2>
          {player.real_name && (
            <p className="bf-admin-field-hint" style={{ margin: 0 }}>
              {player.real_name}
            </p>
          )}
        </div>
      </div>

      <AdminTabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "basico" && (
        <div className="bf-admin-tab-panel">
          <AdminFieldRow>
            <AdminField label="IGN (nombre en juego)">
              <input value={player.ign} onChange={(e) => onChange({ ...player, ign: e.target.value })} />
            </AdminField>
            <AdminField label="Nombre real">
              <input
                value={player.real_name ?? ""}
                onChange={(e) => onChange({ ...player, real_name: e.target.value })}
              />
            </AdminField>
          </AdminFieldRow>
          <AdminField label="Apodo / nickname">
            <input
              value={p.nickname ?? ""}
              onChange={(e) => onChange({ ...player, profile: { ...p, nickname: e.target.value } })}
            />
          </AdminField>
          <AdminField label="Club actual">
            <select
              value={player.team_slug ?? ""}
              onChange={(e) => onChange({ ...player, team_slug: e.target.value || null })}
            >
              <option value="">— Sin equipo —</option>
              {teams
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.tag} · {t.name}
                  </option>
                ))}
            </select>
          </AdminField>
          <AdminFieldRow>
            <AdminField label="Región">
              <select value={player.region} onChange={(e) => onChange({ ...player, region: e.target.value })}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="País / nacionalidad">
              <input
                value={player.nationality ?? player.country ?? ""}
                onChange={(e) =>
                  onChange({ ...player, nationality: e.target.value, country: e.target.value })
                }
              />
            </AdminField>
          </AdminFieldRow>
          <AdminFieldRow>
            <AdminField label="Rol en el equipo">
              <input value={player.role} onChange={(e) => onChange({ ...player, role: e.target.value })} />
            </AdminField>
            <AdminField label="Estado">
              <select value={player.status} onChange={(e) => onChange({ ...player, status: e.target.value })}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="retired">Retirado</option>
              </select>
            </AdminField>
          </AdminFieldRow>
          <AdminField label="Frase corta (tagline)">
            <input
              value={p.tagline ?? ""}
              onChange={(e) => onChange({ ...player, profile: { ...p, tagline: e.target.value } })}
            />
          </AdminField>
        </div>
      )}

      {tab === "bio" && (
        <div className="bf-admin-tab-panel">
          <AdminField label="Biografía corta" hint="Resumen en la pestaña Perfil">
            <textarea
              rows={4}
              value={player.bio ?? ""}
              onChange={(e) => onChange({ ...player, bio: e.target.value })}
            />
          </AdminField>
          <AdminWikiSectionsEditor
            value={p.wiki_sections ?? []}
            onChange={(wiki_sections) => onChange({ ...player, profile: { ...p, wiki_sections } })}
          />
          <AdminFunFactsEditor
            value={p.fun_facts ?? []}
            onChange={(fun_facts) => onChange({ ...player, profile: { ...p, fun_facts } })}
          />
        </div>
      )}

      {tab === "carrera" && (
        <div className="bf-admin-tab-panel">
          <AdminField label="Fecha de ingreso al club">
            <input
              value={player.join_date ?? ""}
              onChange={(e) => onChange({ ...player, join_date: e.target.value })}
              placeholder="2026-01"
            />
          </AdminField>
          <AdminField label="Capitán del equipo">
            <select
              value={player.is_captain ? "yes" : "no"}
              onChange={(e) => onChange({ ...player, is_captain: e.target.value === "yes" })}
            >
              <option value="no">No</option>
              <option value="yes">Sí — es capitán</option>
            </select>
          </AdminField>
          <AdminField label="Equipos anteriores" hint="Separados por coma">
            <input
              value={(player.previous_teams ?? []).join(", ")}
              onChange={(e) =>
                onChange({
                  ...player,
                  previous_teams: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </AdminField>
          <AdminCareerHighlightsEditor
            value={p.career_highlights ?? []}
            onChange={(career_highlights) => onChange({ ...player, profile: { ...p, career_highlights } })}
          />
          <AdminField label="Liquipedia">
            <input
              value={player.liquipedia_url ?? ""}
              onChange={(e) => onChange({ ...player, liquipedia_url: e.target.value })}
            />
          </AdminField>
        </div>
      )}

      {tab === "juego" && (
        <div className="bf-admin-tab-panel">
          <AdminField label="Brawlers principales" hint="Separados por coma — ej: Shelly, Colt">
            <input
              value={mains}
              onChange={(e) =>
                onChange({
                  ...player,
                  profile: {
                    ...p,
                    main_brawlers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                  primary_brawler: e.target.value.split(",")[0]?.trim() || player.primary_brawler,
                })
              }
            />
          </AdminField>
          <AdminField label="Estilo de juego">
            <textarea
              rows={3}
              value={p.playstyle ?? ""}
              onChange={(e) => onChange({ ...player, profile: { ...p, playstyle: e.target.value } })}
              placeholder="Ej: Aggressive lane, support, flex pick…"
            />
          </AdminField>
          <AdminField label="Rating máximo histórico">
            <input
              type="number"
              step="0.01"
              value={p.peak_rating ?? ""}
              onChange={(e) =>
                onChange({
                  ...player,
                  profile: { ...p, peak_rating: e.target.value ? Number(e.target.value) : undefined },
                })
              }
            />
          </AdminField>
        </div>
      )}

      {tab === "fantasy" && (
        <div className="bf-admin-tab-panel">
          <AdminFieldRow>
            <AdminField label="Puntos fantasy (OVR)">
              <input
                type="number"
                value={player.fantasy_points}
                onChange={(e) => onChange({ ...player, fantasy_points: Number(e.target.value) })}
              />
            </AdminField>
            <AdminField label="Propiedad (%)">
              <input
                type="number"
                value={player.fantasy_ownership}
                onChange={(e) => onChange({ ...player, fantasy_ownership: Number(e.target.value) })}
              />
            </AdminField>
            <AdminField label="Rating">
              <input
                type="number"
                step="0.01"
                value={player.rating}
                onChange={(e) => onChange({ ...player, rating: Number(e.target.value) })}
              />
            </AdminField>
          </AdminFieldRow>
        </div>
      )}

      {tab === "redes" && (
        <div className="bf-admin-tab-panel">
          <AdminField label="URL de la foto del jugador" hint="Se ve en cartas y ficha">
            <input
              type="url"
              value={player.photo_url ?? ""}
              onChange={(e) => onChange({ ...player, photo_url: e.target.value })}
              placeholder="https://…"
            />
          </AdminField>
          {player.photo_url?.trim() && (
            <div className="bf-admin-photo-preview">
              <img src={player.photo_url.trim()} alt="" />
            </div>
          )}
          <AdminField label="Banner de perfil (opcional)">
            <input
              value={p.banner_url ?? ""}
              onChange={(e) => onChange({ ...player, profile: { ...p, banner_url: e.target.value } })}
            />
          </AdminField>
          <AdminSocialEditor value={player.social} onChange={(social) => onChange({ ...player, social })} />
          <AdminGalleryUrlsEditor
            value={p.gallery_urls ?? []}
            onChange={(gallery_urls) => onChange({ ...player, profile: { ...p, gallery_urls } })}
          />
        </div>
      )}

      <AdminMeta>Ficha pública: /players/{player.slug}</AdminMeta>

      <div className="bf-admin-editor-actions">
        <button type="submit" className="bp-btn bp-btn-gold" disabled={loading}>
          <Save size={16} /> Guardar jugador
        </button>
        <Link href={`/players/${player.slug}`} className="bp-btn bp-btn-ghost" target="_blank">
          Ver en la web
        </Link>
      </div>
    </form>
  );
}
