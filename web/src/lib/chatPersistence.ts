"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWizard } from "@/components/WizardContext";
import { createClient } from "@/lib/supabase/browser";
import { CHAT_ICONS_BUCKET, type StoredAsset } from "@/lib/chatDb";
import {
  appendMessageRow,
  bulkAppendMessageRows,
  createChat,
  patchChat,
} from "@/lib/chatApi";
import type { ChatMessage } from "@/lib/chatTypes";
import { newId } from "@/lib/chatTypes";
import type { AssetFile } from "@/lib/types";

// Persistence layer for the chat. Wraps the raw WizardContext mutators with
// fire-and-forget network + Storage writes so the UI stays snappy and the
// DB catches up asynchronously. Self-host mode (no Supabase env) no-ops.

function isEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function base64ToBlob(base64: string, mime = "image/png"): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

interface UploadArgs {
  userId: string;
  chatId: string;
  messageId: string;
  base64: string;
  kind: "icon" | "attach" | "asset";
  name?: string; // for assets
}

async function uploadImage(args: UploadArgs): Promise<string | null> {
  if (!isEnabled()) return null;
  const supabase = createClient();
  let path: string;
  if (args.kind === "icon") {
    path = `${args.userId}/${args.chatId}/${args.messageId}.png`;
  } else if (args.kind === "attach") {
    path = `${args.userId}/${args.chatId}/attachments/${args.messageId}.png`;
  } else {
    path = `${args.userId}/${args.chatId}/assets/${args.name ?? args.messageId}.png`;
  }
  const blob = base64ToBlob(args.base64);
  const { error } = await supabase.storage
    .from(CHAT_ICONS_BUCKET)
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) {
    console.warn("[chatPersistence] upload failed:", error.message);
    return null;
  }
  return path;
}

type UserMessage = Extract<ChatMessage, { role: "user" }>;
type AssistantIconMessage = Extract<ChatMessage, { role: "assistant"; kind: "icon" }>;
type AssistantTextMessage = Extract<ChatMessage, { role: "assistant"; kind: "text" }>;

// Upload a batch of generated assets to Storage in parallel. Returns the
// StoredAsset[] (base64 stripped, path attached) ready to persist on the chat row.
export async function uploadAssetsBatch(
  userId: string,
  chatId: string,
  assets: AssetFile[],
): Promise<StoredAsset[]> {
  if (!isEnabled()) return [];
  const results = await Promise.all(
    assets.map(async (a) => {
      const path = await uploadImage({
        userId,
        chatId,
        messageId: a.name,
        base64: a.image_base64,
        kind: "asset",
        name: a.name,
      });
      if (!path) return null;
      return {
        name: a.name,
        width: a.width,
        height: a.height,
        has_background: a.has_background,
        platform: a.platform,
        variant: a.variant,
        path,
      } satisfies StoredAsset;
    }),
  );
  return results.filter((r): r is StoredAsset => r !== null);
}

export interface UseChatPersistence {
  // Append a user message — persists text immediately, attachments upload in parallel.
  persistUserMessage: (msg: UserMessage) => Promise<void>;
  // Append an assistant icon message AND update chats.current_icon_path.
  persistAssistantIcon: (msg: AssistantIconMessage, base64: string) => Promise<void>;
  // Append a plain assistant text message (errors, notices).
  persistAssistantText: (msg: AssistantTextMessage) => Promise<void>;
  // Ensure a chat row exists; returns the chat id. No-op if one already exists.
  ensureChatId: (seedTitle?: string) => Promise<string | null>;
  // For anonymous continuity: after a fresh sign-in, persist the entire in-memory transcript.
  migrateAnonymousChat: (messages: ChatMessage[]) => Promise<string | null>;
  // PATCH wizard state to the current chat. No-op when there's no chatId.
  patchCurrentChat: (body: Parameters<typeof patchChat>[1]) => Promise<void>;
  // Pull bytes for the current iconUrl into iconBase64 so edits can round-trip.
  hydrateIconBase64: () => Promise<void>;
  // Upload client-generated assets to Storage + PATCH the chat row. No-op when anonymous.
  persistAssets: (
    assets: AssetFile[],
    expoConfig: Record<string, unknown>,
    backgroundColor: string,
  ) => Promise<StoredAsset[]>;
  // Turn StoredAsset[] (path only) from the DB back into AssetFile[] (base64) for ExportStep.
  rehydrateStoredAssets: (stored: StoredAsset[]) => Promise<AssetFile[]>;
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstText = messages.find(
    (m) => m.role === "user" && m.kind === "text",
  ) as Extract<ChatMessage, { role: "user"; kind: "text" }> | undefined;
  if (!firstText) return "New chat";
  const raw = firstText.content.trim();
  if (raw.length <= 40) return raw;
  const cut = raw.slice(0, 40);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

async function getCurrentUserId(): Promise<string | null> {
  if (!isEnabled()) return null;
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export function useChatPersistence(): UseChatPersistence {
  const { data, setChatId, update, updateMessage } = useWizard();

  // Mirror the latest chatId in a ref so ensureChatId reads the freshest
  // value regardless of which render's closure called it. Without this,
  // an assistant response that arrives after a state update — but via a
  // callback captured before that update — would see null and create a
  // duplicate chat row.
  const chatIdRef = useRef<string | null>(data.chatId);
  useEffect(() => {
    chatIdRef.current = data.chatId;
  }, [data.chatId]);

  // Shared in-flight createChat promise. Two parallel callers (user msg +
  // assistant icon) both invoke ensureChatId; without this guard they each
  // race an insert.
  const creationPromiseRef = useRef<Promise<string | null> | null>(null);

  const ensureChatId = useCallback(
    async (seedTitle?: string): Promise<string | null> => {
      if (!isEnabled()) return null;
      if (chatIdRef.current) return chatIdRef.current;
      if (creationPromiseRef.current) return creationPromiseRef.current;

      const promise = (async () => {
        const userId = await getCurrentUserId();
        if (!userId) return null; // anonymous — stay in-memory
        try {
          const chat = await createChat({ title: seedTitle, mode: data.mode });
          // Update the ref synchronously before any other async gap so the
          // next caller sees the id immediately.
          chatIdRef.current = chat.id;
          setChatId(chat.id);
          // Update URL in place. `router.replace` would trigger a Next.js
          // server fetch of /c/[id], unmounting this provider and destroying
          // the just-appended user message that hasn't been persisted yet
          // — the new page would then server-render an empty chat.
          // `history.replaceState` just updates the address bar.
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.pathname = `/c/${chat.id}`;
            window.history.replaceState(null, "", url.pathname + url.search);
          }
          return chat.id;
        } catch (e) {
          console.warn("[chatPersistence] createChat failed:", e);
          return null;
        }
      })();

      creationPromiseRef.current = promise;
      try {
        return await promise;
      } finally {
        creationPromiseRef.current = null;
      }
    },
    [data.mode, setChatId],
  );

  const persistUserMessage = useCallback(
    async (msg: UserMessage) => {
      if (!isEnabled()) return;
      const userId = await getCurrentUserId();
      if (!userId) return;
      const chatId = await ensureChatId(
        msg.kind === "text" ? msg.content : undefined,
      );
      if (!chatId) return;

      let imagePath: string | undefined;
      if (msg.kind === "attach" && msg.imageBase64) {
        const p = await uploadImage({
          userId,
          chatId,
          messageId: msg.id,
          base64: msg.imageBase64,
          kind: "attach",
        });
        imagePath = p ?? undefined;
        if (imagePath) updateMessage(msg.id, { imagePath });
      }

      try {
        if (msg.kind === "text") {
          await appendMessageRow(chatId, {
            id: msg.id,
            role: "user",
            kind: "text",
            content: msg.content,
          });
        } else {
          await appendMessageRow(chatId, {
            id: msg.id,
            role: "user",
            kind: "attach",
            instruction: msg.instruction,
            imagePath,
          });
        }
      } catch (e) {
        console.warn("[chatPersistence] persist user msg failed:", e);
      }
    },
    [ensureChatId, updateMessage],
  );

  const persistAssistantIcon = useCallback(
    async (msg: AssistantIconMessage, base64: string) => {
      if (!isEnabled()) return;
      const userId = await getCurrentUserId();
      if (!userId) return;
      const chatId = await ensureChatId();
      if (!chatId) return;

      const imagePath = await uploadImage({
        userId,
        chatId,
        messageId: msg.id,
        base64,
        kind: "icon",
      });
      if (imagePath) {
        updateMessage(msg.id, { imagePath });
        update({ iconPath: imagePath });
      }

      try {
        await appendMessageRow(chatId, {
          id: msg.id,
          role: "assistant",
          kind: "icon",
          caption: msg.caption,
          imagePath: imagePath ?? undefined,
        });
      } catch (e) {
        console.warn("[chatPersistence] persist icon msg failed:", e);
      }

      if (imagePath) {
        try {
          await patchChat(chatId, { currentIconPath: imagePath });
        } catch (e) {
          console.warn("[chatPersistence] patch current_icon_path failed:", e);
        }
      }
    },
    [ensureChatId, update, updateMessage],
  );

  const persistAssistantText = useCallback(
    async (msg: AssistantTextMessage) => {
      if (!isEnabled()) return;
      const userId = await getCurrentUserId();
      if (!userId) return;
      // Don't lazy-create a chat for an assistant text (e.g. error message)
      // if there isn't one yet — that would be a weird empty transcript.
      const chatId = chatIdRef.current;
      if (!chatId) return;
      try {
        await appendMessageRow(chatId, {
          id: msg.id,
          role: "assistant",
          kind: "text",
          content: msg.content,
          tone: msg.tone,
          cta: msg.cta ? { label: msg.cta.label, href: msg.cta.href } : undefined,
        });
      } catch (e) {
        console.warn("[chatPersistence] persist assistant text failed:", e);
      }
    },
    [],
  );

  const patchCurrentChat = useCallback(
    async (body: Parameters<typeof patchChat>[1]) => {
      const chatId = chatIdRef.current;
      if (!isEnabled() || !chatId) return;
      try {
        await patchChat(chatId, body);
      } catch (e) {
        console.warn("[chatPersistence] patchCurrentChat failed:", e);
      }
    },
    [],
  );

  const persistAssets = useCallback(
    async (
      assets: AssetFile[],
      expoConfig: Record<string, unknown>,
      backgroundColor: string,
    ): Promise<StoredAsset[]> => {
      if (!isEnabled()) return [];
      const userId = await getCurrentUserId();
      if (!userId) return [];
      const chatId = chatIdRef.current;
      if (!chatId) return [];
      const stored = await uploadAssetsBatch(userId, chatId, assets);
      if (stored.length === 0) return [];
      try {
        await patchChat(chatId, {
          assets: stored,
          expoConfig,
          backgroundColor,
        });
      } catch (e) {
        console.warn("[chatPersistence] patch assets failed:", e);
      }
      return stored;
    },
    [],
  );

  const rehydrateStoredAssets = useCallback(
    async (stored: StoredAsset[]): Promise<AssetFile[]> => {
      if (!isEnabled() || stored.length === 0) return [];
      const supabase = createClient();
      const paths = stored.map((s) => s.path);
      const { data: signed, error } = await supabase.storage
        .from(CHAT_ICONS_BUCKET)
        .createSignedUrls(paths, 60 * 60);
      if (error || !signed) {
        console.warn("[chatPersistence] signed url batch failed:", error?.message);
        return [];
      }
      const urlByPath = new Map<string, string>();
      for (const s of signed) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
      }
      const hydrated = await Promise.all(
        stored.map(async (s): Promise<AssetFile | null> => {
          const url = urlByPath.get(s.path);
          if (!url) return null;
          try {
            const b64 = await urlToBase64(url);
            return {
              name: s.name,
              width: s.width,
              height: s.height,
              has_background: s.has_background,
              platform: s.platform,
              variant: s.variant,
              image_base64: b64,
            };
          } catch (e) {
            console.warn("[chatPersistence] rehydrate asset failed:", s.path, e);
            return null;
          }
        }),
      );
      return hydrated.filter((a): a is AssetFile => a !== null);
    },
    [],
  );

  const hydrateIconBase64 = useCallback(async () => {
    if (data.iconBase64 || !data.iconUrl) return;
    try {
      const b64 = await urlToBase64(data.iconUrl);
      if (b64) update({ iconBase64: b64 });
    } catch (e) {
      console.warn("[chatPersistence] hydrateIconBase64 failed:", e);
    }
  }, [data.iconBase64, data.iconUrl, update]);

  const migrateAnonymousChat = useCallback(
    async (messages: ChatMessage[]): Promise<string | null> => {
      if (!isEnabled() || messages.length === 0) return null;
      const userId = await getCurrentUserId();
      if (!userId) return null;

      try {
        const chat = await createChat({ title: deriveTitle(messages) });
        setChatId(chat.id);

        // Upload images in parallel, then build the bulk insert payload.
        const prepared = await Promise.all(
          messages.map(async (m) => {
            const id = m.id ?? newId();
            if (m.role === "assistant" && m.kind === "icon" && m.iconBase64) {
              const p = await uploadImage({
                userId,
                chatId: chat.id,
                messageId: id,
                base64: m.iconBase64,
                kind: "icon",
              });
              return {
                id,
                role: "assistant" as const,
                kind: "icon" as const,
                caption: m.caption,
                imagePath: p ?? undefined,
              };
            }
            if (m.role === "user" && m.kind === "attach" && m.imageBase64) {
              const p = await uploadImage({
                userId,
                chatId: chat.id,
                messageId: id,
                base64: m.imageBase64,
                kind: "attach",
              });
              return {
                id,
                role: "user" as const,
                kind: "attach" as const,
                instruction: m.instruction,
                imagePath: p ?? undefined,
              };
            }
            if (m.role === "user" && m.kind === "text") {
              return {
                id,
                role: "user" as const,
                kind: "text" as const,
                content: m.content,
              };
            }
            // assistant text (welcome, errors)
            if (m.role === "assistant" && m.kind === "text") {
              return {
                id,
                role: "assistant" as const,
                kind: "text" as const,
                content: m.content,
                tone: m.tone,
                cta: m.cta ? { label: m.cta.label, href: m.cta.href } : undefined,
              };
            }
            return null;
          }),
        );
        const rows = prepared.filter(
          (r): r is NonNullable<typeof r> => r !== null,
        );

        // Point the chat at the latest assistant icon we uploaded.
        let latestIconPath: string | null = null;
        for (const r of rows) {
          if (r.role === "assistant" && r.kind === "icon" && r.imagePath)
            latestIconPath = r.imagePath;
        }

        if (rows.length > 0) {
          await bulkAppendMessageRows(chat.id, rows);
        }
        if (latestIconPath) {
          await patchChat(chat.id, { currentIconPath: latestIconPath });
          update({ iconPath: latestIconPath });
        }

        // Replace URL so reload goes to the persisted chat. In-place update
        // (no router.replace) — a Next.js navigation would unmount this
        // provider and discard the in-memory transcript we just migrated.
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.pathname = `/c/${chat.id}`;
          window.history.replaceState(null, "", url.pathname + url.search);
        }
        return chat.id;
      } catch (e) {
        console.warn("[chatPersistence] migrate failed:", e);
        return null;
      }
    },
    [setChatId, update],
  );

  return {
    persistUserMessage,
    persistAssistantIcon,
    persistAssistantText,
    ensureChatId,
    migrateAnonymousChat,
    patchCurrentChat,
    hydrateIconBase64,
    persistAssets,
    rehydrateStoredAssets,
  };
}
