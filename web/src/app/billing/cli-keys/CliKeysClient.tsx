"use client";

import { useState } from "react";

interface CliKey {
  id: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default function CliKeysClient({ initialKeys }: { initialKeys: CliKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revoke(id: string) {
    if (!confirm("Revoke this CLI key? The CLI using it will get a 401 on its next call.")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/cli-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setBusy(null);
    }
  }

  if (keys.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No CLI keys yet. Run{" "}
        <code className="font-mono">npx create-app-icon login</code> to create one.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {keys.map((k) => (
        <div
          key={k.id}
          className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {k.label || "(unlabeled)"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Created {new Date(k.created_at).toLocaleDateString()}
              {k.last_used_at
                ? ` • Last used ${new Date(k.last_used_at).toLocaleDateString()}`
                : " • Never used"}
              {k.revoked_at ? " • Revoked" : ""}
            </p>
          </div>
          {!k.revoked_at && (
            <button
              type="button"
              onClick={() => revoke(k.id)}
              disabled={busy === k.id}
              className="shrink-0 rounded-md border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              {busy === k.id ? "Revoking…" : "Revoke"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
