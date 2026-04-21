"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChatSummary } from "@/lib/chatDb";
import {
  createChat as createChatApi,
  deleteChat as deleteChatApi,
  listChats,
  patchChat,
} from "@/lib/chatApi";
import { createClient } from "@/lib/supabase/browser";

interface ChatsContextValue {
  chats: ChatSummary[];
  loading: boolean;
  signedIn: boolean;
  refresh: () => Promise<void>;
  createChat: () => Promise<string | null>;
  renameChat: (id: string, title: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  upsertLocal: (patch: Partial<ChatSummary> & { id: string }) => void;
}

const ChatsContext = createContext<ChatsContextValue | null>(null);

function isEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function ChatsProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const refresh = useCallback(async () => {
    if (!isEnabled()) return;
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setSignedIn(false);
      setChats([]);
      return;
    }
    setSignedIn(true);
    setLoading(true);
    try {
      const list = await listChats();
      setChats(list);
    } catch (e) {
      console.warn("[chats] refresh failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEnabled()) return;
    refresh();
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        refresh();
      } else if (event === "SIGNED_OUT") {
        setSignedIn(false);
        setChats([]);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const createChat = useCallback(async (): Promise<string | null> => {
    if (!isEnabled()) return null;
    try {
      const chat = await createChatApi({});
      setChats((prev) => [
        {
          id: chat.id,
          title: chat.title,
          lastMessageAt: chat.lastMessageAt,
          currentIconPath: chat.currentIconPath,
          thumbnailUrl: null,
        },
        ...prev,
      ]);
      return chat.id;
    } catch (e) {
      console.warn("[chats] create failed:", e);
      return null;
    }
  }, []);

  const renameChat = useCallback(async (id: string, title: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: title || "New chat" } : c)),
    );
    try {
      await patchChat(id, { title });
    } catch (e) {
      console.warn("[chats] rename failed:", e);
    }
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    // Optimistic local removal; the server soft-deletes so we can roll back
    // if needed (not surfaced in UI yet).
    setChats((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteChatApi(id);
    } catch (e) {
      console.warn("[chats] delete failed:", e);
    }
  }, []);

  // Used by chatPersistence after it lazy-creates a chat from the first
  // message — the list needs to reflect the new row immediately so the
  // sidebar highlights it without waiting for a refresh.
  const upsertLocal = useCallback(
    (patch: Partial<ChatSummary> & { id: string }) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === patch.id);
        if (idx === -1) {
          return [
            {
              id: patch.id,
              title: patch.title ?? "New chat",
              lastMessageAt: patch.lastMessageAt ?? new Date().toISOString(),
              currentIconPath: patch.currentIconPath ?? null,
              thumbnailUrl: patch.thumbnailUrl ?? null,
            },
            ...prev,
          ];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      });
    },
    [],
  );

  const value = useMemo<ChatsContextValue>(
    () => ({
      chats,
      loading,
      signedIn,
      refresh,
      createChat,
      renameChat,
      deleteChat,
      upsertLocal,
    }),
    [chats, loading, signedIn, refresh, createChat, renameChat, deleteChat, upsertLocal],
  );

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChats(): ChatsContextValue {
  const ctx = useContext(ChatsContext);
  if (!ctx) throw new Error("useChats must be used inside <ChatsProvider>");
  return ctx;
}
