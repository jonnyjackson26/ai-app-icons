"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  X,
} from "lucide-react";
import { useChats } from "@/components/ChatsContext";
import { useWizard } from "@/components/WizardContext";
import ChatSidebarItem from "@/components/ChatSidebarItem";
import UserBadge from "@/components/UserBadge";

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
  const { reset } = useWizard();
  const router = useRouter();
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

  const onNewChat = useCallback(() => {
    // Reset the shared provider first so the UI clears immediately.
    reset();
    // Sync the URL. router.replace handles the real navigation case
    // (user was on /c/xyz); the explicit history.replaceState below
    // handles the "synthetic URL" case (ensureChatId used replaceState
    // without telling Next.js, so router.replace('/') is a no-op but
    // the URL bar still shows /c/xyz).
    router.replace("/");
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    setMobileOpen(false);
  }, [reset, router]);

  // Self-host mode has no persistence and no auth, so the sidebar is
  // meaningless — hide it entirely.
  const authEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!authEnabled) return null;

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
        className="md:hidden fixed top-3 left-3 z-30 rounded-md bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 p-2 shadow cursor-pointer"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className={mobileClass} onClick={() => setMobileOpen(false)}>
        <aside
          className={`h-full shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col transition-all duration-200 ${widthClass} ${
            mobileOpen ? "w-64" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: app name/subtitle (hidden when collapsed) + collapse toggle */}
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between gap-2"
            } px-3 py-2 border-b border-zinc-200 dark:border-zinc-800`}
          >
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                  AI App Icons
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight truncate">
                  For Expo apps
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => persistCollapsed(!collapsed)}
                className="hidden md:inline-flex items-center justify-center p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              {/* Mobile-only close button inside the drawer */}
              <button
                type="button"
                aria-label="Close chats"
                onClick={() => setMobileOpen(false)}
                className="md:hidden inline-flex items-center justify-center p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* New chat button — full-width prominent when expanded, icon-only when collapsed */}
          <div className="p-2">
            <button
              type="button"
              onClick={onNewChat}
              aria-label="New chat"
              title="New chat"
              className={`w-full flex items-center ${
                collapsed ? "justify-center" : "gap-2 justify-start px-3"
              } h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors duration-150 cursor-pointer`}
            >
              <SquarePen className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>New chat</span>}
            </button>
          </div>

          {/* Chat list */}
          <nav
            className={`flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 ${
              collapsed
                ? "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                : ""
            }`}
          >
            {chats.length === 0 ? (
              !collapsed && (
                <div className="flex flex-col items-center justify-center gap-2 px-3 py-10 text-center">
                  <MessagesSquare
                    className="h-6 w-6 text-zinc-400 dark:text-zinc-600"
                    aria-hidden="true"
                  />
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    {signedIn ? (
                      <>
                        No chats yet.
                        <br />
                        Your conversations will appear here.
                      </>
                    ) : (
                      <>
                        Sign in to save your chats
                        <br />
                        and access them across devices.
                      </>
                    )}
                  </div>
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

          {/* Footer: profile chip */}
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-2">
            <UserBadge collapsed={collapsed} />
          </div>
        </aside>
      </div>
    </>
  );
}
