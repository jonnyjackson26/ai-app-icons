"use client";

import { useEffect, useState } from "react";

const SEG = {
  heading: "Welcome to ai-app-icons!",
  p1a: "First, I'll generate a ",
  p1b: "logo",
  p1c: " for your app — just the artwork, no background yet.",
  p2: "Once you like the logo, pick a background and I'll generate every asset your Expo app needs:",
  items: ["iOS", "Android", "Splash", "Favicon"] as const,
  link: "Watch the demo",
};

const TOTAL =
  SEG.heading.length +
  SEG.p1a.length +
  SEG.p1b.length +
  SEG.p1c.length +
  SEG.p2.length +
  SEG.items.reduce((s, t) => s + t.length, 0) +
  SEG.link.length;

const CHARS_PER_TICK = 2;
const INTERVAL_MS = 25;

export default function WelcomeBubble({ animate }: { animate: boolean }) {
  const [cursor, setCursor] = useState(animate ? 0 : TOTAL);

  useEffect(() => {
    if (!animate) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCursor(TOTAL);
      return;
    }
    const id = window.setInterval(() => {
      setCursor((c) => {
        const next = Math.min(c + CHARS_PER_TICK, TOTAL);
        if (next >= TOTAL) window.clearInterval(id);
        return next;
      });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [animate]);

  let pos = 0;
  const take = (text: string): string => {
    const start = pos;
    pos += text.length;
    return text.slice(0, Math.max(0, Math.min(text.length, cursor - start)));
  };

  const heading = take(SEG.heading);
  const p1a = take(SEG.p1a);
  const p1b = take(SEG.p1b);
  const p1c = take(SEG.p1c);
  const p2 = take(SEG.p2);
  const items = SEG.items.map(take);
  const link = take(SEG.link);

  return (
    <>
      {heading.length > 0 && <p className="font-semibold mb-2">{heading}</p>}
      {p1a.length > 0 && (
        <p className="mb-2">
          {p1a}
          <em>{p1b}</em>
          {p1c}
        </p>
      )}
      {p2.length > 0 && <p className="mb-2">{p2}</p>}
      {items.some((t) => t.length > 0) && (
        <ul className="list-disc pl-5 mb-3">
          {items.map((t, i) => (t.length > 0 ? <li key={i}>{t}</li> : null))}
        </ul>
      )}
      {link.length > 0 && (
        <p>
          <a
            href="https://www.youtube.com/watch?v=2Usm8v8W-KU"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {link}
          </a>
        </p>
      )}
    </>
  );
}
