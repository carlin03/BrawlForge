/**
 * Pantalla de carga estática — primer paint sin React ni bundle JS.
 * CSS crítico también va en <head> del layout (fondo oscuro al instante).
 */
const BOOT_CSS = `
html.bf-boot-loading,html.bf-boot-loading body{overflow:hidden}
#bf-instant-boot{
  position:fixed;inset:0;z-index:2147483646;
  display:flex;align-items:center;justify-content:center;
  background:#06080e;color:#f4f4f5;
  font-family:system-ui,-apple-system,Segoe UI,sans-serif;
  transition:opacity .45s ease,visibility .45s ease;
}
#bf-instant-boot.is-done{opacity:0;visibility:hidden;pointer-events:none}
#bf-instant-boot-inner{text-align:center;padding:28px 24px;max-width:360px;width:min(360px,92vw)}
#bf-instant-boot-brand{
  margin:0 0 14px;font-size:26px;font-weight:800;letter-spacing:.06em;
  color:#f3bc18;text-transform:uppercase;
}
#bf-instant-boot-text{margin:0;font-size:16px;font-weight:700;color:#fff}
#bf-instant-boot-pct{
  margin:10px 0 0;font-size:40px;font-weight:800;color:#f3bc18;
  font-variant-numeric:tabular-nums;
}
#bf-instant-boot-bar{
  margin:16px auto 12px;width:100%;height:6px;border-radius:999px;
  background:rgba(255,255,255,.08);overflow:hidden;
  border:1px solid rgba(255,200,46,.12);
}
#bf-instant-boot-bar-fill{
  display:block;height:100%;width:0;border-radius:inherit;
  background:linear-gradient(90deg,#c99712,#f3bc18,#ffe566);
  box-shadow:0 0 12px rgba(243,188,24,.45);
  transition:width .15s linear;
}
#bf-instant-boot-hint{margin:0;font-size:12px;font-weight:500;color:rgba(255,255,255,.42);line-height:1.45}
`;

export const INSTANT_CRITICAL_CSS = `
html,body{background:#0a0c12!important;color:#f4f4f5!important;margin:0;min-height:100%}
${BOOT_CSS}
`;

const BOOT_JS = `
(function(){
  var root=document.documentElement;
  root.classList.add('bf-boot-loading');
  var el=document.getElementById('bf-instant-boot');
  var bar=document.getElementById('bf-instant-boot-bar-fill');
  var pct=document.getElementById('bf-instant-boot-pct');
  var hint=document.getElementById('bf-instant-boot-hint');
  var p=0,t0=Date.now(),handoff=false,done=false;
  function setPct(v){
    p=Math.min(100,Math.max(0,v));
    if(bar)bar.style.width=p+'%';
    if(pct)pct.textContent=Math.round(p)+'%';
  }
  function tick(){
    if(done)return;
    var elapsed=Date.now()-t0;
    if(!handoff){
      var target=Math.min(94,8+elapsed/28);
      if(p<target)setPct(target);
    }
  }
  setInterval(tick,50);
  tick();
  window.__bfBootHandoff=function(v){
    handoff=true;
    if(typeof v==='number')setPct(Math.max(p,v));
  };
  window.__bfBootSetLabel=function(txt){
    var n=document.getElementById('bf-instant-boot-text');
    if(n&&txt)n.textContent=txt;
  };
  window.__bfBootDone=function(){
    if(done||!el)return;
    done=true;
    setPct(100);
    el.classList.add('is-done');
    setTimeout(function(){
      if(el&&el.parentNode)el.parentNode.removeChild(el);
      root.classList.remove('bf-boot-loading');
    },480);
  };
  setTimeout(function(){
    if(!handoff&&hint)hint.textContent='Descargando la app…';
  },1500);
  setTimeout(function(){
    if(!handoff&&hint)hint.textContent='Conexión lenta — seguimos cargando…';
  },5000);
  setTimeout(function(){
    if(!done)window.__bfBootDone();
  },8000);
})();
`;

export function InstantBootShell() {
  return (
    <>
      <div
        id="bf-instant-boot"
        role="status"
        aria-live="polite"
        aria-label="Cargando BrawlForge"
      >
        <div id="bf-instant-boot-inner">
          <p id="bf-instant-boot-brand">BrawlForge</p>
          <p id="bf-instant-boot-text">Preparando la web…</p>
          <p id="bf-instant-boot-pct" aria-hidden>
            1%
          </p>
          <div id="bf-instant-boot-bar" aria-hidden>
            <span id="bf-instant-boot-bar-fill" style={{ width: "1%" }} />
          </div>
          <p id="bf-instant-boot-hint">Cargando al instante…</p>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT_JS }} />
    </>
  );
}
