"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MessageList from "./MessageList";
import Composer from "./Composer";
import Suggestions from "./Suggestions";
import { useWizard } from "@/components/WizardContext";
import { useModals } from "@/components/ModalProvider";
import {
  AuthRequiredError,
  QuotaExceededError,
  editIcon,
  generateIcon,
} from "@/lib/api";
import { newId, type ChatMessage } from "@/lib/chatTypes";
import { useStreamText } from "@/lib/useStreamText";
import { createClient } from "@/lib/supabase/browser";
import { stepHref } from "@/lib/wizardNav";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, update, appendMessage, updateMessage, removeMessage } = useWizard();
  const { openAuth, openBilling } = useModals();

  const [text, setText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingOp, setSendingOp] = useState<"generate" | "refine" | null>(null);

  const welcomeIdRef = useRef<string | null>(null);
  const welcomeStartedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const promptStreamTimerRef = useRef<number | null>(null);

  // Holds the payload + error-message id when a request 401s. On SIGNED_IN we
  // remove the inline error and replay the payload — user doesn't re-type.
  const pendingRetryRef = useRef<
    null | { payload: RequestPayload; errorMessageId: string }
  >(null);

  const cancelPromptStream = useCallback(() => {
    if (promptStreamTimerRef.current !== null) {
      window.clearInterval(promptStreamTimerRef.current);
      promptStreamTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancelPromptStream();
  }, [cancelPromptStream]);

  // Welcome stream, once on mount.
  useEffect(() => {
    if (welcomeStartedRef.current) return;
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

  const hasIcon = !!data.iconBase64;

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
    router.push(stepHref(searchParams, "background"));
  }, [router, searchParams]);

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
      update({ iconBase64: base64, editMessage: "", error: null });
      router.push(stepHref(searchParams, "background"));
    });
  };

  const attachLocal = useCallback((base64: string, name: string) => {
    setAttachedImage(base64);
    setAttachedName(name);
  }, []);

  const clearAttachment = useCallback(() => {
    setAttachedImage(null);
    setAttachedName(null);
  }, []);

  const appendAssistantIcon = useCallback(
    (iconBase64: string, caption?: string) => {
      const iconMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        kind: "icon",
        iconBase64,
        caption: caption || undefined,
      };
      appendMessage(iconMsg);
    },
    [appendMessage],
  );

  const appendAssistantError = useCallback(
    (
      content: string,
      cta?: { label: string; href?: string; onClick?: () => void },
    ) => {
      appendMessage({
        id: newId(),
        role: "assistant",
        kind: "text",
        content,
        tone: "error",
        cta,
      });
    },
    [appendMessage],
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
          update({ iconBase64: res.image_base64, editMessage: "", error: null });
          appendAssistantIcon(res.image_base64);
        } else if (payload.kind === "editExisting") {
          const res = await editIcon(payload.iconBase64, payload.instruction);
          update({
            iconBase64: res.image_base64,
            editMessage: res.message,
            error: null,
          });
          appendAssistantIcon(res.image_base64, res.message);
        } else {
          const res = await editIcon(payload.attachedImage, payload.instruction);
          update({
            iconBase64: res.image_base64,
            editMessage: res.message,
            error: null,
          });
          appendAssistantIcon(res.image_base64, res.message);
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
      appendAssistantIcon,
      appendMessage,
      openAuth,
      openBilling,
      update,
    ],
  );

  // When the user signs in, replay the request that got 401'd.
  //
  // Two sources of pending retry:
  //   1. `pendingRetryRef` — in-memory, set when AuthRequiredError happens
  //      on THIS page load (OTP flow: modal closes, we replay here).
  //   2. sessionStorage — survives a full page reload (Google OAuth round-trip
  //      reloads the page; in-memory ref is gone). We restore the user's
  //      original prompt as a chat message, then replay.
  //
  // We listen for both SIGNED_IN and INITIAL_SESSION — the latter fires on
  // first mount when a session cookie is already present (the OAuth case).
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();

    let replayed = false;

    async function tryReplay(trigger: string) {
      if (replayed) return;

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
        appendMessage({
          id: newId(),
          role: "user",
          kind: "text",
          content: payload.description,
        });
      }
      await executeRequest(payload);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;
      tryReplay(event);
    });
    return () => sub.subscription.unsubscribe();
  }, [executeRequest, removeMessage, appendMessage]);

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
      appendMessage({
        id: newId(),
        role: "user",
        kind: "attach",
        imageBase64: imgForEdit,
        instruction: trimmed,
      });
      setText("");
      clearAttachment();
      payload = {
        kind: "editAttached",
        attachedImage: imgForEdit,
        instruction: trimmed,
      };
    } else {
      appendMessage({
        id: newId(),
        role: "user",
        kind: "text",
        content: trimmed,
      });
      setText("");
      if (data.iconBase64) {
        payload = {
          kind: "editExisting",
          iconBase64: data.iconBase64,
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
    data.mode,
    appendMessage,
    cancelPromptStream,
    clearAttachment,
    executeRequest,
  ]);

  const loadingLabel =
    sendingOp === "generate"
      ? "Generating your icon..."
      : sendingOp === "refine"
        ? "Refining your icon..."
        : null;

  return (
    <div className="relative flex-1 min-h-0 w-full">
      <MessageList messages={data.messages} loadingLabel={loadingLabel} />

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
