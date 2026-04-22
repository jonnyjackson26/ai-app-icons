"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { PRESETS } from "@/lib/backgroundPresets";
import { DEFAULT_MODE_ID } from "@/lib/generationModes";
import type { ChatMessage } from "@/lib/chatTypes";
import type { ChatDetailDto, ChatRow } from "@/lib/chatDb";
import type { AssetFile, BackgroundConfig } from "@/lib/types";

export const STEPS = ["chat", "background", "export"] as const;
export type Step = (typeof STEPS)[number];

export interface WizardData {
  mode: string;
  // Base64 of the current editable icon (feeds the edit API). Either base64 or
  // url is set on a hydrated chat; both can coexist during an active session.
  iconBase64: string | null;
  iconUrl: string | null;
  // Storage path of the current icon (used when PATCHing chats.current_icon_path).
  iconPath: string | null;
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
  // Null when anonymous / no chat has been created yet. Set once we either
  // navigate to /c/[id] (hydrate) or lazy-create from the first message.
  chatId: string | null;
  // True while we're swapping data wholesale on route transition. ChatView's
  // welcome-stream effect skips itself when this is true OR messages is non-empty.
  isHydrating: boolean;
}

const initialData: WizardData = {
  mode: DEFAULT_MODE_ID,
  iconBase64: null,
  iconUrl: null,
  iconPath: null,
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
  chatId: null,
  isHydrating: false,
};

interface WizardContextValue {
  data: WizardData;
  update: (partial: Partial<WizardData>) => void;
  reset: () => void;
  appendMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  setStep: (step: Step) => void;
  hydrate: (dto: ChatDetailDto) => void;
  setChatId: (id: string | null) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

// Map a DB message row to the in-memory ChatMessage shape. Lossy in one
// direction (cta.onClick is a fn — we always re-hydrate without it; only
// cta.href survives the DB round-trip).
function messageFromDb(row: ChatDetailDto["messages"][number]): ChatMessage {
  const url = row.imageSignedUrl ?? undefined;
  if (row.role === "assistant" && row.kind === "text") {
    return {
      id: row.id,
      role: "assistant",
      kind: "text",
      content: row.content ?? "",
      tone: row.tone === "error" ? "error" : undefined,
      cta: row.cta ? { label: row.cta.label, href: row.cta.href } : undefined,
    };
  }
  if (row.role === "assistant" && row.kind === "icon") {
    return {
      id: row.id,
      role: "assistant",
      kind: "icon",
      iconUrl: url,
      imagePath: row.imagePath ?? undefined,
      caption: row.caption ?? undefined,
    };
  }
  if (row.role === "user" && row.kind === "text") {
    return {
      id: row.id,
      role: "user",
      kind: "text",
      content: row.content ?? "",
    };
  }
  // user + attach
  return {
    id: row.id,
    role: "user",
    kind: "attach",
    imageUrl: url,
    imagePath: row.imagePath ?? undefined,
    instruction: row.instruction ?? "",
  };
}

// DB chat row + messages → a fresh WizardData. Preserves CLI session so a
// CLI-connected user navigating between chats keeps the handoff alive.
function dataFromDto(dto: ChatDetailDto, prev: WizardData): WizardData {
  const chat: ChatRow = dto.chat;
  return {
    ...initialData,
    mode: chat.mode ?? DEFAULT_MODE_ID,
    iconBase64: null,
    iconUrl: dto.currentIconSignedUrl,
    iconPath: chat.currentIconPath,
    backgroundConfig: chat.backgroundConfig ?? initialData.backgroundConfig,
    // assets on disk lack image_base64; export step uses iconUrl-derived
    // previews. Full base64 gets re-hydrated on demand (see chatPersistence).
    assets: null,
    expoConfig: chat.expoConfig ?? null,
    backgroundColor: chat.backgroundColor ?? null,
    cliCallback: prev.cliCallback,
    cliToken: prev.cliToken,
    cliProjectName: prev.cliProjectName,
    messages: dto.messages.map(messageFromDb),
    currentStep: "chat",
    chatId: chat.id,
    isHydrating: false,
  };
}

export function WizardProvider({
  children,
  initialDto,
}: {
  children: React.ReactNode;
  initialDto?: ChatDetailDto;
}) {
  // Seed from the DTO synchronously so SSR and client agree on first paint
  // and child effects (e.g. ChatView's welcome stream) see populated
  // messages on their very first run — no setState-during-render needed.
  const [data, setData] = useState<WizardData>(() =>
    initialDto ? dataFromDto(initialDto, initialData) : initialData,
  );

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

  const hydrate = useCallback((dto: ChatDetailDto) => {
    setData((prev) => dataFromDto(dto, prev));
  }, []);

  const setChatId = useCallback((id: string | null) => {
    setData((prev) => ({ ...prev, chatId: id }));
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
        hydrate,
        setChatId,
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
