import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Wizard from "@/components/Wizard";
import { WizardProvider } from "@/components/WizardContext";
import HydrationBoundary from "./HydrationBoundary";
import {
  CHAT_ICONS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  type ChatDetailDto,
} from "@/lib/chatDb";
import { mapChatRow, mapMessageRow } from "@/lib/chatDbMap";

// Server component: fetch the chat + messages server-side so the first paint
// already has hydrated state (no flash of empty-state). RLS in Supabase does
// the auth check for us — a foreign chat id just yields no row, which we
// translate to notFound().
export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  // Self-host mode has no DB; /c/[id] is meaningless, fall back to 404.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ data: chat }, { data: messages }] = await Promise.all([
    supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("seq", { ascending: true }),
  ]);

  if (!chat) notFound();

  const paths: string[] = [];
  for (const m of messages ?? []) {
    if (m.image_path) paths.push(m.image_path);
  }
  if (chat.current_icon_path) paths.push(chat.current_icon_path);

  const signedByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(CHAT_ICONS_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedByPath[s.path] = s.signedUrl;
    }
  }

  const mapped = (messages ?? []).map((m) => {
    const row = mapMessageRow(m);
    if (row.imagePath) row.imageSignedUrl = signedByPath[row.imagePath] ?? null;
    return row;
  });

  const dto: ChatDetailDto = {
    chat: mapChatRow(chat),
    messages: mapped,
    currentIconSignedUrl: chat.current_icon_path
      ? (signedByPath[chat.current_icon_path] ?? null)
      : null,
  };

  // `key` ensures state resets when navigating between chats (/c/a → /c/b).
  // `initialDto` seeds provider state synchronously so SSR + client agree
  // on first paint (no hydration mismatch, no setState-during-render).
  return (
    <WizardProvider key={chatId} initialDto={dto}>
      <HydrationBoundary dto={dto}>
        <Suspense fallback={null}>
          <Wizard />
        </Suspense>
      </HydrationBoundary>
    </WizardProvider>
  );
}
