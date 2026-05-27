import Link from "next/link";

interface ForgeCardProps {
  title?: string;
  href?: string;
  linkLabel?: string;
  accent?: "yellow" | "blue" | "red" | "none";
  lift?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ForgeCard({
  title,
  href,
  linkLabel = "View all",
  accent = "none",
  lift = true,
  children,
  className = "",
}: ForgeCardProps) {
  const accentClass =
    accent === "yellow"
      ? "forge-card-accent-yellow"
      : accent === "blue"
        ? "forge-card-accent-blue"
        : accent === "red"
          ? "forge-card-accent-red"
          : "";

  return (
    <div className={`forge-card ${lift ? "forge-card-lift" : ""} ${accentClass} ${className}`}>
      {title && (
        <div className="forge-card-head">
          <span className="forge-section-title">{title}</span>
          {href && (
            <Link href={href} className="forge-link">
              {linkLabel} →
            </Link>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function ForgeSection({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="forge-section">
      <div className="forge-section-head">
        <h2 className="forge-section-title">{title}</h2>
        {href && (
          <Link href={href} className="forge-link">
            {linkLabel ?? "View all"} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
