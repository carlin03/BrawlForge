"use client";

function slugHue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % 360;
}

interface LogoPlaceholderProps {
  slug: string;
  kind?: "team" | "tournament";
  className?: string;
}

/** Escudo vectorial — sin iniciales ni texto */
export function LogoPlaceholder({ slug, kind = "team", className = "" }: LogoPlaceholderProps) {
  const hue = slugHue(slug);
  const accent = (hue + 48) % 360;
  const fill = `hsl(${hue} 58% 42%)`;
  const stroke = kind === "tournament" ? `hsl(${accent} 75% 55%)` : `hsl(${accent} 65% 52%)`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={`logo-placeholder ${className}`.trim()}
      aria-hidden
    >
      <rect width="64" height="64" rx="10" fill="#0f141f" />
      <path
        d="M32 6 L54 16 L48 52 L32 58 L16 52 L10 16 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <circle cx="32" cy="30" r="7" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}
