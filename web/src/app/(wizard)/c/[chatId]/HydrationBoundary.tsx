"use client";

import { useEffect } from "react";
import { useWizard } from "@/components/WizardContext";
import type { ChatDetailDto } from "@/lib/chatDb";

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("[HydrationBoundary] urlToBase64 failed:", e);
    return null;
  }
}

// Since WizardProvider is hoisted to the (wizard) layout, it doesn't have
// access to the per-chat DTO at construction time. This boundary bridges
// the gap: it pushes the server-rendered DTO into the shared provider via
// hydrate() on mount. The page-level `key={chatId}` remounts us on chat
// transitions so this re-runs for /c/a → /c/b navigation.
export default function HydrationBoundary({
  dto,
  children,
}: {
  dto: ChatDetailDto;
  children: React.ReactNode;
}) {
  const { update, hydrate, data } = useWizard();

  // Hydrate as soon as possible. If this is the same chat already in state
  // (e.g. we just created it via ensureChatId), don't clobber the in-memory
  // transcript — the live state is fresher than the server snapshot.
  useEffect(() => {
    if (data.chatId === dto.chat.id) return;
    hydrate(dto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dto.chat.id]);

  // Async side quest: fetch the current icon as raw base64 so the edit API
  // (which takes bytes, not URLs) can round-trip it.
  useEffect(() => {
    const url = dto.currentIconSignedUrl;
    if (!url || data.iconBase64) return;
    let cancelled = false;
    urlToBase64(url).then((b64) => {
      if (!cancelled && b64) update({ iconBase64: b64 });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dto.currentIconSignedUrl]);

  return <>{children}</>;
}
