"use client";

import Link from "next/link";
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
          {message.cta && (
            <div className="mt-2">
              {message.cta.onClick ? (
                <button
                  type="button"
                  onClick={message.cta.onClick}
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    isError
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {message.cta.label}
                </button>
              ) : message.cta.href ? (
                <Link
                  href={message.cta.href}
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isError
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {message.cta.label}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.role === "assistant" && message.kind === "icon") {
    return (
      <div className="space-y-2">
        <div className="flex justify-start">
          <IconPreview base64={message.iconBase64} url={message.iconUrl} size="md" />
        </div>
        {message.caption && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              {message.caption}
            </div>
          </div>
        )}
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
  const attachSrc =
    message.imageUrl ??
    (message.imageBase64 ? `data:image/png;base64,${message.imageBase64}` : "");
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 text-white px-3 py-3 text-sm space-y-2">
        {attachSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachSrc}
            alt="Attached"
            className="rounded-lg max-h-48 w-auto bg-white/10"
          />
        )}
        {message.instruction && (
          <p className="whitespace-pre-wrap">{message.instruction}</p>
        )}
      </div>
    </div>
  );
}
