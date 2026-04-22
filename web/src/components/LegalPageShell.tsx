import Link from "next/link";

// Shared wrapper for /terms and /privacy. Renders inside the (wizard) layout
// so the sidebar (auth state, chat list) stays mounted across navigation —
// only the main pane swaps. The footer cross-links let users hop between
// the two legal pages without bouncing off the home route.
export default function LegalPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <article className="text-zinc-800 dark:text-zinc-200 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-50 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-sm [&_p]:leading-6 [&_p]:mb-3 [&_ul]:text-sm [&_ul]:leading-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-700 dark:hover:[&_a]:text-blue-300">
          {children}
        </article>
        <footer className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy Policy
          </Link>
          <Link href="/" className="ml-auto hover:text-zinc-900 dark:hover:text-zinc-100">
            Back to home
          </Link>
        </footer>
      </div>
    </div>
  );
}
