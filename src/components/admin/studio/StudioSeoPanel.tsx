"use client";

import { useState } from "react";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioSeoPanel() {
  const [title, setTitle] = useState("BrawlForge — Fantasy & Predictions BSC");
  const [description, setDescription] = useState(
    "Fantasy, predicciones y seguimiento competitivo de Brawl Stars.",
  );
  const [msg, setMsg] = useState("");

  async function save() {
    const res = await fetch("/api/cms/admin/seo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalSeo: { title, description, themeColor: "#0a0c12" } }),
    });
    const data = await res.json();
    setMsg(res.ok ? data.message : data.error);
  }

  return (
    <StudioModulePanel
      title="SEO & Routing (Fase 3)"
      description="Meta global, redirects y announcement bars."
      apiPath="/api/cms/admin/seo"
    >
      {() => (
        <>
          <div className="bf-studio-form-grid">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <button type="button" className="bp-btn bp-btn-gold" onClick={save}>
            Guardar SEO global
          </button>
          {msg && <p className="bf-studio-msg">{msg}</p>}
        </>
      )}
    </StudioModulePanel>
  );
}
