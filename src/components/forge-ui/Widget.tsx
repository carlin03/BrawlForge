import Link from "next/link";
import type { ReactNode } from "react";

interface WidgetProps {
  title: string;
  href?: string;
  linkText?: string;
  children: ReactNode;
  tabs?: ReactNode;
}

export function Widget({ title, href, linkText = "Ver todo →", children, tabs }: WidgetProps) {
  return (
    <section className="x-widget">
      <div className="x-widget-hd">
        <span className="x-widget-title">{title}</span>
        {href && (
          <Link href={href} className="x-widget-more">
            {linkText}
          </Link>
        )}
      </div>
      {tabs}
      {children}
    </section>
  );
}
