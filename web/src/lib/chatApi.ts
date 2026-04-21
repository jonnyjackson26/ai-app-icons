import type {
  ChatDetailDto,
  ChatRow,
  ChatSummary,
  CreateChatBody,
  CreateMessageBody,
  PatchChatBody,
  ChatMessageRow,
} from "./chatDb";

// Thin fetcher around /api/chats/*. Callers are responsible for catching —
// the persistence hook fires-and-forgets most of these, so silent network
// failures should be treated as non-fatal by the UI (the in-memory state
// is still correct).

async function doFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Chat API error: ${res.status}`);
  }
  return res.json();
}

export async function listChats(): Promise<ChatSummary[]> {
  const { chats } = await doFetch<{ chats: ChatSummary[] }>("/api/chats");
  return chats;
}

export async function createChat(body: CreateChatBody = {}): Promise<ChatRow> {
  const { chat } = await doFetch<{ chat: ChatRow }>("/api/chats", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return chat;
}

export async function getChat(id: string): Promise<ChatDetailDto> {
  return doFetch<ChatDetailDto>(`/api/chats/${id}`);
}

export async function patchChat(id: string, body: PatchChatBody): Promise<ChatRow> {
  const { chat } = await doFetch<{ chat: ChatRow }>(`/api/chats/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return chat;
}

export async function deleteChat(id: string): Promise<void> {
  await doFetch<{ ok: true }>(`/api/chats/${id}`, { method: "DELETE" });
}

export async function appendMessageRow(
  chatId: string,
  body: CreateMessageBody,
): Promise<ChatMessageRow> {
  const { message } = await doFetch<{ message: ChatMessageRow }>(
    `/api/chats/${chatId}/messages`,
    { method: "POST", body: JSON.stringify(body) },
  );
  return message;
}

export async function bulkAppendMessageRows(
  chatId: string,
  messages: CreateMessageBody[],
): Promise<ChatMessageRow[]> {
  const { messages: out } = await doFetch<{ messages: ChatMessageRow[] }>(
    `/api/chats/${chatId}/messages/bulk`,
    { method: "POST", body: JSON.stringify({ messages }) },
  );
  return out;
}
