"use client";

import { useEffect, useRef } from "react";
import Message from "./Message";
import type { ChatMessage } from "@/lib/chatTypes";

interface MessageListProps {
  messages: ChatMessage[];
  loadingLabel?: string | null;
}

export default function MessageList({ messages, loadingLabel }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loadingLabel]);

  return (
    <div className="absolute inset-0 overflow-y-auto px-4 pt-6 pb-56">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
        {loadingLabel && <IconLoadingBubble label={loadingLabel} />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function IconLoadingBubble({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-start">
        <div
          className="w-64 h-64 rounded-2xl overflow-hidden shadow-lg relative bg-zinc-200 dark:bg-zinc-700"
          role="status"
          aria-label={label}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin text-zinc-400 dark:text-zinc-500"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          {label}
        </div>
      </div>
    </div>
  );
}
