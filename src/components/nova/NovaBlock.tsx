import Link from "next/link";
import type { ReactNode } from "react";

export function NovaBlock({
  title,
  href,
  linkText = "Ver todo →",
  children,
  tabs,
}: {
  title: string;
  href?: string;
  linkText?: string;
  children: ReactNode;
  tabs?: ReactNode;
}) {
  return (
    <section className="nv-block">
      <div className="nv-block-hd">
        <span className="nv-block-title">{title}</span>
        {href && (
          <Link href={href} className="nv-block-more">
            {linkText}
          </Link>
        )}
      </div>
      {tabs}
      {children}
    </section>
  );
}
