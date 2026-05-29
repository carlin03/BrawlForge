"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usesRemoteLogoPipeline } from "@/lib/data/local-logos";

const MIN_DIMENSION = 12;
const WHITE_THRESHOLD = 235;

export type LogoLoadStatus = "loading" | "ready" | "failed";

/** Rechaza PNG con fondo blanco (Liquipedia / local mal procesado) */
function hasWhiteBackground(img: HTMLImageElement): boolean {
  try {
    const w = Math.min(48, img.naturalWidth);
    const h = Math.min(48, img.naturalHeight);
    if (w < 4 || h < 4) return false;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let white = 0;
    let total = 0;
    const step = 4;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        total++;
        if (data[i] >= WHITE_THRESHOLD && data[i + 1] >= WHITE_THRESHOLD && data[i + 2] >= WHITE_THRESHOLD) {
          white++;
        }
      }
    }
    return total > 0 && white / total > 0.42;
  } catch {
    return false;
  }
}

export function useLogoImage(sources: string[]) {
  const key = useMemo(() => sources.join("\0"), [sources]);
  const imgRef = useRef<HTMLImageElement>(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<LogoLoadStatus>("loading");

  useEffect(() => {
    setIndex(0);
    setStatus(sources.length ? "loading" : "failed");
  }, [key, sources.length]);

  const src = sources[index];

  const advanceOrFail = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= sources.length) {
        setStatus("failed");
        return i;
      }
      setStatus("loading");
      return next;
    });
  }, [sources.length]);

  const acceptImage = useCallback(
    (img: HTMLImageElement) => {
      if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
        advanceOrFail();
        return;
      }
      const currentSrc = sources[index];
      const trusted =
        usesRemoteLogoPipeline() ||
        currentSrc?.startsWith("/logos/") ||
        currentSrc?.startsWith("/api/image") ||
        currentSrc?.startsWith("/api/logos/team/") ||
        currentSrc?.includes("taiyoro-prod-media.s3.amazonaws.com") ||
        currentSrc?.includes("cdn.royaleapi.com") ||
        currentSrc?.includes("upload.wikimedia.org") ||
        currentSrc?.includes("supabase.co") ||
        currentSrc?.includes("supabase.in") ||
        currentSrc?.includes("mitiendanube.com") ||
        currentSrc?.includes("eternalesports.org") ||
        currentSrc?.includes("mWB0X8mVG2.png");
      if (!trusted && hasWhiteBackground(img)) {
        advanceOrFail();
        return;
      }
      setStatus("ready");
    },
    [advanceOrFail, sources, index],
  );

  const onLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      acceptImage(e.currentTarget);
    },
    [acceptImage],
  );

  const onError = useCallback(() => {
    advanceOrFail();
  }, [advanceOrFail]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;
    if (img.complete) acceptImage(img);
  }, [src, index, acceptImage]);

  return { src, status, onLoad, onError, imgRef };
}
