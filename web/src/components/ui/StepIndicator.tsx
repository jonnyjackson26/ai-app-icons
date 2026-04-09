"use client";

import type { WizardStep } from "@/lib/types";

const STEPS = [
  { key: "describe", label: "Describe" },
  { key: "review", label: "Review" },
  { key: "background", label: "Background" },
  { key: "export", label: "Export" },
] as const;

const stepIndex: Record<WizardStep, number> = {
  describe: 0,
  generating: 0,
  review: 1,
  refining: 1,
  background: 2,
  exporting: 3,
  export: 3,
};

export default function StepIndicator({ current }: { current: WizardStep }) {
  const activeIdx = stepIndex[current];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
              i < activeIdx
                ? "bg-blue-600 text-white"
                : i === activeIdx
                ? "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-800"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {i < activeIdx ? "\u2713" : i + 1}
          </div>
          <span
            className={`hidden sm:inline text-xs ${
              i <= activeIdx
                ? "text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-px ${
                i < activeIdx
                  ? "bg-blue-600"
                  : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
