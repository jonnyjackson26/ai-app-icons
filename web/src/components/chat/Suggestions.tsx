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
    <div className="flex flex-wrap gap-2 px-4 pb-2 max-w-2xl mx-auto w-full">
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
      <Chip label={thirdLabel} onClick={onThirdClick} emphasis />
    </div>
  );
}

function Chip({
  label,
  onClick,
  emphasis = false,
}: {
  label: string;
  onClick: () => void;
  emphasis?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
        emphasis
          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 dark:hover:bg-blue-950/70"
          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}

function ChipSkeleton() {
  return (
    <div
      aria-hidden
      className="rounded-full h-7 w-40 bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 animate-pulse"
    />
  );
}
