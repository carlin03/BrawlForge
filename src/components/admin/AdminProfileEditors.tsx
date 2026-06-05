"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Layers, FileText } from "lucide-react";
import { AdminField, AdminFieldRow } from "@/components/admin/AdminField";
import { AdminPlayerLogoPicker } from "@/components/admin/AdminPlayerLogoPicker";
import {
  emptyAchievement,
  emptySection,
  newSectionId,
  linesToList,
  listToLines,
  type CareerHighlight,
  type SocialLinks,
  type WikiAchievement,
  type WikiSection,
} from "@/lib/data/profile-wiki";
import {
  parseHistoryContentToWikiSections,
  serializeWikiSectionsToHistory,
} from "@/lib/admin/teams-master-csv";
import type { TeamSponsorEntry } from "@/lib/data/team-page-stats";

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

function emptySponsor(): TeamSponsorEntry {
  return { name: "", category: "", logo_url: "" };
}

export function AdminSponsorsEditor({
  value,
  onChange,
}: {
  value: TeamSponsorEntry[];
  onChange: (v: TeamSponsorEntry[]) => void;
}) {
  return (
    <div className="bf-admin-stack-editor">
      <p className="bf-admin-field-hint">Patrocinadores visibles en la ficha pública (pestaña Partners).</p>
      {value.map((s, i) => (
        <div key={i} className="bf-admin-stack-card">
          <AdminFieldRow>
            <AdminField label="Nombre">
              <input
                value={s.name}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...s, name: e.target.value };
                  onChange(next);
                }}
              />
            </AdminField>
            <AdminField label="Categoría">
              <input
                value={s.category ?? ""}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...s, category: e.target.value };
                  onChange(next);
                }}
              />
            </AdminField>
          </AdminFieldRow>
          <AdminField label="Logo URL">
            <input
              value={s.logo_url ?? ""}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...s, logo_url: e.target.value };
                onChange(next);
              }}
              placeholder="https://…"
            />
          </AdminField>
          <button
            type="button"
            className="bf-admin-icon-btn is-danger"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <Trash2 size={16} /> Quitar patrocinador
          </button>
        </div>
      ))}
      <button type="button" className="bp-btn bp-btn-ghost" onClick={() => onChange([...value, emptySponsor()])}>
        <Plus size={16} /> Añadir patrocinador
      </button>
    </div>
  );
}

function cloneSections(sections: WikiSection[]): WikiSection[] {
  return sections.map((s) => ({ ...s, paragraphs: [...s.paragraphs] }));
}

function updateSection(
  sections: WikiSection[],
  secIdx: number,
  patch: Partial<WikiSection>,
): WikiSection[] {
  const next = cloneSections(sections);
  next[secIdx] = { ...next[secIdx], ...patch };
  return next;
}

function updateParagraph(
  sections: WikiSection[],
  secIdx: number,
  paraIdx: number,
  text: string,
): WikiSection[] {
  const next = cloneSections(sections);
  const paras = [...next[secIdx].paragraphs];
  paras[paraIdx] = text;
  next[secIdx] = { ...next[secIdx], paragraphs: paras };
  return next;
}

function moveParagraph(
  sections: WikiSection[],
  secIdx: number,
  paraIdx: number,
  dir: -1 | 1,
): WikiSection[] {
  const j = paraIdx + dir;
  const paras = sections[secIdx].paragraphs;
  if (j < 0 || j >= paras.length) return sections;
  const next = cloneSections(sections);
  const row = [...next[secIdx].paragraphs];
  [row[paraIdx], row[j]] = [row[j], row[paraIdx]];
  next[secIdx] = { ...next[secIdx], paragraphs: row };
  return next;
}

export function AdminWikiSectionsEditor({
  value,
  onChange,
  /** Slug del equipo/jugador para IDs estables al importar texto CSV */
  entitySlug = "draft",
}: {
  value: WikiSection[];
  onChange: (v: WikiSection[]) => void;
  entitySlug?: string;
}) {
  const [mode, setMode] = useState<"blocks" | "csv">("blocks");
  const [csvDraft, setCsvDraft] = useState("");

  function moveSection(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = cloneSections(value);
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  function openCsvMode() {
    setCsvDraft(serializeWikiSectionsToHistory(value));
    setMode("csv");
  }

  function applyCsvToBlocks() {
    const parsed = parseHistoryContentToWikiSections(csvDraft, entitySlug);
    onChange(parsed.length ? parsed : [emptySection()]);
    setMode("blocks");
  }

  return (
    <div className="bf-admin-wiki-blocks-editor">
      <div className="bf-admin-wiki-blocks-toolbar">
        <p className="bf-admin-field-hint" style={{ margin: 0, flex: 1 }}>
          Cada <strong>sección</strong> es un bloque en la pestaña Historia (índice lateral). Dentro, cada{" "}
          <strong>párrafo</strong> es otro bloque independiente.
        </p>
        <div className="bf-admin-wiki-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "blocks"}
            className={mode === "blocks" ? "is-on" : ""}
            onClick={() => setMode("blocks")}
          >
            <Layers size={14} /> Por bloques
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "csv"}
            className={mode === "csv" ? "is-on" : ""}
            onClick={() => (mode === "csv" ? setMode("blocks") : openCsvMode())}
          >
            <FileText size={14} /> Texto CSV
          </button>
        </div>
      </div>

      {mode === "csv" ? (
        <div className="bf-admin-stack-card">
          <AdminField
            label="history_content"
            hint="Mismo formato que el CSV: ## Título, párrafos, separador --- entre secciones"
          >
            <textarea
              className="bf-admin-wiki-csv-textarea"
              rows={14}
              value={csvDraft}
              onChange={(e) => setCsvDraft(e.target.value)}
              placeholder={`## Historia\n\nPrimer párrafo…\n\n---\n\n## Temporada 2026\n\nSegundo bloque…`}
            />
          </AdminField>
          <div className="bf-admin-wiki-csv-actions">
            <button type="button" className="bp-btn bp-btn-gold" onClick={applyCsvToBlocks}>
              Aplicar a bloques
            </button>
            <button type="button" className="bp-btn bp-btn-ghost" onClick={() => setMode("blocks")}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="bf-admin-wiki-sections-list">
          {value.length === 0 && (
            <p className="bf-admin-wiki-empty">
              Sin secciones todavía. Añade la primera (por ejemplo &quot;Historia&quot; o &quot;Temporada
              2026&quot;).
            </p>
          )}
          {value.map((sec, secIdx) => (
            <article key={sec.id} className="bf-admin-wiki-section-block">
              <header className="bf-admin-wiki-section-block-head">
                <span className="bf-admin-wiki-section-index">Sección {secIdx + 1}</span>
                <GripVertical size={16} aria-hidden className="bf-admin-wiki-grip" />
                <AdminField label="Título (aparece en el índice)" className="bf-admin-field-grow">
                  <input
                    value={sec.title}
                    placeholder="Ej: Historia, Palmarés reciente, Plantilla 2026"
                    onChange={(e) => onChange(updateSection(value, secIdx, { title: e.target.value }))}
                  />
                </AdminField>
                <div className="bf-admin-wiki-moves">
                  <button
                    type="button"
                    className="bf-admin-icon-btn"
                    onClick={() => moveSection(secIdx, -1)}
                    title="Subir sección"
                    disabled={secIdx === 0}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="bf-admin-icon-btn"
                    onClick={() => moveSection(secIdx, 1)}
                    title="Bajar sección"
                    disabled={secIdx === value.length - 1}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    className="bf-admin-icon-btn is-danger"
                    title="Eliminar sección"
                    onClick={() => onChange(value.filter((s) => s.id !== sec.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </header>

              <div className="bf-admin-wiki-paragraphs">
                {(sec.paragraphs.length ? sec.paragraphs : [""]).map((para, paraIdx) => (
                  <div key={`${sec.id}-p-${paraIdx}`} className="bf-admin-wiki-paragraph-block">
                    <div className="bf-admin-wiki-paragraph-head">
                      <span className="bf-admin-wiki-paragraph-label">Párrafo {paraIdx + 1}</span>
                      <div className="bf-admin-wiki-paragraph-moves">
                        <button
                          type="button"
                          className="bf-admin-icon-btn"
                          title="Subir párrafo"
                          disabled={paraIdx === 0}
                          onClick={() => onChange(moveParagraph(value, secIdx, paraIdx, -1))}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="bf-admin-icon-btn"
                          title="Bajar párrafo"
                          disabled={paraIdx >= sec.paragraphs.length - 1}
                          onClick={() => onChange(moveParagraph(value, secIdx, paraIdx, 1))}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="bf-admin-icon-btn is-danger"
                          title="Quitar párrafo"
                          disabled={sec.paragraphs.length <= 1}
                          onClick={() => {
                            const paras = sec.paragraphs.filter((_, j) => j !== paraIdx);
                            onChange(
                              updateSection(value, secIdx, {
                                paragraphs: paras.length ? paras : [""],
                              }),
                            );
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="bf-admin-wiki-paragraph-input"
                      rows={4}
                      value={para}
                      placeholder="Escribe el texto de este párrafo…"
                      onChange={(e) =>
                        onChange(updateParagraph(value, secIdx, paraIdx, e.target.value))
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="bp-btn bp-btn-ghost bf-admin-wiki-add-para"
                  onClick={() =>
                    onChange(
                      updateSection(value, secIdx, {
                        paragraphs: [...sec.paragraphs, ""],
                      }),
                    )
                  }
                >
                  <Plus size={14} /> Añadir párrafo a esta sección
                </button>
              </div>

              {secIdx < value.length - 1 && (
                <div className="bf-admin-wiki-section-sep" aria-hidden>
                  <span>---</span>
                </div>
              )}
            </article>
          ))}

          <button
            type="button"
            className="bp-btn bp-btn-ghost bf-admin-wiki-add-section"
            onClick={() =>
              onChange([
                ...value,
                {
                  id: newSectionId(),
                  title: value.length === 0 ? "Historia" : "Nueva sección",
                  paragraphs: [""],
                },
              ])
            }
          >
            <Plus size={16} /> Añadir sección (nuevo bloque)
          </button>
        </div>
      )}
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
