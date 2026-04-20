"use client";

import { useEffect, useRef } from "react";
import StyleMenu from "./StyleMenu";

interface ComposerProps {
  text: string;
  onTextChange: (text: string) => void;
  mode: string;
  onModeChange: (mode: string) => void;
  attachedImage: string | null;
  attachedName: string | null;
  onAttach: (base64: string, name: string) => void;
  onClearAttachment: () => void;
  onSend: () => void;
  sending: boolean;
}

export default function Composer({
  text,
  onTextChange,
  mode,
  onModeChange,
  attachedImage,
  attachedName,
  onAttach,
  onClearAttachment,
  onSend,
  sending,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const canSend = (() => {
    if (sending) return false;
    if (attachedImage) return text.trim().length > 0;
    return text.trim().length > 0;
  })();

  const handlePickFile = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      onAttach(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="px-4 pb-4 max-w-2xl mx-auto w-full">
      <div className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
        {attachedImage && (
          <div className="flex items-center gap-2 px-3 pt-3">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 pl-1 pr-2 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${attachedImage}`}
                alt={attachedName ?? "attached"}
                className="w-8 h-8 rounded object-cover"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-200 max-w-[160px] truncate">
                {attachedName ?? "image"}
              </span>
              <button
                type="button"
                onClick={onClearAttachment}
                className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                aria-label="Remove attachment"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Add an instruction describing how to refine this image.
            </p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={
            attachedImage
              ? "How should I refine this image?"
              : "Describe your icon, or pick a suggestion above..."
          }
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          disabled={sending}
        />

        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePickFile}
              disabled={sending}
              className="flex items-center justify-center w-8 h-8 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Attach image"
              title="Attach an image to refine"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15.5V7a5 5 0 00-10 0v9.5a3 3 0 006 0V8a1 1 0 10-2 0v8" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <StyleMenu value={mode} onChange={onModeChange} />
          </div>

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Send"
          >
            {sending ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-spin"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
