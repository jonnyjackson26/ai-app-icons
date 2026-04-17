"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import IconPreview from "@/components/ui/IconPreview";
import Spinner from "@/components/ui/Spinner";
import { editIcon } from "@/lib/api";
import { useWizard } from "@/components/WizardContext";

export default function ReviewStep() {
  const router = useRouter();
  const { data, update, reset } = useWizard();
  const iconBase64 = data.iconBase64!;

  const [refining, setRefining] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [pendingEdit, setPendingEdit] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingEdit) return;
    const ac = new AbortController();
    editIcon(iconBase64, pendingEdit, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        update({
          iconBase64: res.image_base64,
          editMessage: res.message,
          error: null,
        });
        setInstruction("");
        setRefining(false);
        setPendingEdit(null);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || ac.signal.aborted) return;
        update({
          error: err instanceof Error ? err.message : "Edit failed",
        });
        setPendingEdit(null);
      });
    return () => ac.abort();
  }, [pendingEdit, iconBase64, update]);

  const isEditing = pendingEdit !== null;
  const applyEdit = () => {
    const text = instruction.trim();
    if (text && !isEditing) setPendingEdit(text);
  };

  const handleStartOver = () => {
    reset();
    router.push("?step=describe");
  };

  if (refining) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
          Refine your icon
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="relative shrink-0">
            <IconPreview base64={iconBase64} size="md" />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 rounded-2xl">
                <Spinner />
              </div>
            )}
          </div>

          <div className="flex-1 w-full space-y-4">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Make the colors warmer"
              rows={3}
              disabled={isEditing}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  applyEdit();
                }
              }}
            />
            <div className="flex gap-3">
              <Button
                onClick={applyEdit}
                disabled={!instruction.trim() || isEditing}
              >
                Apply
              </Button>
              <Button
                variant="ghost"
                onClick={() => setRefining(false)}
                disabled={isEditing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
        Here&apos;s your icon
      </h2>

      <IconPreview base64={iconBase64} />

      {data.editMessage && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md mx-auto">
          {data.editMessage}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => router.push("?step=background")}>
          Looks good
        </Button>
        <Button variant="secondary" onClick={() => setRefining(true)}>
          Refine
        </Button>
        <Button variant="ghost" onClick={handleStartOver}>
          Start over
        </Button>
      </div>
    </div>
  );
}
