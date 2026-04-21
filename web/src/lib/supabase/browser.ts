import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton. `@supabase/ssr` stores its session in cookies via a per-client
// state machine; creating a fresh client on every call can trigger redundant
// auth refreshes and, in the worst case, starve `getSession` callers who are
// waiting on a refresh initiated by a different instance. Reuse one.
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return _client;
}
