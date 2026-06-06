export function HomeSkeleton() {
  return (
    <div className="bf-home-ultra bf-page-ultra" aria-busy="true" aria-label="Cargando inicio">
      <div className="fu-hero fu-hero-live bf-home-hero" style={{ minHeight: 280 }}>
        <div className="fu-hero-grid">
          <div>
            <p className="fu-kicker">
              <span className="bp-live-dot" /> Brawl Stars Championship · 2026
            </p>
            <h1 className="fu-title">
              Brawl<em>Forge</em>
            </h1>
            <p className="fu-lead">Cargando el hub del circuito BSC 2026…</p>
          </div>
        </div>
      </div>
      <div className="fu-bento" style={{ marginTop: 24 }}>
        <section className="fu-panel fu-panel-glow fu-bento-matches">
          <div className="fu-panel-head">
            <h2>Centro de partidos</h2>
          </div>
          <div className="fu-match-stack">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.04)",
                  marginBottom: 8,
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
