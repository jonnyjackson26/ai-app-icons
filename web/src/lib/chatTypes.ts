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
      iconBase64: string;
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
      imageBase64: string;
      instruction: string;
    };

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
