"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

const WELCOME =
  "Welcome to ai-app-icons!\n" +
  "First, I'll generate a logo for your app — just the artwork, no background yet. " +
  "Once you like the logo, pick a background and I'll generate every asset your Expo app needs (iOS, Android, splash, favicon) for full platform coverage.";

export default function ChatView() {
  const router = useRouter();
  const { data, update, appendMessage, updateMessage } = useWizard();
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

  const cancelPromptStream = useCallback(() => {
    if (promptStreamTimerRef.current !== null) {
      window.clearInterval(promptStreamTimerRef.current);
      promptStreamTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancelPromptStream();
  }, [cancelPromptStream]);

  // Kick off the welcome stream once on mount if the chat is empty.
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
    router.push("?step=background");
  }, [router]);

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
      router.push("?step=background");
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

  const onSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) {
      console.log("[ChatView] onSend ignored:", { empty: !trimmed, sending });
      return;
    }

    cancelPromptStream();
    const op: "generate" | "refine" =
      attachedImage || data.iconBase64 ? "refine" : "generate";
    console.log("[ChatView] onSend →", op, "(text len:", trimmed.length, ")");
    setSending(true);
    setSendingOp(op);

    try {
      if (attachedImage) {
        // Refine with attached image + instruction
        appendMessage({
          id: newId(),
          role: "user",
          kind: "attach",
          imageBase64: attachedImage,
          instruction: trimmed,
        });
        setText("");
        const imgForEdit = attachedImage;
        clearAttachment();
        const res = await editIcon(imgForEdit, trimmed);
        update({
          iconBase64: res.image_base64,
          editMessage: res.message,
          error: null,
        });
        appendAssistantIcon(res.image_base64, res.message);
      } else {
        appendMessage({
          id: newId(),
          role: "user",
          kind: "text",
          content: trimmed,
        });
        setText("");
        if (!data.iconBase64) {
          const effectiveMode = data.mode || undefined;
          const res = await generateIcon(trimmed, effectiveMode);
          update({
            iconBase64: res.image_base64,
            editMessage: "",
            error: null,
          });
          appendAssistantIcon(res.image_base64);
        } else {
          const res = await editIcon(data.iconBase64, trimmed);
          update({
            iconBase64: res.image_base64,
            editMessage: res.message,
            error: null,
          });
          appendAssistantIcon(res.image_base64, res.message);
        }
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        openBilling("default");
        appendAssistantError(
          `You've hit your ${err.tier} plan limit of ${err.limit} AI calls per ${err.windowDays} days. Upgrade to keep generating.`,
          { label: "See plans", onClick: () => openBilling("default") },
        );
      } else if (err instanceof AuthRequiredError) {
        openAuth("sign-in");
        appendAssistantError(
          "Sign in to generate app icons. Your free tier includes 5 AI calls per week.",
          { label: "Sign in", onClick: () => openAuth("sign-in") },
        );
      } else {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        appendAssistantError(message);
      }
    } finally {
      setSending(false);
      setSendingOp(null);
    }
  }, [
    text,
    sending,
    attachedImage,
    data.iconBase64,
    data.mode,
    appendMessage,
    cancelPromptStream,
    clearAttachment,
    update,
    appendAssistantIcon,
    appendAssistantError,
    openAuth,
    openBilling,
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
