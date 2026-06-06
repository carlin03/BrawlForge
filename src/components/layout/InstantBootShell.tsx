/**
 * Loader estático — progreso por CSS (sin JS) + bf-boot.js opcional.
 */
const BOOT_CSS = `
html.bf-boot-loading,html.bf-boot-loading body{overflow:hidden}
#bf-instant-boot{
  position:fixed;inset:0;z-index:2147483646;
  display:flex;align-items:center;justify-content:center;
  background:#06080e;color:#f4f4f5;
  font-family:system-ui,-apple-system,Segoe UI,sans-serif;
  animation:bfBootFadeOut 0.5s ease 4.2s forwards;
  pointer-events:none;
}
@keyframes bfBootFadeOut{
  to{opacity:0;visibility:hidden}
}
#bf-instant-boot-inner{text-align:center;padding:28px 24px;max-width:360px;width:min(360px,92vw)}
#bf-instant-boot-brand{
  margin:0 0 14px;font-size:26px;font-weight:800;letter-spacing:.06em;
  color:#f3bc18;text-transform:uppercase;
}
#bf-instant-boot-text{margin:0;font-size:16px;font-weight:700;color:#fff}
#bf-instant-boot-pct{
  margin:10px 0 0;font-size:40px;font-weight:800;color:#f3bc18;
  font-variant-numeric:tabular-nums;
  animation:bfBootPct 3.5s ease-out forwards;
}
@keyframes bfBootPct{
  0%{content:none}
}
#bf-instant-boot-bar{
  margin:16px auto 12px;width:100%;height:6px;border-radius:999px;
  background:rgba(255,255,255,.08);overflow:hidden;
  border:1px solid rgba(255,200,46,.12);
}
#bf-instant-boot-bar-fill{
  display:block;height:100%;width:8%;border-radius:inherit;
  background:linear-gradient(90deg,#c99712,#f3bc18,#ffe566);
  box-shadow:0 0 12px rgba(243,188,24,.45);
  animation:bfBootBar 3.8s ease-out forwards;
}
@keyframes bfBootBar{
  0%{width:8%}
  100%{width:92%}
}
#bf-instant-boot-hint{margin:0;font-size:12px;font-weight:500;color:rgba(255,255,255,.42);line-height:1.45}
#bf-static-home{
  min-height:100vh;padding:24px 20px 48px;
  font-family:system-ui,-apple-system,Segoe UI,sans-serif;
  color:#f4f4f5;background:#0a0c12;
}
.bf-static-home-brand{font-size:28px;font-weight:800;color:#f3bc18;margin:0 0 8px;letter-spacing:.04em}
.bf-static-home-tag{margin:0 0 24px;color:rgba(255,255,255,.55);font-size:14px}
.bf-static-home-nav{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}
.bf-static-home-nav a{
  padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;
  background:rgba(255,255,255,.06);border:1px solid rgba(243,188,24,.2);color:#fff;
}
.bf-static-home-hint{margin:0;font-size:12px;color:rgba(255,255,255,.4)}
`;

export const INSTANT_CRITICAL_CSS = `
html,body{background:#0a0c12!important;color:#f4f4f5!important;margin:0;min-height:100%}
${BOOT_CSS}
`;

export function InstantBootShell() {
  return (
    <div id="bf-instant-boot" role="status" aria-live="polite" aria-label="Cargando BrawlForge">
      <div id="bf-instant-boot-inner">
        <p id="bf-instant-boot-brand">BrawlForge</p>
        <p id="bf-instant-boot-text">Preparando la web…</p>
        <p id="bf-instant-boot-pct" aria-hidden>
          8%
        </p>
        <div id="bf-instant-boot-bar" aria-hidden>
          <span id="bf-instant-boot-bar-fill" />
        </div>
        <p id="bf-instant-boot-hint">Entra en unos segundos — enlaces abajo ya funcionan.</p>
      </div>
    </div>
  );
}
