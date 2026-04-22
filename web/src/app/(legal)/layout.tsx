import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-zinc-950 font-sans">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to AI App Icons
        </Link>
        <article className="mt-8 text-zinc-800 dark:text-zinc-200 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-50 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-sm [&_p]:leading-6 [&_p]:mb-3 [&_ul]:text-sm [&_ul]:leading-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-700 dark:hover:[&_a]:text-blue-300">
          {children}
        </article>
        <footer className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy Policy
          </Link>
        </footer>
      </div>
    </div>
  );
}
