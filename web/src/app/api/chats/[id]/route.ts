import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  CHAT_ICONS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  type ChatDetailDto,
  type PatchChatBody,
} from "@/lib/chatDb";
import { isSelfHost, mapChatRow, mapMessageRow, sanitizePatch } from "@/lib/chatDbMap";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/chats/[id] — chat row + all messages + signed URLs for anything
// with an image_path. One response is cheaper than N client-side signs.
export async function GET(_req: NextRequest, { params }: RouteParams) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const [{ data: chat, error: chatErr }, { data: messages, error: msgErr }] =
    await Promise.all([
      supabase
        .from("chats")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", id)
        .order("seq", { ascending: true }),
    ]);

  if (chatErr) return NextResponse.json({ error: chatErr.message }, { status: 500 });
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

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

  return NextResponse.json(dto);
}

// PATCH /api/chats/[id] — update wizard state and/or rename. Body fields are
// whitelisted via sanitizePatch; anything else is silently dropped.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as PatchChatBody;
  const patch = sanitizePatch(body);
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("chats")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ chat: mapChatRow(data) });
}

// DELETE /api/chats/[id] — soft delete. Keeps storage files around so a
// future undo / manual GC can recover them; sidebar filter excludes rows
// where deleted_at is not null.
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase
    .from("chats")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
