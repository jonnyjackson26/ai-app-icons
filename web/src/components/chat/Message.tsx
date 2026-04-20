"use client";

import IconPreview from "@/components/ui/IconPreview";
import type { ChatMessage } from "@/lib/chatTypes";

export default function Message({ message }: { message: ChatMessage }) {
  if (message.role === "assistant" && message.kind === "text") {
    const isError = message.tone === "error";
    return (
      <div className="flex justify-start">
        <div
          className={`max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap ${
            isError
              ? "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900"
              : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          }`}
        >
          {message.content}
          {message.streaming && (
            <span className="inline-block w-1.5 h-4 align-middle ml-0.5 bg-current animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  if (message.role === "assistant" && message.kind === "icon") {
    if (!message.caption) {
      return (
        <div className="flex justify-start">
          <IconPreview base64={message.iconBase64} size="md" />
        </div>
      );
    }
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] space-y-2">
          <IconPreview base64={message.iconBase64} size="md" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">
            {message.caption}
          </p>
        </div>
      </div>
    );
  }

  if (message.role === "user" && message.kind === "text") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // user + attach
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 text-white px-3 py-3 text-sm space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${message.imageBase64}`}
          alt="Attached"
          className="rounded-lg max-h-48 w-auto bg-white/10"
        />
        {message.instruction && (
          <p className="whitespace-pre-wrap">{message.instruction}</p>
        )}
      </div>
    </div>
  );
}
