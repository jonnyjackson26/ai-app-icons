"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ChatSummary } from "@/lib/chatDb";
import { useChats } from "@/components/ChatsContext";
import { backgroundToCss } from "@/lib/backgroundCss";

const CHECKER_BG =
  "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), " +
  "linear-gradient(-45deg, #e5e7eb 25%, transparent 25%)";

interface Props {
  chat: ChatSummary;
  active: boolean;
  collapsed: boolean;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffS = (Date.now() - then) / 1000;
  if (diffS < 60) return "just now";
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)}h`;
  if (diffS < 86400 * 7) return `${Math.floor(diffS / 86400)}d`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ChatSidebarItem({ chat, active, collapsed }: Props) {
  const { renameChat, deleteChat } = useChats();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = () => setMenuOpen(false);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [menuOpen]);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    const next = trimmed.length > 0 ? trimmed : "New chat";
    if (next !== chat.title) renameChat(chat.id, next);
    setRenaming(false);
  };

  const onDelete = () => {
    if (typeof window !== "undefined" && !window.confirm("Delete this chat?"))
      return;
    deleteChat(chat.id);
  };

  const content = (
    <div
      className={`group relative flex items-center py-1.5 rounded-md text-sm transition-colors duration-150 ${
        collapsed ? "justify-center px-0" : "gap-2 pl-2 pr-1.5"
      } ${
        active
          ? "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          : "hover:bg-zinc-200/40 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
      }`}
      title={collapsed ? chat.title : undefined}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-blue-500"
        />
      )}
      <div
        className="shrink-0 w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden"
        style={
          backgroundToCss(chat.backgroundConfig)
            ? { background: backgroundToCss(chat.backgroundConfig) ?? undefined }
            : { backgroundImage: CHECKER_BG, backgroundSize: "8px 8px" }
        }
      >
        {chat.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chat.thumbnailUrl}
            alt=""
            className="w-full h-full object-contain"
          />
        )}
      </div>
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            {renaming ? (
              <input
                ref={inputRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setDraftTitle(chat.title);
                    setRenaming(false);
                  }
                }}
                onClick={(e) => e.preventDefault()}
                className="w-full bg-transparent border-b border-zinc-400 dark:border-zinc-500 text-sm outline-none"
              />
            ) : (
              <div className="truncate">{chat.title}</div>
            )}
            <div className="text-[10px] text-zinc-500 dark:text-zinc-500">
              {relativeTime(chat.lastMessageAt)}
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label="Chat options"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="inline-flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-zinc-300/60 dark:hover:bg-zinc-700 rounded p-1 transition-colors duration-150 cursor-pointer"
            >
              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg text-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setDraftTitle(chat.title);
                    setRenaming(true);
                  }}
                  className="flex w-full items-center gap-2 text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-150 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (renaming) {
    // Disable navigation while the user is editing the title.
    return <div>{content}</div>;
  }
  return (
    <Link href={`/c/${chat.id}`} prefetch={false}>
      {content}
    </Link>
  );
}
