"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, CreditCard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { useModals } from "./ModalProvider";
import { useWizard } from "./WizardContext";

interface Profile {
  tier: string;
  used: number;
  limit: number | null;
}

interface Props {
  collapsed?: boolean;
}

// Lives in the sidebar footer. Three states:
//  - Auth disabled (self-host): render nothing.
//  - Auth enabled, logged out: "Sign in" CTA.
//  - Auth enabled, logged in: stacked profile chip with email + tier/usage.
// Dropdown opens upward (over the chip) so it doesn't get clipped by the
// sidebar bottom edge.
export default function UserBadge({ collapsed = false }: Props) {
  const authEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { openAuth, openBilling } = useModals();
  const { reset } = useWizard();
  const router = useRouter();

  useEffect(() => {
    if (!authEnabled) {
      console.log("[UserBadge] auth disabled");
      return;
    }
    const supabase = createClient();
    console.log("[UserBadge] mounted, checking auth state");
    let cancelled = false;

    async function load(evt?: string) {
      const { data, error } = await supabase.auth.getUser();
      console.log(
        "[UserBadge]",
        evt ? `event=${evt}` : "initial",
        "getUser →",
        { user: data?.user?.email ?? null, error: error?.message ?? null },
      );
      if (cancelled) return;
      const user = data?.user ?? null;
      setEmail(user?.email ?? null);
      if (!user) {
        setProfile(null);
        return;
      }
      const [profileRes, usageRes] = await Promise.all([
        supabase.from("profiles").select("tier").eq("user_id", user.id).single(),
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
      console.log("[UserBadge] profile=", profileRes.data, "usage=", usageRes.count);
      const tier = profileRes.data?.tier ?? "free";
      const limit = tier === "pro" ? 100 : tier === "unlimited" ? null : 5;
      setProfile({ tier, used: usageRes.count ?? 0, limit });
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      console.log("[UserBadge] auth event:", event);
      load(event);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [authEnabled]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function signOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear any in-memory wizard state and return to the home route so the
    // user lands on a clean slate — leaving them on /c/[id] after sign-out
    // would show a stale transcript and 401 on any refine attempt.
    reset();
    router.replace("/");
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }

  if (!authEnabled) return null;

  if (!email) {
    return (
      <button
        type="button"
        onClick={() => openAuth("sign-in")}
        className={`w-full flex items-center ${
          collapsed ? "justify-center" : "justify-center gap-2"
        } h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer`}
      >
        {!collapsed && <span>Sign in</span>}
        {collapsed && <LogOut className="h-4 w-4 rotate-180" aria-hidden="true" />}
      </button>
    );
  }

  const tierLabel =
    profile?.tier === "pro"
      ? "Pro"
      : profile?.tier === "unlimited"
        ? "Unlimited"
        : "Free";
  const usageLabel =
    profile && profile.limit !== null
      ? `${profile.used} / ${profile.limit} this week`
      : profile
        ? `${profile.used} this week`
        : "";
  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        title={collapsed ? email : undefined}
        className={`w-full flex items-center ${
          collapsed ? "justify-center" : "gap-2"
        } px-1.5 py-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer`}
      >
        <span className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {email}
              </span>
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {tierLabel}
                {usageLabel && <> · {usageLabel}</>}
              </span>
            </span>
            <ChevronsUpDown
              className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0"
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${
            collapsed ? "left-full ml-2 bottom-0" : "left-0 right-0 bottom-full mb-1"
          } rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden z-30 min-w-[220px]`}
        >
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {email}
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {tierLabel}
              {usageLabel && <> · {usageLabel}</>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openBilling("default");
            }}
            className="flex w-full items-center gap-2 text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Billing & plan
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
