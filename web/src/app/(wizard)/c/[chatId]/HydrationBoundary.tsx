"use client";

import { useEffect, useRef } from "react";
import { useWizard } from "@/components/WizardContext";
import type { ChatDetailDto } from "@/lib/chatDb";

// Client wrapper that seeds WizardContext from the server-fetched DTO before
// any child effect runs, then asynchronously fetches the current icon as
// base64 so the edit API (which takes raw bytes) can round-trip it.

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

export default function HydrationBoundary({
  dto,
  children,
}: {
  dto: ChatDetailDto;
  children: React.ReactNode;
}) {
  const { hydrate, update, data } = useWizard();
  const doneRef = useRef(false);

  // Synchronous pre-render hydrate so ChatView's welcome-stream effect sees
  // the populated messages list on its very first run.
  if (!doneRef.current) {
    doneRef.current = true;
    hydrate(dto);
  }

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
