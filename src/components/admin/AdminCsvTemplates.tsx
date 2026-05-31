"use client";

import { useState } from "react";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  Newspaper,
  Table2,
  Trophy,
  Calendar,
  Swords,
  TrendingUp,
  ListChecks,
} from "lucide-react";
import {
  CSV_TEMPLATES,
  CSV_TEMPLATE_GROUPS,
  type CsvTemplateDef,
  type CsvTemplateIcon,
} from "@/lib/admin/catalog-csv-schema";

const ICONS: Record<CsvTemplateIcon, typeof Users> = {
  teams: Users,
  players: User,
  news: Newspaper,
  tournaments: Trophy,
  rosters: ListChecks,
  matches: Calendar,
  fantasy: TrendingUp,
};

function TemplateCard({ template }: { template: CsvTemplateDef }) {
  const [open, setOpen] = useState(template.id === "teams");
  const Icon = ICONS[template.icon];

  return (
    <article className={`bf-csv-card ${open ? "is-open" : ""}`}>
      <header className="bf-csv-card-head">
        <div className="bf-csv-card-icon" aria-hidden>
          <Icon size={22} />
        </div>
        <div className="bf-csv-card-titles">
          <h3>{template.title}</h3>
          <p>{template.subtitle}</p>
          <span className="bf-csv-card-meta">
            <code>{template.filename}</code> → <code>{template.table}</code>
          </span>
        </div>
        <a
          href={`/plantillas/${template.filename}`}
          download
          className="bp-btn bp-btn-gold bf-csv-dl"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={16} /> Descargar
        </a>
        <button
          type="button"
          className="bf-csv-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </header>

      {open && (
        <div className="bf-csv-card-body">
          <p className="bf-csv-card-note">
            El CSV incluye <strong>comentarios</strong> (<code>#</code>), una fila <code>_ayuda</code> con
            descripción de cada columna y una fila <code>_ejemplo</code> que no se importa. Los datos reales van
            debajo.
          </p>

          <div className="bf-csv-preview">
            <span className="bf-csv-preview-label">
              <Table2 size={14} /> Vista previa (ejemplo)
            </span>
            <div className="bf-csv-preview-card">
              {template.id === "teams" && (
                <>
                  <div className="bf-csv-preview-tag">EMEA · #1</div>
                  <h4>SK Gaming</h4>
                  <p>
                    SK Gaming es uno de los clubes históricos del BSC 2026. Esta descripción aparece en la ficha
                    pública del equipo.
                  </p>
                  <div className="bf-csv-preview-chips">yoshi · nowy297 · ope</div>
                </>
              )}
              {template.id === "players" && (
                <>
                  <div className="bf-csv-preview-tag">SK Gaming · 92 pts</div>
                  <h4>Yoshi</h4>
                  <p>Jugador estrella de SK Gaming. Capitán habitual en Monthly Finals.</p>
                  <div className="bf-csv-preview-chips">Antes: fut-esports · tribe-gaming</div>
                </>
              )}
              {template.id === "tournaments" && (
                <>
                  <div className="bf-csv-preview-tag">EMEA · Tier 1</div>
                  <h4>Brawl Cup 2026</h4>
                  <p>16 equipos · $100,000 · Berlin</p>
                  <div className="bf-csv-preview-chips">hmble · sk-gaming · fut-esports</div>
                </>
              )}
              {template.id === "tournament_rosters" && (
                <>
                  <div className="bf-csv-preview-tag">bsc-2026-brawl-cup</div>
                  <h4>SK Gaming</h4>
                  <div className="bf-csv-preview-chips">yoshi · nowy297 · ope</div>
                </>
              )}
              {template.id === "matches" && (
                <>
                  <div className="bf-csv-preview-tag">
                    <Swords size={12} /> Bo5 · upcoming
                  </div>
                  <h4>HMBLE vs SK Gaming</h4>
                  <p>Grand Final · 29 may 2026</p>
                </>
              )}
              {template.id === "news" && (
                <>
                  <span className="bf-csv-preview-hot">Hot</span>
                  <div className="bf-csv-preview-tag">Resultados · 4 min</div>
                  <h4>HMBLE conquista el Brawl Cup 2026</h4>
                  <p>La gran final dejó al campeón europeo en lo más alto del circuito.</p>
                </>
              )}
              {template.id === "fantasy_market" && (
                <>
                  <div className="bf-csv-preview-tag">9.5 cr · +0.2</div>
                  <h4>Yoshi</h4>
                  <p>SK Gaming · 28% pick rate · W W L</p>
                </>
              )}
            </div>
          </div>

          <div className="bf-csv-fields-wrap">
            <table className="bf-csv-fields">
              <thead>
                <tr>
                  <th>Columna</th>
                  <th>Qué es</th>
                  <th>Ejemplo</th>
                </tr>
              </thead>
              <tbody>
                {template.fields.map((f) => (
                  <tr key={f.key}>
                    <td>
                      <code>{f.key}</code>
                      {f.required && <span className="bf-csv-req">obligatorio</span>}
                    </td>
                    <td>{f.description}</td>
                    <td>
                      <code className="bf-csv-ex">{f.example}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}

export function AdminCsvTemplates() {
  return (
    <section className="bf-csv-hub">
      <header className="bf-csv-hub-head">
        <h2 className="bf-admin-section-title">Plantillas CSV</h2>
        <p className="bf-admin-meta">
          Siete archivos distintos: equipos, jugadores, torneos, plantillas por torneo, partidos, noticias y mercado
          fantasy. Descarga, edita en Excel o Google Sheets y sube abajo solo los que necesites.
        </p>
        <a href="/plantillas" className="bf-home-link" target="_blank" rel="noopener noreferrer">
          Abrir guía pública →
        </a>
      </header>
      {CSV_TEMPLATE_GROUPS.map((group) => (
        <div key={group.id} className="bf-csv-group">
          <h3 className="bf-csv-group-title">{group.title}</h3>
          {group.note && <p className="bf-admin-field-hint bf-csv-group-note">{group.note}</p>}
          <div className="bf-csv-cards">
            {CSV_TEMPLATES.filter((t) => t.group === group.id).map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
