import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ContentPageShell from "@/components/ContentPageShell";

export const metadata: Metadata = {
  title: "Blog — AI App Icons",
  description:
    "Guides on iOS and Android app icons, Expo setup, icon design principles, and a showcase of apps using AI App Icons.",
};

interface Post {
  href: string;
  title: string;
  summary: string;
  tag: "Guide" | "Showcase";
}

const POSTS: Post[] = [
  {
    href: "/ios-app-icon-sizes",
    title: "iOS App Icon Sizes: Complete 2026 Guide",
    summary:
      "Every iOS and iPadOS icon size the App Store requires, what each one is used for, and why you only need to ship one 1024×1024 in 2026.",
    tag: "Guide",
  },
  {
    href: "/android-adaptive-icons",
    title: "Android Adaptive Icons Explained",
    summary:
      "Foreground, background, and monochrome layers, the safe zone, and themed icons on Android 13+ — with the pitfalls that crop your logo on circular launchers.",
    tag: "Guide",
  },
  {
    href: "/expo-app-icons",
    title: "Expo App Icons: Setup Guide",
    summary:
      "Every icon field in app.json, how Expo generates iOS dark and tinted variants, and how to avoid the EAS icon cache after you swap assets.",
    tag: "Guide",
  },
  {
    href: "/app-icon-design-tips",
    title: "App Icon Design: Best Practices & Common Mistakes",
    summary:
      "Six principles for icons that survive from 1024×1024 down to 40×40, plus a four-step test to catch problems before you ship.",
    tag: "Guide",
  },
  {
    href: "/hall-of-fame",
    title: "Hall of Fame",
    summary:
      "Apps shipping to real users with icons generated here. Want your app featured? Submit a PR.",
    tag: "Showcase",
  },
];

export default function BlogPage() {
  return (
    <ContentPageShell>
      <h1>Blog</h1>
      <p>
        Guides on shipping app icons that look right on every device, and a
        showcase of apps built with AI App Icons.
      </p>

      <div className="mt-6 flex flex-col gap-3 not-prose">
        {POSTS.map((post) => (
          <Link
            key={post.href}
            href={post.href}
            className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {post.tag}
            </div>
            <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
              <ArrowRight className="inline-block ml-1 h-3.5 w-3.5 -translate-y-0.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {post.summary}
            </p>
          </Link>
        ))}
      </div>
    </ContentPageShell>
  );
}
