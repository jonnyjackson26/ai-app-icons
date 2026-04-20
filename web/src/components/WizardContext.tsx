"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { PRESETS } from "@/lib/backgroundPresets";
import { DEFAULT_MODE_ID } from "@/lib/generationModes";
import type { ChatMessage } from "@/lib/chatTypes";
import type { AssetFile, BackgroundConfig } from "@/lib/types";

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
};

interface WizardContextValue {
  data: WizardData;
  update: (partial: Partial<WizardData>) => void;
  reset: () => void;
  appendMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WizardData>(initialData);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => setData(initialData), []);

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

  return (
    <WizardContext.Provider
      value={{ data, update, reset, appendMessage, updateMessage }}
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
