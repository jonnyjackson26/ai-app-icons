"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import Composer from "./Composer";
import Suggestions from "./Suggestions";
import { useWizard } from "@/components/WizardContext";
import { useChats } from "@/components/ChatsContext";
import { useModals } from "@/components/ModalProvider";
import { useChatPersistence } from "@/lib/chatPersistence";
import {
  AuthRequiredError,
  QuotaExceededError,
  editIcon,
  generateIcon,
} from "@/lib/api";
import { newId, type ChatMessage } from "@/lib/chatTypes";
import { useStreamText } from "@/lib/useStreamText";
import { createClient } from "@/lib/supabase/browser";

const WELCOME =
  "Welcome to ai-app-icons!\n" +
  "First, I'll generate a logo for your app — just the artwork, no background yet. " +
  "Once you like the logo, pick a background and I'll generate every asset your Expo app needs (iOS, Android, splash, favicon) for full platform coverage.";

// A single generate/edit attempt, shaped so it can be replayed after sign-in.
type RequestPayload =
  | { kind: "generate"; description: string; mode: string | null }
  | { kind: "editExisting"; iconBase64: string; instruction: string }
  | { kind: "editAttached"; attachedImage: string; instruction: string };

// sessionStorage key for the retry payload. Survives the Google-OAuth full
// page navigation, which wipes React state (including `pendingRetryRef`).
// Only "generate" is stored — edit payloads carry full base64 images which
// would bust the sessionStorage quota and also depend on WizardContext
// state that no longer exists after the reload.
const RETRY_STORAGE_KEY = "aai_pending_retry_v1";

export default function ChatView() {
  const {
    data,
    update,
    appendMessage,
    updateMessage,
    removeMessage,
    setStep,
  } = useWizard();
  const { openAuth, openBilling } = useModals();
  const {
    persistUserMessage,
    persistAssistantIcon,
    persistAssistantText,
    migrateAnonymousChat,
    hydrateIconBase64,
  } = useChatPersistence();
  const { upsertLocal, refresh: refreshChats } = useChats();

  const [text, setText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingOp, setSendingOp] = useState<"generate" | "refine" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Counter handles nested dragenter/dragleave from child elements without flicker.
  const dragDepthRef = useRef(0);

  const welcomeIdRef = useRef<string | null>(null);
  const welcomeStartedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const promptStreamTimerRef = useRef<number | null>(null);

  // Holds the payload + error-message id when a request 401s. On SIGNED_IN we
  // remove the inline error and replay the payload — user doesn't re-type.
  const pendingRetryRef = useRef<
    null | { payload: RequestPayload; errorMessageId: string }
  >(null);

  // Refs mirror the latest chatId/messages so the auth-listener effect below
  // doesn't need them in its deps. Without this, every welcome-stream tick
  // mutates data.messages → re-subscribes → INITIAL_SESSION fires again →
  // migrateAnonymousChat runs N times → chat_messages_pkey collisions.
  const chatIdRef = useRef<string | null>(data.chatId);
  const messagesRef = useRef<ChatMessage[]>(data.messages);
  const migrationStartedRef = useRef(false);
  useEffect(() => {
    chatIdRef.current = data.chatId;
    messagesRef.current = data.messages;
  }, [data.chatId, data.messages]);

  const cancelPromptStream = useCallback(() => {
    if (promptStreamTimerRef.current !== null) {
      window.clearInterval(promptStreamTimerRef.current);
      promptStreamTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancelPromptStream();
  }, [cancelPromptStream]);

  // Welcome stream, once on mount — only when we're genuinely starting a
  // fresh conversation. Hydrated chats always have messages pre-populated
  // so the length guard keeps us quiet.
  useEffect(() => {
    if (welcomeStartedRef.current) return;
    if (data.isHydrating) return;
    // Any hydrated chat has chatId set; belt-and-braces against the race
    // where HydrationBoundary's setState-during-render lands late.
    if (data.chatId) {
      welcomeStartedRef.current = true;
      return;
    }
    if (data.messages.length > 0) {
      welcomeStartedRef.current = true;
      return;
    }
    const id = newId();
    welcomeIdRef.current = id;
    welcomeStartedRef.current = true;
    appendMessage({
      id,
      role: "assistant",
      kind: "text",
      content: "",
      streaming: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useStreamText(
    WELCOME,
    (partial) => {
      const id = welcomeIdRef.current;
      if (!id) return;
      updateMessage(id, { content: partial });
    },
    () => {
      const id = welcomeIdRef.current;
      if (!id) return;
      updateMessage(id, { streaming: false });
    },
    { enabled: welcomeIdRef.current !== null },
  );

  const hasIcon = !!(data.iconBase64 || data.iconUrl);

  const onPickPrompt = useCallback(
    (p: string) => {
      cancelPromptStream();

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        setText(p);
        return;
      }

      setText("");
      let cursor = 0;
      const CHARS_PER_TICK = 2;
      promptStreamTimerRef.current = window.setInterval(() => {
        cursor = Math.min(cursor + CHARS_PER_TICK, p.length);
        setText(p.slice(0, cursor));
        if (cursor >= p.length) cancelPromptStream();
      }, 18);
    },
    [cancelPromptStream],
  );

  const handleTextChange = useCallback(
    (next: string) => {
      cancelPromptStream();
      setText(next);
    },
    [cancelPromptStream],
  );

  const onPickBackground = useCallback(() => {
    console.log("[ChatView] onPickBackground → setStep(background)");
    setStep("background");
  }, [setStep]);

  const readFile = (file: File, onLoad: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      onLoad(base64);
    };
    reader.readAsDataURL(file);
  };

  const onAlreadyHaveIcon = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleAlreadyHaveFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    readFile(file, (base64) => {
      update({ iconBase64: base64, iconUrl: null, iconPath: null, editMessage: "", error: null });
      setStep("background");
    });
  };

  const attachLocal = useCallback((base64: string, name: string) => {
    setAttachedImage(base64);
    setAttachedName(name);
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (sending) return;
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setIsDragging(true);
    },
    [sending],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (sending) return;
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [sending],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);
      if (sending) return;
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      readFile(file, (base64) => attachLocal(base64, file.name));
    },
    [sending, attachLocal],
  );

  const clearAttachment = useCallback(() => {
    setAttachedImage(null);
    setAttachedName(null);
  }, []);

  const appendAndPersistAssistantIcon = useCallback(
    (iconBase64: string, caption?: string) => {
      const iconMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        kind: "icon",
        iconBase64,
        caption: caption || undefined,
      };
      appendMessage(iconMsg);
      // Fire-and-forget persistence — the UI already has the icon on screen,
      // Storage upload + DB insert happens in the background.
      persistAssistantIcon(iconMsg, iconBase64).then(() => {
        if (data.chatId) {
          upsertLocal({
            id: data.chatId,
            currentIconPath: null,
            lastMessageAt: new Date().toISOString(),
          });
          // Refresh the sidebar so the new thumbnail shows up.
          refreshChats();
        }
      });
    },
    [appendMessage, persistAssistantIcon, data.chatId, upsertLocal, refreshChats],
  );

  const appendAssistantError = useCallback(
    (
      content: string,
      cta?: { label: string; href?: string; onClick?: () => void },
    ) => {
      const msg: ChatMessage = {
        id: newId(),
        role: "assistant",
        kind: "text",
        content,
        tone: "error",
        cta,
      };
      appendMessage(msg);
      persistAssistantText(msg);
    },
    [appendMessage, persistAssistantText],
  );

  // Core API call. Shared between the first attempt and the post-sign-in replay.
  // Does NOT append the user message — caller owns that so retries don't duplicate.
  const executeRequest = useCallback(
    async (payload: RequestPayload) => {
      console.log("[ChatView] executeRequest", payload.kind);
      const op: "generate" | "refine" =
        payload.kind === "generate" ? "generate" : "refine";
      setSending(true);
      setSendingOp(op);

      try {
        if (payload.kind === "generate") {
          const res = await generateIcon(payload.description, payload.mode ?? undefined);
          update({
            iconBase64: res.image_base64,
            iconUrl: null,
            editMessage: "",
            error: null,
          });
          appendAndPersistAssistantIcon(res.image_base64);
        } else if (payload.kind === "editExisting") {
          const res = await editIcon(payload.iconBase64, payload.instruction);
          update({
            iconBase64: res.image_base64,
            iconUrl: null,
            editMessage: res.message,
            error: null,
          });
          appendAndPersistAssistantIcon(res.image_base64, res.message);
        } else {
          const res = await editIcon(payload.attachedImage, payload.instruction);
          update({
            iconBase64: res.image_base64,
            iconUrl: null,
            editMessage: res.message,
            error: null,
          });
          appendAndPersistAssistantIcon(res.image_base64, res.message);
        }
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          openBilling("default");
          appendAssistantError(
            `You've hit your ${err.tier} plan limit of ${err.limit} AI calls per ${err.windowDays} days. Upgrade to keep generating.`,
            { label: "See plans", onClick: () => openBilling("default") },
          );
        } else if (err instanceof AuthRequiredError) {
          // Pre-generate the id so we can remove this message on replay.
          const errorMessageId = newId();
          appendMessage({
            id: errorMessageId,
            role: "assistant",
            kind: "text",
            content: "Please sign in first",
            tone: "error",
            cta: { label: "Sign in", onClick: () => openAuth("sign-in") },
          });
          pendingRetryRef.current = { payload, errorMessageId };
          // Persist generate-kind retries so Google OAuth (full page reload)
          // can still replay. Edit-kind retries are only stashed in-memory.
          if (payload.kind === "generate" && typeof window !== "undefined") {
            try {
              sessionStorage.setItem(
                RETRY_STORAGE_KEY,
                JSON.stringify(payload),
              );
            } catch {
              /* quota / private browsing — in-memory fallback is fine */
            }
          }
          openAuth("sign-in");
        } else {
          const message =
            err instanceof Error ? err.message : "Something went wrong.";
          appendAssistantError(message);
        }
      } finally {
        setSending(false);
        setSendingOp(null);
      }
    },
    [
      appendAssistantError,
      appendAndPersistAssistantIcon,
      appendMessage,
      openAuth,
      openBilling,
      update,
    ],
  );

  // When the user signs in, replay the request that got 401'd AND migrate any
  // anonymous in-memory transcript to a persisted chat so the sidebar has it.
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();

    let replayed = false;

    async function tryReplay(trigger: string) {
      if (replayed) return;

      // Migrate anonymous transcript first (before replay so the replayed
      // assistant response lands inside the new persisted chat). The welcome
      // message is purely onboarding UI — filter it out so we don't persist
      // partial mid-stream text, and guard with migrationStartedRef so two
      // auth events can't race two createChat calls.
      if (
        !chatIdRef.current &&
        messagesRef.current.length > 0 &&
        !migrationStartedRef.current
      ) {
        const toMigrate = messagesRef.current.filter(
          (m) => m.id !== welcomeIdRef.current,
        );
        if (toMigrate.length > 0) {
          migrationStartedRef.current = true;
          await migrateAnonymousChat(toMigrate);
        }
      }

      // In-memory (OTP path): preferred because it carries the errorMessageId
      // so we can remove the "Please sign in first" message inline.
      const inMemory = pendingRetryRef.current;
      if (inMemory) {
        replayed = true;
        pendingRetryRef.current = null;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem(RETRY_STORAGE_KEY);
          } catch {}
        }
        console.log("[ChatView] replay (memory) trigger=", trigger);
        removeMessage(inMemory.errorMessageId);
        await executeRequest(inMemory.payload);
        return;
      }

      // sessionStorage (OAuth path): chat history is fresh (page reloaded),
      // so we also append the original user message so the transcript isn't
      // missing the prompt that triggered everything.
      if (typeof window === "undefined") return;
      let stored: string | null = null;
      try {
        stored = sessionStorage.getItem(RETRY_STORAGE_KEY);
      } catch {}
      if (!stored) return;

      let payload: RequestPayload;
      try {
        payload = JSON.parse(stored) as RequestPayload;
      } catch {
        sessionStorage.removeItem(RETRY_STORAGE_KEY);
        return;
      }

      replayed = true;
      sessionStorage.removeItem(RETRY_STORAGE_KEY);
      console.log("[ChatView] replay (sessionStorage) trigger=", trigger);

      if (payload.kind === "generate") {
        const userMsg: ChatMessage = {
          id: newId(),
          role: "user",
          kind: "text",
          content: payload.description,
        };
        appendMessage(userMsg);
        persistUserMessage(userMsg);
      }
      await executeRequest(payload);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;
      tryReplay(event);
    });
    return () => sub.subscription.unsubscribe();
  }, [
    executeRequest,
    removeMessage,
    appendMessage,
    persistUserMessage,
    migrateAnonymousChat,
  ]);

  const onSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) {
      console.log("[ChatView] onSend ignored:", { empty: !trimmed, sending });
      return;
    }
    cancelPromptStream();
    console.log("[ChatView] onSend (text len:", trimmed.length, ")");

    let payload: RequestPayload;

    if (attachedImage) {
      const imgForEdit = attachedImage;
      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        kind: "attach",
        imageBase64: imgForEdit,
        instruction: trimmed,
      };
      appendMessage(userMsg);
      persistUserMessage(userMsg);
      setText("");
      clearAttachment();
      payload = {
        kind: "editAttached",
        attachedImage: imgForEdit,
        instruction: trimmed,
      };
    } else {
      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        kind: "text",
        content: trimmed,
      };
      appendMessage(userMsg);
      persistUserMessage(userMsg);
      setText("");
      // For hydrated chats the byte string isn't loaded yet — pull it from
      // the signed URL before we can round-trip an edit.
      let iconForEdit = data.iconBase64;
      if (!iconForEdit && data.iconUrl) {
        await hydrateIconBase64();
        // Re-read after the hydrate; fall back to regenerate if it failed.
        iconForEdit = data.iconBase64;
      }
      if (iconForEdit) {
        payload = {
          kind: "editExisting",
          iconBase64: iconForEdit,
          instruction: trimmed,
        };
      } else {
        payload = {
          kind: "generate",
          description: trimmed,
          mode: data.mode || null,
        };
      }
    }

    await executeRequest(payload);
  }, [
    text,
    sending,
    attachedImage,
    data.iconBase64,
    data.iconUrl,
    data.mode,
    appendMessage,
    persistUserMessage,
    cancelPromptStream,
    clearAttachment,
    executeRequest,
    hydrateIconBase64,
  ]);

  const loadingLabel =
    sendingOp === "generate"
      ? "Generating your icon..."
      : sendingOp === "refine"
        ? "Refining your icon..."
        : null;

  return (
    <div
      className="relative flex-1 min-h-0 w-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <MessageList messages={data.messages} loadingLabel={loadingLabel} />

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-blue-500 bg-white/90 dark:bg-zinc-900/90 px-6 py-4 text-sm font-medium text-blue-700 dark:text-blue-300 shadow-lg">
            Drop image to attach
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col">
        <div className="pointer-events-auto relative z-10">
          <Suggestions
            hasIcon={hasIcon}
            onPickPrompt={onPickPrompt}
            onPickBackground={onPickBackground}
            onAlreadyHaveIcon={onAlreadyHaveIcon}
          />
        </div>
        <div className="pointer-events-auto relative z-20">
          <Composer
            text={text}
            onTextChange={handleTextChange}
            mode={data.mode}
            onModeChange={(m) => update({ mode: m })}
            attachedImage={attachedImage}
            attachedName={attachedName}
            onAttach={attachLocal}
            onClearAttachment={clearAttachment}
            onSend={onSend}
            sending={sending}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleAlreadyHaveFile}
        />
      </div>
    </div>
  );
}
