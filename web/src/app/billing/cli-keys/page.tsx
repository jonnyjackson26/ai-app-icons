import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CliKeysClient from "./CliKeysClient";

export const dynamic = "force-dynamic";

export default async function CliKeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/billing/cli-keys");

  const { data: keys } = await supabase
    .from("cli_api_keys")
    .select("id, label, created_at, last_used_at, revoked_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-2xl py-10 px-4">
      <Link
        href="/billing"
        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Back to billing
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        CLI keys
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        These are the long-lived tokens your <code className="font-mono">create-app-icon</code>{" "}
        CLI uses to authenticate. Each run of{" "}
        <code className="font-mono">create-app-icon login</code> creates a new one.
      </p>

      <CliKeysClient initialKeys={keys ?? []} />
    </div>
  );
}
