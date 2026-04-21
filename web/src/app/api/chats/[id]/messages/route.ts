import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateMessageBody } from "@/lib/chatDb";
import { isSelfHost, mapMessageRow } from "@/lib/chatDbMap";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/chats/[id]/messages — append one message to a chat. Server
// assigns seq / created_at; client provides the id if it wants to use its
// optimistic in-memory id for the DB row too.
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: chatId } = await params;
  const body = (await request.json()) as CreateMessageBody;

  if (!body.role || !body.kind)
    return NextResponse.json({ error: "role and kind are required" }, { status: 400 });

  // Sanity: kind-specific required fields.
  if (body.kind === "text" && !body.content)
    return NextResponse.json({ error: "content required for text" }, { status: 400 });
  if (body.kind === "attach" && !body.instruction)
    return NextResponse.json({ error: "instruction required for attach" }, { status: 400 });

  const row: Record<string, unknown> = {
    chat_id: chatId,
    user_id: user.id,
    role: body.role,
    kind: body.kind,
    content: body.content ?? null,
    caption: body.caption ?? null,
    instruction: body.instruction ?? null,
    image_path: body.imagePath ?? null,
    tone: body.tone ?? null,
    cta: body.cta ?? null,
  };
  if (body.id) row.id = body.id;

  const { data, error } = await supabase
    .from("chat_messages")
    .insert(row)
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: mapMessageRow(data) }, { status: 201 });
}
