"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MessageList from "./MessageList";
import Composer from "./Composer";
import Suggestions from "./Suggestions";
import { useWizard } from "@/components/WizardContext";
import { editIcon, generateIcon } from "@/lib/api";
import { newId, type ChatMessage } from "@/lib/chatTypes";
import { useStreamText } from "@/lib/useStreamText";

const WELCOME =
  "Welcome to ai-app-icons!\n" +
  "First, I'll generate a logo for your app — just the artwork, no background yet. " +
  "Once you like the logo, pick a background and I'll generate every asset your Expo app needs (iOS, Android, splash, favicon) for full platform coverage.";

export default function ChatView() {
  const router = useRouter();
  const { data, update, appendMessage, updateMessage } = useWizard();

  const [text, setText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingOp, setSendingOp] = useState<"generate" | "refine" | null>(null);

  const welcomeIdRef = useRef<string | null>(null);
  const welcomeStartedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  const onPickPrompt = useCallback((p: string) => setText(p), []);

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
    (content: string) => {
      appendMessage({
        id: newId(),
        role: "assistant",
        kind: "text",
        content,
        tone: "error",
      });
    },
    [appendMessage],
  );

  const onSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const op: "generate" | "refine" =
      attachedImage || data.iconBase64 ? "refine" : "generate";
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
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      appendAssistantError(message);
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
    clearAttachment,
    update,
    appendAssistantIcon,
    appendAssistantError,
  ]);

  const loadingLabel =
    sendingOp === "generate"
      ? "Generating your icon..."
      : sendingOp === "refine"
        ? "Refining your icon..."
        : null;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <MessageList messages={data.messages} loadingLabel={loadingLabel} />

      <div className="shrink-0 pt-2 border-t border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur">
        <Suggestions
          hasIcon={hasIcon}
          onPickPrompt={onPickPrompt}
          onPickBackground={onPickBackground}
          onAlreadyHaveIcon={onAlreadyHaveIcon}
        />
        <Composer
          text={text}
          onTextChange={setText}
          mode={data.mode}
          onModeChange={(m) => update({ mode: m })}
          attachedImage={attachedImage}
          attachedName={attachedName}
          onAttach={attachLocal}
          onClearAttachment={clearAttachment}
          onSend={onSend}
          sending={sending}
        />
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
