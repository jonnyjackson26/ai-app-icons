"use client";

import { useEffect } from "react";
import Spinner from "@/components/ui/Spinner";
import { generateIcon } from "@/lib/api";
import type { WizardAction } from "@/lib/types";

interface Props {
  description: string;
  dispatch: React.Dispatch<WizardAction>;
}

export default function GeneratingStep({ description, dispatch }: Props) {
  useEffect(() => {
    let cancelled = false;

    generateIcon(description)
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: "GENERATE_SUCCESS", iconBase64: res.image_base64 });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          dispatch({
            type: "GENERATE_ERROR",
            error: err instanceof Error ? err.message : "Generation failed",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [description, dispatch]);

  return <Spinner message="Generating your icon..." />;
}
