"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import Modal from "./ui/Modal";

type Step = "enterEmail" | "enterCode";
type Reason = "sign-in" | "quota";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  reason: Reason;
}

export default function AuthModal({ open, onClose, reason }: AuthModalProps) {
  const [step, setStep] = useState<Step>("enterEmail");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state each time it opens so it doesn't show a stale code
  // input from a previous abandoned sign-in.
  useEffect(() => {
    if (open) {
      setStep("enterEmail");
      setCode("");
      setBusy(false);
      setError(null);
    }
  }, [open]);

  // Auto-close when the user becomes authenticated (after Google OAuth
  // returns, or on verifyOtp success).
  useEffect(() => {
    if (!open) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") onClose();
    });
    return () => data.subscription.unsubscribe();
  }, [open, onClose]);

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      window.location.pathname + window.location.search,
    )}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("enterCode");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // onAuthStateChange closes the modal.
  }

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      window.location.pathname + window.location.search,
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setError(error.message);
  }

  const heading = reason === "quota" ? "Sign in to keep generating" : "Sign in";
  const sub =
    reason === "quota"
      ? "You've used your anonymous preview. Sign in for 5 free AI calls per week, or upgrade to Pro for 100."
      : "Free tier includes 5 AI calls per week.";

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{sub}</p>

        {step === "enterEmail" ? (
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <GoogleG />
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              <span>or</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <form onSubmit={sendEmail} className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !email}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {busy ? "Sending..." : "Email me a code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mt-5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              We sent a code to <span className="font-medium">{email}</span>.
            </div>

            <form onSubmit={verifyCode} className="mt-4 space-y-3">
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-3 text-center text-xl font-mono tracking-[0.4em] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={busy || code.length < 6}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {busy ? "Verifying..." : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setStep("enterEmail")}
                className="w-full text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                Use a different email
              </button>
            </form>
          </>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </Modal>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C41 36 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
