import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PanelProps {
  title: string;
  href?: string;
  linkLabel?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, href, linkLabel = "Ver todo", badge, children, className = "" }: PanelProps) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div className="flex items-center gap-2">
          <h3>{title}</h3>
          {badge}
        </div>
        {href && (
          <Link href={href} className="link-more flex items-center gap-0.5">
            {linkLabel} <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
}

export function PageHeader({ title, subtitle, meta }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {meta}
    </header>
  );
}
