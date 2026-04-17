"use client";

import Link from "next/link";
import { REACHED, type Step } from "@/components/Wizard";
import { useWizard } from "@/components/WizardContext";

const STEPS = [
  { key: "describe", label: "Describe" },
  { key: "review", label: "Review" },
  { key: "background", label: "Background" },
  { key: "export", label: "Export" },
] as const;

const stepIndex: Record<Step, number> = {
  describe: 0,
  review: 1,
  background: 2,
  export: 3,
};

export default function StepIndicator({ current }: { current: Step }) {
  const activeIdx = stepIndex[current];
  const { data } = useWizard();

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const isActive = i === activeIdx;
        const completed = i < activeIdx; // user has moved past this step
        const reachable = REACHED[step.key](data); // clickable without redoing work
        const clickable = reachable && !isActive;

        let circleClass: string;
        if (isActive) {
          circleClass = "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-800";
        } else if (completed) {
          circleClass = "bg-blue-600 text-white";
        } else if (reachable) {
          // forward-reachable but not yet completed — show as outlined link, not a ✓
          circleClass = "border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent";
        } else {
          circleClass = "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400";
        }
        circleClass = `flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${circleClass}`;

        const labelClass = `hidden sm:inline text-xs ${
          isActive || completed
            ? "text-zinc-900 dark:text-zinc-100 font-medium"
            : reachable
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-400 dark:text-zinc-500"
        }`;

        const content = (
          <>
            <span className={circleClass}>
              {completed ? "\u2713" : i + 1}
            </span>
            <span className={labelClass}>{step.label}</span>
          </>
        );

        return (
          <div key={step.key} className="flex items-center gap-2">
            {clickable ? (
              <Link
                href={`?step=${step.key}`}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-2">{content}</div>
            )}
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 h-px ${
                  completed ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
