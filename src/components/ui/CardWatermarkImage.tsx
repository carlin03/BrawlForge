"use client";

import { useEffect, useState } from "react";
import { cardImageSrcCandidates } from "@/lib/data/card-theme-meta";

export function CardWatermarkImage({
  url,
  className = "",
}: {
  url: string;
  className?: string;
}) {
  const candidates = cardImageSrcCandidates(url);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setFailed(false);
  }, [url]);

  const src = candidates[idx];
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className={`${className} ${failed ? "is-broken" : ""}`.trim()}
      onLoad={() => setFailed(false)}
      onError={() => {
        if (idx < candidates.length - 1) {
          setIdx((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
