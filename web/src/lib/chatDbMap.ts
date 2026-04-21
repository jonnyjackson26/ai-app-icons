import type {
  ChatMessageRow,
  ChatRow,
  PatchChatBody,
  StoredAsset,
} from "./chatDb";
import type { BackgroundConfig } from "./types";

// DB row → camelCased ChatRow. Kept in a separate module so route handlers
// (server-only) can share it with the server component hydrator without
// importing anything browser-specific.

interface RawChat {
  id: string;
  user_id: string;
  title: string;
  title_is_custom: boolean;
  mode: string | null;
  current_icon_path: string | null;
  background_config: BackgroundConfig | null;
  assets: StoredAsset[] | null;
  expo_config: Record<string, unknown> | null;
  background_color: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface RawMessage {
  id: string;
  chat_id: string;
  user_id: string;
  seq: number;
  role: "user" | "assistant";
  kind: "text" | "icon" | "attach";
  content: string | null;
  caption: string | null;
  instruction: string | null;
  image_path: string | null;
  tone: "normal" | "error" | null;
  cta: { label: string; href?: string } | null;
  created_at: string;
}

export function mapChatRow(raw: RawChat): ChatRow {
  return {
    id: raw.id,
    userId: raw.user_id,
    title: raw.title,
    titleIsCustom: raw.title_is_custom,
    mode: raw.mode,
    currentIconPath: raw.current_icon_path,
    backgroundConfig: raw.background_config,
    assets: raw.assets,
    expoConfig: raw.expo_config,
    backgroundColor: raw.background_color,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    lastMessageAt: raw.last_message_at,
  };
}

export function mapMessageRow(raw: RawMessage): ChatMessageRow {
  return {
    id: raw.id,
    chatId: raw.chat_id,
    userId: raw.user_id,
    seq: raw.seq,
    role: raw.role,
    kind: raw.kind,
    content: raw.content,
    caption: raw.caption,
    instruction: raw.instruction,
    imagePath: raw.image_path,
    imageSignedUrl: null,
    tone: raw.tone,
    cta: raw.cta,
    createdAt: raw.created_at,
  };
}

// Whitelist of columns PATCH can touch. Anything not listed here is silently
// dropped so the client can't sneak in user_id / created_at / seq, etc.
export function sanitizePatch(body: PatchChatBody): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const trimmed = body.title.trim();
    out.title = trimmed.length > 0 ? trimmed : "New chat";
    out.title_is_custom = true;
  }
  if (typeof body.mode === "string") out.mode = body.mode;
  if ("currentIconPath" in body) out.current_icon_path = body.currentIconPath;
  if ("backgroundConfig" in body) out.background_config = body.backgroundConfig;
  if ("assets" in body) out.assets = body.assets;
  if ("expoConfig" in body) out.expo_config = body.expoConfig;
  if ("backgroundColor" in body) out.background_color = body.backgroundColor;
  return out;
}

export function isSelfHost(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}
