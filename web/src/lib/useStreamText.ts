"use client";

import { useEffect } from "react";

interface Options {
  charsPerTick?: number;
  intervalMs?: number;
  enabled?: boolean;
}

export function useStreamText(
  target: string,
  onChunk: (partial: string) => void,
  onDone?: () => void,
  { charsPerTick = 2, intervalMs = 25, enabled = true }: Options = {},
) {
  useEffect(() => {
    if (!enabled) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      onChunk(target);
      onDone?.();
      return;
    }

    let cursor = 0;
    const id = window.setInterval(() => {
      cursor = Math.min(cursor + charsPerTick, target.length);
      onChunk(target.slice(0, cursor));
      if (cursor >= target.length) {
        window.clearInterval(id);
        onDone?.();
      }
    }, intervalMs);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled]);
}
