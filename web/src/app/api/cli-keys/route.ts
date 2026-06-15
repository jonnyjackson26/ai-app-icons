import { NextResponse, type NextRequest } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSelfHost } from "@/lib/chatDbMap";

// Personal API keys for the CLI's non-interactive `--ai` mode. The plaintext
// key (`cak_` + 32 random bytes hex) is returned exactly once on creation; we
// only ever persist its sha256 hash. See supabase/migrations/0006_api_keys.sql
// and api/.../auth.py (`_verify_api_key`).

const KEY_PREFIX = "cak_";

function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

// GET /api/cli-keys — list the caller's keys (metadata only, never the secret).
export async function GET() {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // RLS scopes this to the caller's own rows.
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, prefix, name, created_at, last_used_at, revoked_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
}

// POST /api/cli-keys { name?: string } — mint a new key. Returns the plaintext
// once; it is never retrievable again.
export async function POST(request: NextRequest) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim() || null;

  const plaintext = KEY_PREFIX + randomBytes(32).toString("hex");
  const prefix = plaintext.slice(0, 10); // e.g. "cak_a1b2c3" — display only
  const keyHash = hashKey(plaintext);

  // Insert via the service role so the hash is computed server-side and the
  // (intentionally insert-policy-less) RLS table is written safely.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_keys")
    .insert({ user_id: user.id, key_hash: keyHash, prefix, name })
    .select("id, prefix, name, created_at, last_used_at")
    .single();

  if (error || !data)
    return NextResponse.json(
      { error: error?.message ?? "Failed to create key" },
      { status: 500 },
    );

  return NextResponse.json({ key: { ...data, plaintext } }, { status: 201 });
}

// DELETE /api/cli-keys?id=<uuid> — revoke a key the caller owns.
export async function DELETE(request: NextRequest) {
  if (isSelfHost())
    return NextResponse.json({ error: "Not available in self-host" }, { status: 501 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // RLS (api_keys_update_own) ensures the caller can only revoke their own key.
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
