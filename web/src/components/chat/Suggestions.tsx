"use client";

import { useEffect, useState } from "react";
import { APP_IDEAS, pickTwoRandom } from "@/lib/appIdeas";
import { REFINEMENT_HINTS } from "@/lib/refinementHints";

interface SuggestionsProps {
  hasIcon: boolean;
  onPickPrompt: (prompt: string) => void;
  onPickBackground: () => void;
  onAlreadyHaveIcon: () => void;
}

export default function Suggestions({
  hasIcon,
  onPickPrompt,
  onPickBackground,
  onAlreadyHaveIcon,
}: SuggestionsProps) {
  // Pick on the client only so SSR and first client render agree (Math.random
  // would otherwise produce a hydration mismatch). Reshuffles once when the
  // hasIcon boundary is crossed.
  const [picks, setPicks] = useState<[string, string] | null>(null);

  useEffect(() => {
    const pool = hasIcon ? REFINEMENT_HINTS : APP_IDEAS;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: Math.random must run client-side only to avoid SSR hydration mismatch
    setPicks(pickTwoRandom(pool));
  }, [hasIcon]);

  const thirdLabel = hasIcon
    ? "Looks good! Let's pick a background"
    : "I already have an icon, just want the asset generation";
  const onThirdClick = hasIcon ? onPickBackground : onAlreadyHaveIcon;

  return (
    <div className="grid grid-cols-3 gap-2 px-4 pb-2 max-w-2xl mx-auto w-full">
      {picks ? (
        <>
          <Chip label={picks[0]} onClick={() => onPickPrompt(picks[0])} />
          <Chip label={picks[1]} onClick={() => onPickPrompt(picks[1])} />
        </>
      ) : (
        <>
          <ChipSkeleton />
          <ChipSkeleton />
        </>
      )}
      <Chip
        label={thirdLabel}
        onClick={onThirdClick}
        variant={hasIcon ? "glowing" : "emphasis"}
      />
    </div>
  );
}

type ChipVariant = "default" | "emphasis" | "glowing";

const CHIP_BUTTON_BASE =
  "w-full h-full rounded-2xl px-4 py-3 text-sm font-medium text-center leading-snug transition-colors cursor-pointer";

function Chip({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: ChipVariant;
}) {
  if (variant === "glowing") {
    // Outer wrapper has animated gradient border + breathing scale/glow.
    // Inner button sits on top with a 2px gap so the animated gradient shows
    // through as the border.
    return (
      <span className="glowing-chip-wrapper relative inline-flex w-full h-full p-[2px] rounded-2xl">
        <button
          type="button"
          onClick={onClick}
          className={`${CHIP_BUTTON_BASE} group font-semibold bg-white text-zinc-900 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <span>{label}</span>
            <svg
              className="chip-arrow shrink-0 motion-safe:animate-[chip-arrow-nudge_1.4s_ease-in-out_infinite] group-hover:translate-x-0.5 transition-transform"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </span>
        </button>
      </span>
    );
  }

  const styles =
    variant === "emphasis"
      ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 dark:hover:bg-blue-950/70"
      : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${CHIP_BUTTON_BASE} ${styles}`}
    >
      {label}
    </button>
  );
}

function ChipSkeleton() {
  return (
    <div
      aria-hidden
      className="rounded-2xl h-full min-h-[60px] w-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 animate-pulse"
    />
  );
}
