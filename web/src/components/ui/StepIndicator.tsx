"use client";

import { REACHED } from "@/components/Wizard";
import { useWizard, type Step } from "@/components/WizardContext";

const STEPS = [
  { key: "chat", label: "Create logo" },
  { key: "background", label: "Choose background" },
  { key: "export", label: "Export assets" },
] as const;

const stepIndex: Record<Step, number> = {
  chat: 0,
  background: 1,
  export: 2,
};

export default function StepIndicator({ current }: { current: Step }) {
  const activeIdx = stepIndex[current];
  const { data, setStep } = useWizard();

  return (
    <div className="flex items-center justify-center gap-2">
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
              <button
                type="button"
                onClick={() => setStep(step.key)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity bg-transparent"
              >
                {content}
              </button>
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
