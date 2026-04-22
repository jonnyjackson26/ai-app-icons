import Link from "next/link";

// Shared wrapper for any long-form content page (legal, SEO guides, Hall of
// Fame). Lives inside the (wizard) layout so the sidebar (auth state, chat
// list) stays mounted across navigation — only the main pane swaps. Provides
// consistent prose styling and a standard footer with legal + home links.
export default function ContentPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <article className="text-zinc-800 dark:text-zinc-200 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-50 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-6 [&_p]:mb-3 [&_ul]:text-sm [&_ul]:leading-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:text-sm [&_ol]:leading-6 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_code]:text-[0.85em] [&_code]:bg-zinc-100 dark:[&_code]:bg-zinc-800 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_p_a]:text-blue-600 dark:[&_p_a]:text-blue-400 [&_p_a]:underline [&_p_a]:underline-offset-2 hover:[&_p_a]:text-blue-700 dark:hover:[&_p_a]:text-blue-300 [&_li_a]:text-blue-600 dark:[&_li_a]:text-blue-400 [&_li_a]:underline [&_li_a]:underline-offset-2 hover:[&_li_a]:text-blue-700 dark:hover:[&_li_a]:text-blue-300">
          {children}
        </article>
        <footer className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Blog
          </Link>
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy
          </Link>
          <Link href="/hall-of-fame" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Hall of Fame
          </Link>
          <Link href="/" className="ml-auto hover:text-zinc-900 dark:hover:text-zinc-100">
            Back to home
          </Link>
        </footer>
      </div>
    </div>
  );
}
