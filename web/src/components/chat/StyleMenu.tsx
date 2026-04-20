"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MODES } from "@/lib/generationModes";

const SKIP_ID = "__skip__";

interface StyleMenuProps {
  value: string;
  onChange: (modeId: string) => void;
}

export default function StyleMenu({ value, onChange }: StyleMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const current =
    value === "" ? "Any style" : MODES.find((m) => m.id === value)?.name ?? "Any style";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3l2.6 6.3L21 10l-5 4.6L17.2 21 12 17.8 6.8 21 8 14.6 3 10l6.4-.7L12 3z" />
        </svg>
        <span>{current}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden z-10">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 text-left px-3 py-2 transition-colors cursor-pointer ${
                value === m.id
                  ? "bg-blue-50 dark:bg-blue-950"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <Image
                src={m.image}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {m.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {m.description}
                </p>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 border-t border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer ${
              value === ""
                ? "bg-blue-50 dark:bg-blue-950"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Skip (any style)
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Let the model decide.
            </p>
          </button>
        </div>
      )}
    </div>
  );
}

export { SKIP_ID };
