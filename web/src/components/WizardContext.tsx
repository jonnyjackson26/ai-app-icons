"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { PRESETS } from "@/lib/backgroundPresets";
import { DEFAULT_MODE_ID } from "@/lib/generationModes";
import type { ChatMessage } from "@/lib/chatTypes";
import type { AssetFile, BackgroundConfig } from "@/lib/types";

export const STEPS = ["chat", "background", "export"] as const;
export type Step = (typeof STEPS)[number];

export interface WizardData {
  mode: string;
  iconBase64: string | null;
  editMessage: string;
  backgroundConfig: BackgroundConfig;
  assets: AssetFile[] | null;
  expoConfig: Record<string, unknown> | null;
  backgroundColor: string | null;
  error: string | null;
  cliCallback: string | null;
  cliToken: string | null;
  cliProjectName: string | null;
  messages: ChatMessage[];
  currentStep: Step;
}

const initialData: WizardData = {
  mode: DEFAULT_MODE_ID,
  iconBase64: null,
  editMessage: "",
  backgroundConfig: {
    type: "gradient",
    colors: PRESETS[0].colors,
    direction: PRESETS[0].direction,
  },
  assets: null,
  expoConfig: null,
  backgroundColor: null,
  error: null,
  cliCallback: null,
  cliToken: null,
  cliProjectName: null,
  messages: [],
  currentStep: "chat",
};

interface WizardContextValue {
  data: WizardData;
  update: (partial: Partial<WizardData>) => void;
  reset: () => void;
  appendMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  setStep: (step: Step) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WizardData>(initialData);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  // Preserve CLI session across reset so "Create another icon" doesn't silently
  // drop the handoff mid-session. Step also resets to chat.
  const reset = useCallback(() => {
    setData((prev) => ({
      ...initialData,
      cliCallback: prev.cliCallback,
      cliToken: prev.cliToken,
      cliProjectName: prev.cliProjectName,
    }));
  }, []);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setData((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setData((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === id ? ({ ...m, ...patch } as ChatMessage) : m,
        ),
      }));
    },
    [],
  );

  const removeMessage = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      messages: prev.messages.filter((m) => m.id !== id),
    }));
  }, []);

  const setStep = useCallback((step: Step) => {
    setData((prev) => ({ ...prev, currentStep: step }));
  }, []);

  return (
    <WizardContext.Provider
      value={{
        data,
        update,
        reset,
        appendMessage,
        updateMessage,
        removeMessage,
        setStep,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}
