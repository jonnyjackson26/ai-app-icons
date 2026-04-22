"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import StepIndicator from "@/components/ui/StepIndicator";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ChatView from "@/components/chat/ChatView";
import BackgroundStep from "@/components/steps/BackgroundStep";
import ExportStep from "@/components/steps/ExportStep";
import { useWizard, type Step, type WizardData } from "@/components/WizardContext";

// What must be in context for the step's component to render safely.
// Used by the render-time coerce and the reconciler effect.
const REQUIRES: Record<Step, (d: WizardData) => boolean> = {
  chat: () => true,
  background: (d) => !!d.iconBase64,
  export: (d) => !!d.iconBase64,
};

// Whether a step is reachable via the step indicator without redoing work.
// Stricter than REQUIRES for export: clicking the export chip should only jump
// to cached assets, never silently trigger a fresh generation.
export const REACHED: Record<Step, (d: WizardData) => boolean> = {
  chat: () => true,
  background: (d) => !!d.iconBase64,
  export: (d) => !!d.assets,
};

function isLoopbackHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:") return false;
    return u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return false;
  }
}

export default function Wizard() {
  const params = useSearchParams();
  const { data, update, setStep } = useWizard();

  // Step is pure React state. Coerce at render time so we never flash an
  // invalid step (e.g. `background` when iconBase64 is null) for one frame.
  const step: Step = REQUIRES[data.currentStep](data) ? data.currentStep : "chat";

  // Reconciler: if state ever gets into an invalid step (e.g. after reset()
  // or if iconBase64 gets cleared out from under us), snap back to chat.
  useEffect(() => {
    if (!REQUIRES[data.currentStep](data)) {
      setStep("chat");
    }
  }, [data.currentStep, data.iconBase64, data, setStep]);

  // CLI-mode handoff: the CLI opens us with `?cli_callback=...&cli_token=...
  // &cli_project=...`. Read once into context; we never mutate the URL after.
  const cliCallbackRaw = params.get("cli_callback");
  const cliTokenRaw = params.get("cli_token");
  const cliProjectRaw = params.get("cli_project");

  useEffect(() => {
    console.log("[wizard] cli params:", {
      cli_callback: cliCallbackRaw,
      cli_token: cliTokenRaw ? `${cliTokenRaw.slice(0, 8)}...` : null,
    });
    if (!cliCallbackRaw || !cliTokenRaw) return;
    if (data.cliCallback === cliCallbackRaw && data.cliToken === cliTokenRaw) return;
    if (!isLoopbackHttpUrl(cliCallbackRaw)) {
      console.warn("Ignoring non-loopback cli_callback:", cliCallbackRaw);
      return;
    }
    update({
      cliCallback: cliCallbackRaw,
      cliToken: cliTokenRaw,
      cliProjectName: cliProjectRaw || null,
    });
    console.log("[wizard] CLI mode active");
  }, [cliCallbackRaw, cliTokenRaw, cliProjectRaw, data.cliCallback, data.cliToken, update]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="shrink-0">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              AI App Icons
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-tight">
              Generate app icon assets specifically for Expo apps
            </p>
          </div>
          <div className="flex-1 sm:flex sm:justify-end sm:items-center">
            <StepIndicator current={step} />
          </div>
        </div>
        {data.cliCallback && (
          <div className="max-w-4xl mx-auto mt-2 flex items-center justify-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Connected to{" "}
              <code className="font-mono">
                {data.cliProjectName || "your Expo project"}
              </code>
            </span>
          </div>
        )}
        {data.error && (
          <div className="max-w-2xl mx-auto mt-2">
            <ErrorMessage
              message={data.error}
              onDismiss={() => update({ error: null })}
            />
          </div>
        )}
      </header>

      {step === "chat" && <ChatView />}
      {step !== "chat" && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="w-full max-w-2xl mx-auto py-6">
            {step === "background" && data.iconBase64 && <BackgroundStep />}
            {step === "export" && data.iconBase64 && <ExportStep />}
          </div>
        </div>
      )}
    </div>
  );
}
