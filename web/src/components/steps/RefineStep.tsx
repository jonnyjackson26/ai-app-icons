"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import IconPreview from "@/components/ui/IconPreview";
import Spinner from "@/components/ui/Spinner";
import { editIcon } from "@/lib/api";
import type { WizardAction } from "@/lib/types";

interface Props {
  iconBase64: string;
  dispatch: React.Dispatch<WizardAction>;
}

export default function RefineStep({ iconBase64, dispatch }: Props) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    dispatch({ type: "REFINE_START" });

    try {
      const res = await editIcon(iconBase64, instruction.trim());
      dispatch({
        type: "REFINE_SUCCESS",
        iconBase64: res.image_base64,
        message: res.message,
      });
    } catch (err) {
      dispatch({
        type: "REFINE_ERROR",
        error: err instanceof Error ? err.message : "Edit failed",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
        Refine your icon
      </h2>

      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="relative shrink-0">
          <IconPreview base64={iconBase64} size="md" />
          {loading && (
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
            disabled={loading}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleApply();
              }
            }}
          />
          <div className="flex gap-3">
            <Button
              onClick={handleApply}
              disabled={!instruction.trim() || loading}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "ACCEPT_ICON" })}
              disabled={loading}
            >
              Skip — keep current
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
