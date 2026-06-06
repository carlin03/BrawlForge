import Link from "next/link";

/** Home mínima en HTML — visible sin JavaScript (móvil lento). */
export function StaticHomeFallback() {
  return (
    <div id="bf-static-home" className="bf-static-home">
      <header className="bf-static-home-header">
        <p className="bf-static-home-brand">BrawlForge</p>
        <p className="bf-static-home-tag">Brawl Stars Championship · 2026</p>
      </header>
      <nav className="bf-static-home-nav" aria-label="Acceso rápido">
        <Link href="/matches">Partidos</Link>
        <Link href="/tournaments">Torneos</Link>
        <Link href="/teams">Equipos</Link>
        <Link href="/fantasy">Fantasy</Link>
        <Link href="/predictions">Predicciones</Link>
        <Link href="/news">Noticias</Link>
      </nav>
      <p className="bf-static-home-hint">La versión completa carga en segundo plano…</p>
    </div>
  );
}
