import type { AssetFile, BackgroundConfig } from "./types";

// Types mirroring the Supabase `chats` + `chat_messages` tables. Camel-cased
// at this boundary so the rest of the web app never touches snake_case.

export interface ChatRow {
  id: string;
  userId: string;
  title: string;
  titleIsCustom: boolean;
  mode: string | null;
  currentIconPath: string | null;
  backgroundConfig: BackgroundConfig | null;
  assets: StoredAsset[] | null;
  expoConfig: Record<string, unknown> | null;
  backgroundColor: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  lastMessageAt: string;
  currentIconPath: string | null;
  thumbnailUrl: string | null;
}

// On disk we never store base64. The export step's AssetFile carries base64
// only in memory; when we persist it we drop image_base64 and store a Storage
// path instead. On hydrate, we fetch signed URLs and turn them back into
// base64-shaped AssetFile for the existing ExportStep UI.
export type StoredAsset = Omit<AssetFile, "image_base64"> & {
  path: string;
};

export type MessageRole = "user" | "assistant";
export type MessageKind = "text" | "icon" | "attach";

export interface ChatMessageRow {
  id: string;
  chatId: string;
  userId: string;
  seq: number;
  role: MessageRole;
  kind: MessageKind;
  content: string | null;
  caption: string | null;
  instruction: string | null;
  imagePath: string | null;
  imageSignedUrl: string | null;
  tone: "normal" | "error" | null;
  cta: { label: string; href?: string } | null;
  createdAt: string;
}

export interface ChatDetailDto {
  chat: ChatRow;
  messages: ChatMessageRow[];
  currentIconSignedUrl: string | null;
}

export interface CreateChatBody {
  title?: string;
  mode?: string;
}

export interface PatchChatBody {
  title?: string;
  mode?: string;
  currentIconPath?: string | null;
  backgroundConfig?: BackgroundConfig | null;
  assets?: StoredAsset[] | null;
  expoConfig?: Record<string, unknown> | null;
  backgroundColor?: string | null;
}

export interface CreateMessageBody {
  id?: string;
  role: MessageRole;
  kind: MessageKind;
  content?: string;
  caption?: string;
  instruction?: string;
  imagePath?: string;
  tone?: "normal" | "error";
  cta?: { label: string; href?: string };
}

export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h
export const CHAT_ICONS_BUCKET = "chat-icons";
