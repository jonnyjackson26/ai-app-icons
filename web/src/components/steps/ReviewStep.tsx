"use client";

import Button from "@/components/ui/Button";
import IconPreview from "@/components/ui/IconPreview";
import type { WizardAction } from "@/lib/types";

interface Props {
  iconBase64: string;
  editMessage: string;
  dispatch: React.Dispatch<WizardAction>;
}

export default function ReviewStep({
  iconBase64,
  editMessage,
  dispatch,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
        Here&apos;s your icon
      </h2>

      <IconPreview base64={iconBase64} />

      {editMessage && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md mx-auto">
          {editMessage}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => dispatch({ type: "ACCEPT_ICON" })}>
          Looks good
        </Button>
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "REQUEST_REFINE" })}
        >
          Refine
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "START_OVER" })}
        >
          Start over
        </Button>
      </div>
    </div>
  );
}
