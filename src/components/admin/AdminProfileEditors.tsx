"use client";

import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { AdminField, AdminFieldRow } from "@/components/admin/AdminField";
import { AdminPlayerLogoPicker } from "@/components/admin/AdminPlayerLogoPicker";
import {
  emptyAchievement,
  emptySection,
  linesToList,
  listToLines,
  type CareerHighlight,
  type SocialLinks,
  type WikiAchievement,
  type WikiSection,
} from "@/lib/data/profile-wiki";

export function AdminTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="bf-admin-tab-bar" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`bf-admin-tab ${active === t.id ? "is-on" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function AdminSocialEditor({
  value,
  onChange,
}: {
  value: SocialLinks;
  onChange: (v: SocialLinks) => void;
}) {
  const fields: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
    { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/…" },
    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
    { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/…" },
    { key: "discord", label: "Discord", placeholder: "https://discord.gg/…" },
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/…" },
    { key: "website", label: "Web oficial", placeholder: "https://…" },
  ];

  return (
    <div className="bf-admin-social-grid">
      {fields.map(({ key, label, placeholder }) => (
        <AdminField key={key} label={label}>
          <input
            value={value[key] ?? ""}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            placeholder={placeholder}
          />
        </AdminField>
      ))}
    </div>
  );
}

export function AdminAchievementsEditor({
  value,
  onChange,
}: {
  value: WikiAchievement[];
  onChange: (v: WikiAchievement[]) => void;
}) {
  return (
    <div className="bf-admin-stack-editor">
      <p className="bf-admin-field-hint">
        Añade trofeos y resultados importantes. Aparecen en la pestaña Palmarés de la ficha pública.
      </p>
      {value.map((a, i) => (
        <div key={i} className="bf-admin-stack-card">
          <AdminFieldRow>
            <AdminField label="Posición / título">
              <input
                value={a.place}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...a, place: e.target.value };
                  onChange(next);
                }}
                placeholder="Ej: 1º, Campeón, Top 4"
              />
            </AdminField>
            <AdminField label="Torneo o evento">
              <input
                value={a.tournament}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...a, tournament: e.target.value };
                  onChange(next);
                }}
                placeholder="Ej: BSC 2026 EMEA Finals"
              />
            </AdminField>
          </AdminFieldRow>
          <AdminFieldRow>
            <AdminField label="Premio">
              <input
                value={a.prize}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...a, prize: e.target.value };
                  onChange(next);
                }}
                placeholder="Ej: $50,000"
              />
            </AdminField>
            <AdminField label="Año o fecha">
              <input
                value={a.date}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...a, date: e.target.value };
                  onChange(next);
                }}
              />
            </AdminField>
          </AdminFieldRow>
          <button
            type="button"
            className="bf-admin-icon-btn is-danger"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <Trash2 size={16} /> Quitar trofeo
          </button>
        </div>
      ))}
      <button type="button" className="bp-btn bp-btn-ghost" onClick={() => onChange([...value, emptyAchievement()])}>
        <Plus size={16} /> Añadir trofeo
      </button>
    </div>
  );
}

export function AdminWikiSectionsEditor({
  value,
  onChange,
}: {
  value: WikiSection[];
  onChange: (v: WikiSection[]) => void;
}) {
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  return (
    <div className="bf-admin-stack-editor">
      <p className="bf-admin-field-hint">
        Como una Wikipedia: títulos de sección y párrafos. Cada párrafo separado por una línea en blanco en el
        cuadro de texto.
      </p>
      {value.map((sec, i) => (
        <div key={sec.id} className="bf-admin-stack-card bf-admin-wiki-section">
          <div className="bf-admin-wiki-section-head">
            <GripVertical size={16} aria-hidden />
            <AdminField label="Título de la sección" className="bf-admin-field-grow">
              <input
                value={sec.title}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...sec, title: e.target.value };
                  onChange(next);
                }}
              />
            </AdminField>
            <div className="bf-admin-wiki-moves">
              <button type="button" className="bf-admin-icon-btn" onClick={() => move(i, -1)} title="Subir">
                <ChevronUp size={16} />
              </button>
              <button type="button" className="bf-admin-icon-btn" onClick={() => move(i, 1)} title="Bajar">
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                className="bf-admin-icon-btn is-danger"
                onClick={() => onChange(value.filter((s) => s.id !== sec.id))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <AdminField label="Contenido" hint="Un párrafo por bloque — pulsa Enter dos veces entre párrafos">
            <textarea
              rows={6}
              value={sec.paragraphs.join("\n\n")}
              onChange={(e) => {
                const next = [...value];
                next[i] = {
                  ...sec,
                  paragraphs: e.target.value.split(/\n\n+/).map((p) => p.trim()).filter(Boolean).length
                    ? e.target.value.split(/\n\n+/).map((p) => p.trim())
                    : [""],
                };
                onChange(next);
              }}
            />
          </AdminField>
        </div>
      ))}
      <button type="button" className="bp-btn bp-btn-ghost" onClick={() => onChange([...value, emptySection()])}>
        <Plus size={16} /> Añadir sección
      </button>
    </div>
  );
}

export function AdminFunFactsEditor({
  value,
  onChange,
  label = "Datos curiosos",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}) {
  return (
    <AdminField label={label} hint="Un dato por línea — bullets en la ficha pública">
      <textarea rows={4} value={listToLines(value)} onChange={(e) => onChange(linesToList(e.target.value))} />
    </AdminField>
  );
}

export function AdminCareerHighlightsEditor({
  value,
  onChange,
}: {
  value: CareerHighlight[];
  onChange: (v: CareerHighlight[]) => void;
}) {
  return (
    <div className="bf-admin-stack-editor">
      {value.map((h, i) => (
        <div key={i} className="bf-admin-stack-card">
          <AdminFieldRow>
            <AdminField label="Año">
              <input
                value={h.year}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...h, year: e.target.value };
                  onChange(next);
                }}
              />
            </AdminField>
            <AdminField label="Título">
              <input
                value={h.title}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...h, title: e.target.value };
                  onChange(next);
                }}
              />
            </AdminField>
          </AdminFieldRow>
          <AdminField label="Detalle">
            <input
              value={h.detail}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...h, detail: e.target.value };
                onChange(next);
              }}
            />
          </AdminField>
          <button type="button" className="bf-admin-icon-btn is-danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash2 size={16} /> Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="bp-btn bp-btn-ghost"
        onClick={() => onChange([...value, { year: "", title: "", detail: "" }])}
      >
        <Plus size={16} /> Añadir hito
      </button>
    </div>
  );
}

export function AdminRosterPicker({
  teamSlug,
  allPlayers,
  selected,
  onChange,
}: {
  teamSlug: string;
  allPlayers: { slug: string; ign: string; team_slug: string | null }[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  return (
    <div className="bf-admin-roster-picker">
      <p className="bf-admin-field-hint">
        Clic en la foto para añadir o quitar de la plantilla. También puedes asignar el club en la ficha de cada jugador.
      </p>
      <AdminPlayerLogoPicker
        players={allPlayers}
        selected={selected}
        onChange={onChange}
        teamSlug={teamSlug}
        maxHeight="360px"
      />
    </div>
  );
}

export function AdminGalleryUrlsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <AdminField label="Galería de imágenes" hint="Una URL de imagen por línea">
      <textarea rows={3} value={listToLines(value)} onChange={(e) => onChange(linesToList(e.target.value))} />
    </AdminField>
  );
}
