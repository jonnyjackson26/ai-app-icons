"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChats } from "@/components/ChatsContext";
import ChatSidebarItem from "@/components/ChatSidebarItem";

const COLLAPSE_STORAGE_KEY = "aai_sidebar_collapsed_v1";

// Read the collapsed flag from localStorage without turning it into React
// state — useSyncExternalStore handles SSR (returns false) and keeps the
// value fresh across tabs via the 'storage' event. Dispatching a synthetic
// storage event after writing is how we notify our own tab of the change.

function subscribeCollapsed(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

export default function ChatSidebar() {
  const { chats, signedIn } = useChats();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  const persistCollapsed = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      // localStorage doesn't fire 'storage' in the writing tab, so nudge
      // useSyncExternalStore ourselves.
      window.dispatchEvent(new StorageEvent("storage", { key: COLLAPSE_STORAGE_KEY }));
    } catch {}
  }, []);

  // Hidden entirely for anonymous users. A future enhancement could show a
  // sign-in CTA in the shell instead of null.
  if (!signedIn) return null;

  const activeId = pathname.startsWith("/c/") ? pathname.slice(3) : null;

  const widthClass = collapsed ? "md:w-14" : "md:w-64";
  const mobileClass = mobileOpen
    ? "fixed inset-0 z-40 bg-black/40"
    : "hidden md:block";

  return (
    <>
      {/* Mobile hamburger — only visible <md. Shown outside the drawer. */}
      <button
        type="button"
        aria-label="Open chats"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 rounded-md bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-sm shadow cursor-pointer"
      >
        ☰
      </button>

      <div className={mobileClass} onClick={() => setMobileOpen(false)}>
        <aside
          className={`h-full shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col transition-all duration-200 ${widthClass} ${
            mobileOpen ? "w-64" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800">
            <Link
              href="/"
              prefetch={false}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                collapsed ? "" : "flex-1"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="text-base leading-none">＋</span>
              {!collapsed && <span>New chat</span>}
            </Link>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => persistCollapsed(!collapsed)}
              className="hidden md:inline-flex rounded-md px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.length === 0 ? (
              !collapsed && (
                <div className="text-xs text-zinc-500 dark:text-zinc-500 px-2 py-3">
                  No chats yet. Your conversations will appear here.
                </div>
              )
            ) : (
              chats.map((c) => (
                <ChatSidebarItem
                  key={c.id}
                  chat={c}
                  active={c.id === activeId}
                  collapsed={collapsed}
                />
              ))
            )}
          </nav>
        </aside>
      </div>
    </>
  );
}
