"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

interface Profile {
  tier: string;
  used: number;
  limit: number | null;
}

// Shown in the header. Three states:
//  - Auth disabled (self-host): render nothing.
//  - Auth enabled, logged out: "Sign in" button.
//  - Auth enabled, logged in: tier chip + menu with usage + sign out.
export default function UserBadge() {
  const authEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authEnabled) {
      console.log("[UserBadge] auth disabled (no NEXT_PUBLIC_SUPABASE_URL)");
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
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    window.location.reload();
  }

  if (!authEnabled) return null;

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        Sign in
      </Link>
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
      ? `${profile.used}/${profile.limit} this week`
      : profile
        ? `${profile.used} this week`
        : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <span className="font-semibold">{tierLabel}</span>
        {usageLabel && (
          <span className="text-zinc-500 dark:text-zinc-400">• {usageLabel}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden z-20">
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {email}
            </p>
          </div>
          <Link
            href="/billing"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Billing & plan
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="w-full border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
