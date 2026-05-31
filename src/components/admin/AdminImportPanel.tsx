"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { AdminCsvTemplates } from "@/components/admin/AdminCsvTemplates";
import { AdminCsvImportGuide } from "@/components/admin/AdminCsvImportGuide";
import { getCsvTemplate } from "@/lib/admin/catalog-csv-schema";

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
          Catálogo BSC enriquecido: <code>npm run supabase:seed:catalog</code> (50 equipos, ~142 jugadores por región).
          Antes ejecuta en SQL Editor: <code>supabase/APPLY_CATALOG_ENRICHED.sql</code>. Tablas:{" "}
          <code>teams_catalog</code>, <code>players_catalog</code>.
        </p>
      </div>

      <AdminCsvTemplates />

      <form onSubmit={(e) => void submit(e)} className="bf-admin-import-form" id="bf-csv-upload-form">
        <h3>
          <Upload size={18} /> Subir CSV a Supabase
        </h3>
        <p className="bf-admin-field-hint" style={{ margin: "0 0 14px" }}>
          Puedes subir <strong>solo uno</strong> de los archivos (p. ej. un <code>teams.csv</code> con una sola
          fila para un equipo) o los tres a la vez.
        </p>
        <AdminFileRow
          label="Equipos (teams.csv)"
          hint={getCsvTemplate("teams")?.fields.filter((f) => f.required).map((f) => f.key).join(", ") ?? ""}
          onChange={setTeamsFile}
        />
        <AdminFileRow
          label="Jugadores (players.csv)"
          hint={getCsvTemplate("players")?.fields.filter((f) => f.required).map((f) => f.key).join(", ") ?? ""}
          onChange={setPlayersFile}
        />
        <AdminFileRow
          label="Noticias (news.csv)"
          hint="title, excerpt, body (párrafos con |||), related_teams"
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
