"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StepIndicator from "@/components/ui/StepIndicator";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ChatView from "@/components/chat/ChatView";
import BackgroundStep from "@/components/steps/BackgroundStep";
import ExportStep from "@/components/steps/ExportStep";
import { useWizard, type WizardData } from "@/components/WizardContext";

export const STEPS = ["chat", "background", "export"] as const;
export type Step = (typeof STEPS)[number];

// What must be in context for the step's component to render safely.
// Used to guard deep-links — ?step=X with insufficient state redirects to chat.
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

function isStep(value: string | null): value is Step {
  return value !== null && (STEPS as readonly string[]).includes(value);
}

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
  const pathname = usePathname();
  const router = useRouter();
  const { data, update } = useWizard();

  const raw = params.get("step");
  const requested: Step = isStep(raw) ? raw : "chat";
  const canRender = REQUIRES[requested](data);
  const step: Step = canRender ? requested : "chat";

  const cliCallbackRaw = params.get("cli_callback");
  const cliTokenRaw = params.get("cli_token");
  const cliProjectRaw = params.get("cli_project");

  useEffect(() => {
    if (!canRender) {
      router.replace(`${pathname}?step=chat`);
    }
  }, [canRender, pathname, router]);

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

  const chrome = (
    <>
      {data.cliCallback && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            Connected to{" "}
            <code className="font-mono">
              {data.cliProjectName || "your Expo project"}
            </code>
          </span>
        </div>
      )}
      <StepIndicator current={step} />
      {data.error && (
        <div className="mb-4 max-w-2xl mx-auto w-full">
          <ErrorMessage
            message={data.error}
            onDismiss={() => update({ error: null })}
          />
        </div>
      )}
    </>
  );

  if (step === "chat") {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <div className="pt-4">{chrome}</div>
        <ChatView />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto py-6">
        {chrome}
        {step === "background" && data.iconBase64 && <BackgroundStep />}
        {step === "export" && data.iconBase64 && <ExportStep />}
      </div>
    </div>
  );
}
