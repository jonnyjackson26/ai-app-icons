// Chat messages support two sources for image data:
//   - `*Base64`: in-memory, used for just-generated icons and the current
//     editable icon (passed to the edit API as-is).
//   - `*Url` + `imagePath`: hydrated from the DB — a signed Storage URL plus
//     the raw path so we can re-sign / upload without re-fetching.
// UI prefers the URL when present (cheap to render, doesn't bloat DOM with
// data-URIs); callers that need a byte string (e.g. editIcon) must have the
// base64 populated first — see hydrateIconBase64() in chatPersistence.

export type ChatMessage =
  | {
      id: string;
      role: "assistant";
      kind: "text";
      content: string;
      streaming?: boolean;
      tone?: "normal" | "error";
      cta?: { label: string; href?: string; onClick?: () => void };
    }
  | {
      id: string;
      role: "assistant";
      kind: "icon";
      iconBase64?: string;
      iconUrl?: string;
      imagePath?: string;
      caption?: string;
    }
  | {
      id: string;
      role: "user";
      kind: "text";
      content: string;
    }
  | {
      id: string;
      role: "user";
      kind: "attach";
      imageBase64?: string;
      imageUrl?: string;
      imagePath?: string;
      instruction: string;
    };

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
