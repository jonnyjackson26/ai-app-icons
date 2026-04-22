"use client";

import { useMemo, useRef, useState } from "react";
import Modal from "./ui/Modal";
import {
  ALL_EMOJIS,
  ALL_ICONS,
  EMOJI_CATEGORIES,
  ICON_CATEGORIES,
  type PickableIcon,
} from "@/lib/iconPickerAssets";
import {
  renderEmojiToBase64,
  renderSvgElementToBase64,
} from "@/lib/iconRenderer";

type Tab = "emoji" | "icon";

const PRESET_COLORS = [
  "#000000", "#ffffff", "#3b82f6", "#ef4444", "#22c55e",
  "#eab308", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (base64: string, label: string) => void;
}

export default function IconEmojiPickerModal({ open, onClose, onPick }: Props) {
  const [tab, setTab] = useState<Tab>("emoji");
  const [query, setQuery] = useState("");
  const [iconColor, setIconColor] = useState<string>(PRESET_COLORS[0]);

  // Hidden mount used to grab a real, in-DOM <svg> for the chosen Lucide icon
  // before rasterizing — XMLSerializer needs a node, not a React element.
  const stagingRef = useRef<HTMLDivElement | null>(null);

  const filteredEmojis = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    // Emojis don't carry searchable text — fall back to "no filter" rather
    // than hiding everything when the user types in the emoji tab.
    return ALL_EMOJIS;
  }, [query]);

  const filteredIcons = useMemo<PickableIcon[] | null>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ICONS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.keywords ?? "").toLowerCase().includes(q),
    );
  }, [query]);

  const handlePickEmoji = (emoji: string) => {
    try {
      const base64 = renderEmojiToBase64(emoji);
      onPick(base64, `Emoji ${emoji}`);
    } catch (err) {
      console.error("[IconEmojiPicker] emoji render failed", err);
    }
  };

  const handlePickIcon = async (icon: PickableIcon, btn: HTMLButtonElement) => {
    const svg = btn.querySelector("svg");
    if (!svg) return;
    try {
      const base64 = await renderSvgElementToBase64(svg, iconColor);
      onPick(base64, `Icon ${icon.name}`);
    } catch (err) {
      console.error("[IconEmojiPicker] svg render failed", err);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[80vh]">
        <div className="px-5 pt-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Pick an emoji or icon
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            We&apos;ll use it as your app&apos;s logo — pick a background next.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <TabButton active={tab === "emoji"} onClick={() => setTab("emoji")}>
              Emoji
            </TabButton>
            <TabButton active={tab === "icon"} onClick={() => setTab("icon")}>
              Icon
            </TabButton>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "icon" ? "Search icons…" : "Search…"}
              className="flex-1 ml-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {tab === "icon" && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Color:
              </span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setIconColor(c)}
                  aria-label={`Use color ${c}`}
                  className={`h-6 w-6 rounded-full border transition-transform cursor-pointer ${
                    iconColor === c
                      ? "border-blue-500 ring-2 ring-blue-300 scale-110"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="ml-1 inline-flex items-center cursor-pointer">
                <input
                  type="color"
                  value={iconColor}
                  onChange={(e) => setIconColor(e.target.value)}
                  className="h-6 w-6 rounded-full border border-zinc-300 dark:border-zinc-600 cursor-pointer p-0"
                  aria-label="Custom color"
                />
              </label>
            </div>
          )}
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {tab === "emoji" ? (
            <EmojiPanel filtered={filteredEmojis} onPick={handlePickEmoji} />
          ) : (
            <IconPanel
              filtered={filteredIcons}
              iconColor={iconColor}
              onPick={handlePickIcon}
            />
          )}
        </div>

        <div ref={stagingRef} aria-hidden className="hidden" />
      </div>
    </Modal>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
        active
          ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900"
          : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function EmojiPanel({
  filtered,
  onPick,
}: {
  filtered: string[] | null;
  onPick: (e: string) => void;
}) {
  if (filtered) {
    return (
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
        {filtered.map((e, i) => (
          <EmojiCell key={`${e}-${i}`} emoji={e} onClick={() => onPick(e)} />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {EMOJI_CATEGORIES.map((cat) => (
        <section key={cat.name}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {cat.name}
          </h3>
          <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
            {cat.emojis.map((e, i) => (
              <EmojiCell
                key={`${cat.name}-${e}-${i}`}
                emoji={e}
                onClick={() => onPick(e)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmojiCell({
  emoji,
  onClick,
}: {
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square flex items-center justify-center rounded-lg text-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      title={emoji}
    >
      {emoji}
    </button>
  );
}

function IconPanel({
  filtered,
  iconColor,
  onPick,
}: {
  filtered: PickableIcon[] | null;
  iconColor: string;
  onPick: (icon: PickableIcon, btn: HTMLButtonElement) => void | Promise<void>;
}) {
  if (filtered) {
    if (filtered.length === 0) {
      return (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No icons match your search.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {filtered.map((icon) => (
          <IconCell
            key={icon.name}
            icon={icon}
            iconColor={iconColor}
            onPick={onPick}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {ICON_CATEGORIES.map((cat) => (
        <section key={cat.name}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {cat.name}
          </h3>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {cat.icons.map((icon) => (
              <IconCell
                key={`${cat.name}-${icon.name}`}
                icon={icon}
                iconColor={iconColor}
                onPick={onPick}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IconCell({
  icon,
  iconColor,
  onPick,
}: {
  icon: PickableIcon;
  iconColor: string;
  onPick: (icon: PickableIcon, btn: HTMLButtonElement) => void | Promise<void>;
}) {
  const Component = icon.Component;
  return (
    <button
      type="button"
      onClick={(e) => onPick(icon, e.currentTarget)}
      className="aspect-square flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
      title={icon.name}
    >
      <Component
        width={28}
        height={28}
        strokeWidth={1.6}
        style={{ color: iconColor }}
      />
    </button>
  );
}
