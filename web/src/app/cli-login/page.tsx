"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "minting" | "sending" | "done" | "error";

function isLoopbackHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:") return false;
    return u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return false;
  }
}

function CliLoginInner() {
  const params = useSearchParams();
  const cliCallback = params.get("cli_callback");
  const cliToken = params.get("cli_token");
  const cliProject = params.get("cli_project");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cliCallback || !cliToken) {
        setStatus("error");
        setError("Missing CLI callback parameters.");
        return;
      }
      if (!isLoopbackHttpUrl(cliCallback)) {
        setStatus("error");
        setError("Invalid CLI callback URL.");
        return;
      }

      setStatus("minting");
      let plaintextToken: string;
      try {
        const label =
          (typeof navigator !== "undefined" && navigator.platform) ||
          cliProject ||
          "cli";
        const res = await fetch("/api/cli-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        plaintextToken = data.token;
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Failed to mint CLI token.");
        return;
      }

      setStatus("sending");
      try {
        const res = await fetch(cliCallback, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cli-token": cliToken,
          },
          body: JSON.stringify({ token: plaintextToken }),
        });
        if (!res.ok) throw new Error(`Loopback responded ${res.status}`);
        if (!cancelled) setStatus("done");
        setTimeout(() => window.close(), 1500);
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Failed to hand off to CLI.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [cliCallback, cliToken, cliProject]);

  return (
    <div className="mx-auto w-full max-w-md py-16 px-4 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {status === "done" ? "CLI connected." : "Connecting your CLI…"}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {status === "minting" && "Minting a new CLI key…"}
        {status === "sending" && "Sending credentials back to the CLI…"}
        {status === "done" && "You can close this tab and return to your terminal."}
        {status === "error" && error}
        {status === "idle" && "Preparing…"}
      </p>
    </div>
  );
}

export default function CliLoginPage() {
  return (
    <Suspense fallback={null}>
      <CliLoginInner />
    </Suspense>
  );
}
