"use client";

import { useState } from "react";

type Props =
  | { action: "upgrade"; tier: string }
  | { action: "portal" };

export default function BillingActions(props: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const url = props.action === "upgrade" ? "/api/stripe/checkout" : "/api/stripe/portal";
      const body = props.action === "upgrade" ? { tier: props.tier } : {};
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Request failed");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
          props.action === "upgrade"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        }`}
      >
        {props.action === "upgrade"
          ? loading
            ? "Loading…"
            : `Upgrade to ${props.tier}`
          : loading
            ? "Opening…"
            : "Manage subscription"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </>
  );
}
