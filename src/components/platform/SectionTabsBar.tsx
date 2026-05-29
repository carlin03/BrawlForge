"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";

/** Logo de marca o entidad justo encima de las pestañas de filtro/sección. */
export function SectionTabsBar({
  children,
  entityLogo,
  className = "",
}: {
  children: ReactNode;
  entityLogo?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bf-section-tabs-bar ${className}`.trim()}>
      <div className="bf-section-tabs-brand">
        {entityLogo ?? (
          <Link href="/" className="bf-section-tabs-brand-link" aria-label="BrawlForge inicio">
            <BrandMark size={40} />
            <span className="bf-section-tabs-brand-text">
              Brawl<em>Forge</em>
            </span>
          </Link>
        )}
      </div>
      <div className="bf-section-tabs-row">{children}</div>
    </div>
  );
}
