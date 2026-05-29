"use client";

import { useState } from "react";
import { StudioModulePanel } from "./StudioModulePanel";

export function StudioMediaPanel() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  async function add() {
    const res = await fetch("/api/cms/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "asset", public_url: url }),
    });
    const data = await res.json();
    setMsg(res.ok ? data.message : data.error);
  }

  return (
    <StudioModulePanel
      title="Media DAM (Fase 8)"
      description="Registro de assets por URL. Activa cms.media.enabled."
      apiPath="/api/cms/admin/media"
    >
      {() => (
        <>
          <div className="bf-studio-form-grid">
            <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="URL pública" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <button type="button" className="bp-btn bp-btn-gold" onClick={add}>
            Registrar asset
          </button>
          {msg && <p className="bf-studio-msg">{msg}</p>}
        </>
      )}
    </StudioModulePanel>
  );
}
