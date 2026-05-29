"use client";

import { useState } from "react";
import { Download, Upload, FileSpreadsheet } from "lucide-react";

export function AdminImportPanel({ onDone }: { onDone?: () => void }) {
  const [teamsFile, setTeamsFile] = useState<File | null>(null);
  const [playersFile, setPlayersFile] = useState<File | null>(null);
  const [newsFile, setNewsFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamsFile && !playersFile && !newsFile) {
      setMsg("Elige al menos un CSV.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const form = new FormData();
      if (teamsFile) form.append("teams", teamsFile);
      if (playersFile) form.append("players", playersFile);
      if (newsFile) form.append("news", newsFile);
      const res = await fetch("/api/admin/import-csv", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      const parts = Object.entries(data.summary ?? {})
        .map(([k, v]) => {
          const s = v as { count: number; error?: string };
          return `${k}: ${s.count}${s.error ? ` (${s.error})` : ""}`;
        })
        .join(" · ");
      setMsg((data.message || "Importado") + (parts ? ` — ${parts}` : ""));
      onDone?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
    setLoading(false);
  }

  return (
    <div className="bf-admin-import">
      <div className="bf-admin-logo-help" role="note">
        <strong>¿No ves datos en Supabase?</strong>
        <p>
          Las tablas existen tras las migraciones SQL, pero empiezan <strong>vacías</strong> hasta que subas el
          catálogo. Puedes importar CSV aquí o en tu PC: <code>npm run supabase:export:csv</code> y luego{" "}
          <code>npm run supabase:import:csv</code> (necesita <code>SUPABASE_SERVICE_ROLE_KEY</code> en{" "}
          <code>.env.local</code>).
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: "var(--bp-dim)" }}>
          Tablas: <code>teams_catalog</code>, <code>players_catalog</code>, <code>news_catalog</code>. En el cuerpo
          de noticias usa <code>|||</code> entre párrafos. Plantillas en <code>plantillas/</code>.
        </p>
      </div>

      <div className="bf-admin-import-templates">
        <h3>
          <Download size={18} /> Plantillas CSV
        </h3>
        <p className="bf-admin-field-hint">Descarga, edita en Excel o Google Sheets y vuelve a subir.</p>
        <div className="bf-admin-import-links">
          <a href="/plantillas/teams.csv" download className="bp-btn bp-btn-ghost">
            teams.csv
          </a>
          <a href="/plantillas/players.csv" download className="bp-btn bp-btn-ghost">
            players.csv
          </a>
          <a href="/plantillas/news.csv" download className="bp-btn bp-btn-ghost">
            news.csv
          </a>
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} className="bf-admin-import-form">
        <h3>
          <Upload size={18} /> Subir CSV a Supabase
        </h3>
        <AdminFileRow
          label="Equipos (teams.csv)"
          hint="slug, name, tag, region, roster_slugs (jugadores separados por |)"
          onChange={setTeamsFile}
        />
        <AdminFileRow
          label="Jugadores (players.csv)"
          hint="slug, ign, team_slug, fantasy_points, bio, photo_url…"
          onChange={setPlayersFile}
        />
        <AdminFileRow
          label="Noticias (news.csv)"
          hint="slug, title, body con ||| entre párrafos"
          onChange={setNewsFile}
        />
        {msg && <div className={`bf-admin-toast ${msg.includes("Error") ? "is-error" : ""}`}>{msg}</div>}
        <button type="submit" className="bp-btn bp-btn-gold" disabled={loading} style={{ width: "100%" }}>
          <FileSpreadsheet size={16} /> Importar a Supabase
        </button>
      </form>
    </div>
  );
}

function AdminFileRow({
  label,
  hint,
  onChange,
}: {
  label: string;
  hint: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="bf-admin-import-file">
      <span className="bf-admin-import-file-label">{label}</span>
      <span className="bf-admin-field-hint">{hint}</span>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
