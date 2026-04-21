import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_PREFIX = "caik_live_";

function mintToken(): { plaintext: string; hash: string } {
  const plaintext = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, hash };
}

// POST /api/cli-keys — mint a new long-lived CLI token for the logged-in user.
// Body: { label?: string }. Returns plaintext token ONCE.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const label = typeof body?.label === "string" ? body.label.slice(0, 120) : null;

  const { plaintext, hash } = mintToken();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cli_api_keys")
    .insert({ user_id: user.id, token_hash: hash, label })
    .select("id, created_at, label")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    label: data.label,
    created_at: data.created_at,
    token: plaintext, // shown once, never again
  });
}

// GET /api/cli-keys — list (metadata only) for the logged-in user.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("cli_api_keys")
    .select("id, label, created_at, last_used_at, revoked_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data });
}
