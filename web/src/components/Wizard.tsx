"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StepIndicator from "@/components/ui/StepIndicator";
import ErrorMessage from "@/components/ui/ErrorMessage";
import DescribeStep from "@/components/steps/DescribeStep";
import ReviewStep from "@/components/steps/ReviewStep";
import BackgroundStep from "@/components/steps/BackgroundStep";
import ExportStep from "@/components/steps/ExportStep";
import { useWizard, type WizardData } from "@/components/WizardContext";

export const STEPS = ["describe", "review", "background", "export"] as const;
export type Step = (typeof STEPS)[number];

// What must be in context for the step's component to render safely.
// Used to guard deep-links — ?step=X with insufficient state redirects to describe.
const REQUIRES: Record<Step, (d: WizardData) => boolean> = {
  describe: () => true,
  review: (d) => !!d.iconBase64,
  background: (d) => !!d.iconBase64,
  export: (d) => !!d.iconBase64,
};

// Whether a step is reachable via the step indicator without redoing work.
// Stricter than REQUIRES for export: clicking the export chip should only jump
// to cached assets, never silently trigger a fresh generation.
export const REACHED: Record<Step, (d: WizardData) => boolean> = {
  describe: () => true,
  review: (d) => !!d.iconBase64,
  background: (d) => !!d.iconBase64,
  export: (d) => !!d.assets,
};

function isStep(value: string | null): value is Step {
  return value !== null && (STEPS as readonly string[]).includes(value);
}

export default function Wizard() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data, update } = useWizard();

  const raw = params.get("step");
  const requested: Step = isStep(raw) ? raw : "describe";
  const canRender = REQUIRES[requested](data);
  const step: Step = canRender ? requested : "describe";

  useEffect(() => {
    if (!canRender) {
      router.replace(`${pathname}?step=describe`);
    }
  }, [canRender, pathname, router]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepIndicator current={step} />

      {data.error && (
        <div className="mb-6">
          <ErrorMessage
            message={data.error}
            onDismiss={() => update({ error: null })}
          />
        </div>
      )}

      {step === "describe" && <DescribeStep />}
      {step === "review" && data.iconBase64 && <ReviewStep />}
      {step === "background" && data.iconBase64 && <BackgroundStep />}
      {step === "export" && data.iconBase64 && <ExportStep />}
    </div>
  );
}
