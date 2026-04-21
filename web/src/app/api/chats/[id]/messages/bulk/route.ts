import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateMessageBody } from "@/lib/chatDb";
import { isSelfHost, mapMessageRow } from "@/lib/chatDbMap";

type RouteParams = { params: Promise<{ id: string }> };

// Anonymous-continuity migration: a signed-out user has a short transcript
// in memory; on sign-in we persist the whole thing at once. Capped to keep
// payload + time bounded.
const MAX_BULK = 50;

// POST /api/chats/[id]/messages/bulk — insert many messages at once, in the
// order provided. Server keeps seq monotonic by performing a single multi-row
// insert (Postgres preserves order within a VALUES list for identity assignment).
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: chatId } = await params;
  const body = (await request.json()) as { messages: CreateMessageBody[] };
  if (!Array.isArray(body?.messages) || body.messages.length === 0)
    return NextResponse.json({ error: "messages[] required" }, { status: 400 });
  if (body.messages.length > MAX_BULK)
    return NextResponse.json(
      { error: `At most ${MAX_BULK} messages per bulk insert` },
      { status: 400 },
    );

  const rows = body.messages.map((m) => {
    const r: Record<string, unknown> = {
      chat_id: chatId,
      user_id: user.id,
      role: m.role,
      kind: m.kind,
      content: m.content ?? null,
      caption: m.caption ?? null,
      instruction: m.instruction ?? null,
      image_path: m.imagePath ?? null,
      tone: m.tone ?? null,
      cta: m.cta ?? null,
    };
    if (m.id) r.id = m.id;
    return r;
  });

  const { data, error } = await supabase
    .from("chat_messages")
    .insert(rows)
    .select("*");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: (data ?? []).map(mapMessageRow) }, { status: 201 });
}
