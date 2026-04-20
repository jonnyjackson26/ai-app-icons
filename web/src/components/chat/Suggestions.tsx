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
      <Chip
        label={thirdLabel}
        onClick={onThirdClick}
        variant={hasIcon ? "glowing" : "emphasis"}
      />
    </div>
  );
}

type ChipVariant = "default" | "emphasis" | "glowing";

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
    // Outer wrapper = animated conic/linear gradient; inner button sits on
    // top with a 2px gap, so only the border shows the animated gradient.
    return (
      <span
        className="relative inline-flex p-[2px] rounded-full"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #3b82f6)",
          backgroundSize: "300% 100%",
          animation: "gradient-border-shift 3s ease-in-out infinite",
        }}
      >
        <button
          type="button"
          onClick={onClick}
          className="rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer bg-white text-zinc-900 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {label}
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
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${styles}`}
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
