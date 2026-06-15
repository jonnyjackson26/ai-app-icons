"use client";

import { useCallback, useEffect, useState } from "react";

interface KeyRow {
  id: string;
  prefix: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface NewKey extends KeyRow {
  plaintext: string;
}

const SELF_HOST = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<NewKey | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cli-keys");
      if (res.status === 401) {
        setNeedsAuth(true);
        setKeys([]);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load keys");
      setKeys(data.keys as KeyRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (SELF_HOST) {
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  async function createKey() {
    setCreating(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/cli-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setJustCreated(data.key as NewKey);
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/cli-keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to revoke key");
      if (justCreated?.id === id) setJustCreated(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke key");
    }
  }

  async function copyPlaintext() {
    if (!justCreated) return;
    try {
      await navigator.clipboard.writeText(justCreated.plaintext);
      setCopied(true);
    } catch {
      // Clipboard may be blocked; the value is selectable in the box regardless.
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          API keys
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Use a key to run the CLI non-interactively:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
          AI_APP_ICONS_API_KEY=cak_… npx create-app-icon --ai &quot;an app icon for kite flying locations&quot;
        </pre>

        {SELF_HOST && (
          <div className="mt-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            API keys aren&apos;t needed in self-host mode — the backend doesn&apos;t
            require auth.
          </div>
        )}

        {!SELF_HOST && needsAuth && (
          <div className="mt-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to create and manage API keys.
          </div>
        )}

        {!SELF_HOST && !needsAuth && (
          <>
            {justCreated && (
              <div className="mt-6 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Key created — copy it now. You won&apos;t be able to see it again.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 select-all overflow-x-auto rounded bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900 px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100">
                    {justCreated.plaintext}
                  </code>
                  <button
                    type="button"
                    onClick={copyPlaintext}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-end gap-2">
              <div className="flex-1">
                <label
                  htmlFor="key-name"
                  className="block text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Name (optional)
                </label>
                <input
                  id="key-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CI, my laptop"
                  className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={createKey}
                disabled={creating}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {creating ? "Creating…" : "Create key"}
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Your keys
              </h2>
              {loading && (
                <div className="mt-3 h-16 rounded-lg bg-zinc-50 dark:bg-zinc-900 animate-pulse" />
              )}
              {!loading && keys && keys.length === 0 && (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  No active keys yet.
                </p>
              )}
              {!loading && keys && keys.length > 0 && (
                <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {keys.map((k) => (
                    <li
                      key={k.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {k.name || "Untitled key"}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          <code>{k.prefix}…</code> · created{" "}
                          {new Date(k.created_at).toLocaleDateString()} ·{" "}
                          {k.last_used_at
                            ? `last used ${new Date(k.last_used_at).toLocaleDateString()}`
                            : "never used"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => revokeKey(k.id)}
                        className="shrink-0 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
