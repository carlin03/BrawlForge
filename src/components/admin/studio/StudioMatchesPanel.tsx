"use client";

import { useState } from "react";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioMatchesPanel() {
  const [form, setForm] = useState({
    id: "",
    tournament_slug: "bsc-2026-challengers-spain",
    team_a_slug: "",
    team_b_slug: "",
    scheduled_at: new Date().toISOString().slice(0, 16),
    status: "upcoming",
  });
  const [msg, setMsg] = useState("");

  async function saveMatch() {
    setMsg("");
    const res = await fetch("/api/cms/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match: { ...form, scheduled_at: new Date(form.scheduled_at).toISOString() } }),
    });
    const data = await res.json();
    setMsg(res.ok ? data.message : data.error);
  }

  return (
    <StudioModulePanel
      title="Partidos (Fase 1)"
      description="CRUD en matches_catalog. La web usa legacy hasta activar cms.matches.enabled."
      apiPath="/api/cms/admin/matches"
    >
      {(data, reload) => (
        <>
          <div className="bf-studio-form-grid">
            <input placeholder="id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            <input
              placeholder="tournament_slug"
              value={form.tournament_slug}
              onChange={(e) => setForm({ ...form, tournament_slug: e.target.value })}
            />
            <input
              placeholder="team_a_slug"
              value={form.team_a_slug}
              onChange={(e) => setForm({ ...form, team_a_slug: e.target.value })}
            />
            <input
              placeholder="team_b_slug"
              value={form.team_b_slug}
              onChange={(e) => setForm({ ...form, team_b_slug: e.target.value })}
            />
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="upcoming">upcoming</option>
              <option value="live">live</option>
              <option value="finished">finished</option>
            </select>
          </div>
          <button type="button" className="bp-btn bp-btn-gold" onClick={saveMatch}>
            Guardar partido
          </button>
          {msg && <p className="bf-studio-msg">{msg}</p>}
          <p className="bf-studio-muted">{(data.matches as unknown[])?.length ?? 0} partidos en DB</p>
          <button type="button" className="bp-btn bp-btn-ghost" onClick={reload}>
            Recargar lista
          </button>
        </>
      )}
    </StudioModulePanel>
  );
}
