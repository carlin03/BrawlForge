(function () {
  var root = document.documentElement;
  root.classList.add("bf-boot-loading");
  var el = document.getElementById("bf-instant-boot");
  var bar = document.getElementById("bf-instant-boot-bar-fill");
  var pct = document.getElementById("bf-instant-boot-pct");
  var hint = document.getElementById("bf-instant-boot-hint");
  var p = 1,
    t0 = Date.now(),
    handoff = false,
    done = false;

  function setPct(v) {
    p = Math.min(100, Math.max(0, v));
    if (bar) bar.style.width = p + "%";
    if (pct) pct.textContent = Math.round(p) + "%";
  }

  function tick() {
    if (done) return;
    var elapsed = Date.now() - t0;
    if (!handoff) {
      var target = Math.min(94, 8 + elapsed / 28);
      if (p < target) setPct(target);
    }
  }

  setInterval(tick, 50);
  tick();

  window.__bfBootHandoff = function (v) {
    handoff = true;
    if (typeof v === "number") setPct(Math.max(p, v));
  };
  window.__bfBootSetLabel = function (txt) {
    var n = document.getElementById("bf-instant-boot-text");
    if (n && txt) n.textContent = txt;
  };
  window.__bfBootDone = function () {
    if (done || !el) return;
    done = true;
    setPct(100);
    el.classList.add("is-done");
    setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      root.classList.remove("bf-boot-loading");
    }, 480);
  };

  setTimeout(function () {
    if (!handoff && hint) hint.textContent = "Descargando la app…";
  }, 1500);
  setTimeout(function () {
    if (!handoff && hint) hint.textContent = "Conexión lenta — puedes usar los enlaces de abajo.";
  }, 4000);
  setTimeout(function () {
    if (!done) window.__bfBootDone();
  }, 4500);
})();
