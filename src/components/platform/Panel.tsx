import Link from "next/link";
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  href?: string;
  linkLabel?: string;
  accent?: "blue" | "gold" | "red";
  children: ReactNode;
  padded?: boolean;
}

export function Panel({ title, href, linkLabel = "Ver todo →", accent, children, padded }: PanelProps) {
  const hdClass = accent === "gold" ? "es-panel-hd-gold" : accent === "red" ? "es-panel-hd-red" : "";

  return (
    <section className="es-panel">
      <div className={`es-panel-hd ${hdClass}`}>
        <h2 className="es-panel-title">{title}</h2>
        {href && (
          <Link href={href} className="es-panel-link">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className={padded ? "es-panel-body es-panel-body-pad" : "es-panel-body"}>{children}</div>
    </section>
  );
}
