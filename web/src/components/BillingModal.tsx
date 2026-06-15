"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import Modal from "./ui/Modal";

type Intent = "default" | "success" | "canceled";

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  intent: Intent;
}

interface Summary {
  email: string;
  tier: string;
  used: number;
  limit: number | null;
  hasCustomer: boolean;
}

export default function BillingModal({ open, onClose, intent }: BillingModalProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<"upgrade" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load profile + usage whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setSummary(null);
        setLoading(false);
        return;
      }
      const [profileRes, usageRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("tier, stripe_customer_id")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("usage_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          ),
      ]);
      if (cancelled) return;
      const tier = profileRes.data?.tier ?? "free";
      const limit = tier === "pro" ? 100 : tier === "unlimited" ? null : 5;
      setSummary({
        email: user.email ?? "",
        tier,
        used: usageRes.count ?? 0,
        limit,
        hasCustomer: !!profileRes.data?.stripe_customer_id,
      });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, intent]);

  async function goStripe(action: "upgrade" | "portal") {
    setBusyAction(action);
    setError(null);
    try {
      const url =
        action === "upgrade" ? "/api/stripe/checkout" : "/api/stripe/portal";
      const body = action === "upgrade" ? { tier: "pro" } : {};
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
      setBusyAction(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-6">
        {intent === "success" && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
            <CheckCircle />
            Payment received. Welcome to Pro.
          </div>
        )}
        {intent === "canceled" && (
          <div className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
            Checkout canceled. No charges were made.
          </div>
        )}

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Billing & plan
        </h2>
        {summary && (
          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {summary.email}
          </p>
        )}

        {!summary && !loading && (
          <div className="mt-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to manage your plan.
          </div>
        )}

        {loading && (
          <div className="mt-6 h-24 rounded-lg bg-zinc-50 dark:bg-zinc-950 animate-pulse" />
        )}

        {summary && !loading && (
          <>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Current plan
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                  {summary.tier}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Used (7 days)
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {summary.used}
                  {summary.limit !== null && (
                    <span className="text-zinc-400 dark:text-zinc-500">
                      /{summary.limit}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PlanCard
                name="Free"
                price="$0"
                features={["5 AI calls / week", "Full wizard access"]}
                current={summary.tier === "free"}
              />
              <PlanCard
                name="Pro"
                price="$9.99 / mo"
                features={[
                  "100 AI calls / week",
                  "Priority when we scale",
                  "Cancel anytime",
                ]}
                current={summary.tier === "pro"}
                highlight
                cta={
                  summary.tier === "pro" ? null : (
                    <button
                      type="button"
                      onClick={() => goStripe("upgrade")}
                      disabled={busyAction === "upgrade"}
                      className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {busyAction === "upgrade" ? "Loading…" : "Upgrade"}
                    </button>
                  )
                }
              />
            </div>

            {summary.hasCustomer && (
              <button
                type="button"
                onClick={() => goStripe("portal")}
                disabled={busyAction === "portal"}
                className="mt-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {busyAction === "portal" ? "Opening…" : "Manage subscription"}
              </button>
            )}

            <a
              href="/settings/api-keys"
              className="mt-4 block text-center text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Manage API keys for the CLI (--ai mode) →
            </a>
          </>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </Modal>
  );
}

function PlanCard({
  name,
  price,
  features,
  current,
  highlight,
  cta,
}: {
  name: string;
  price: string;
  features: string[];
  current: boolean;
  highlight?: boolean;
  cta?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        current
          ? "border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/30"
          : highlight
            ? "border-zinc-300 dark:border-zinc-700"
            : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {name}
        </h3>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{price}</span>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-1.5">
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        {current ? (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Current plan
          </span>
        ) : (
          cta
        )}
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
