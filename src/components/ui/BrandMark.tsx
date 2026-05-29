interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 36, className = "" }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="#151C2C" />
      <path
        d="M20 5L24.5 15.5H36L27 21.5L30 33L20 27L10 33L13 21.5L4 15.5H15.5L20 5Z"
        fill="url(#bf-mark)"
      />
      <defs>
        <linearGradient id="bf-mark" x1="4" y1="5" x2="36" y2="33">
          <stop stopColor="#FF4D5A" />
          <stop offset="0.55" stopColor="#ff4569" />
          <stop offset="1" stopColor="#e0354a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
