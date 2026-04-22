import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  CHAT_ICONS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  type ChatSummary,
  type CreateChatBody,
} from "@/lib/chatDb";
import { isSelfHost, mapChatRow } from "@/lib/chatDbMap";

// GET /api/chats — list non-deleted chats for the current user, newest first.
// Returns sidebar-shaped ChatSummary rows with pre-signed thumbnail URLs so the
// client doesn't need to do N roundtrips after the list call.
export async function GET(request: NextRequest) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 100), 200);
  const before = request.nextUrl.searchParams.get("before");

  let query = supabase
    .from("chats")
    .select(
      "id, title, last_message_at, current_icon_path, background_config, deleted_at"
    )
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("last_message_at", before);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paths = (data ?? [])
    .map((r) => r.current_icon_path)
    .filter((p): p is string => !!p);

  const signedByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(CHAT_ICONS_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedByPath[s.path] = s.signedUrl;
    }
  }

  const summaries: ChatSummary[] = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    lastMessageAt: r.last_message_at,
    currentIconPath: r.current_icon_path,
    backgroundConfig: r.background_config ?? null,
    thumbnailUrl: r.current_icon_path
      ? (signedByPath[r.current_icon_path] ?? null)
      : null,
  }));

  return NextResponse.json({ chats: summaries });
}

// POST /api/chats — create a new chat row owned by the current user.
export async function POST(request: NextRequest) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as CreateChatBody;

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: body.title?.trim() || "New chat",
      mode: body.mode ?? null,
    })
    .select("*")
    .single();

  if (error || !data)
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });

  return NextResponse.json({ chat: mapChatRow(data) }, { status: 201 });
}
