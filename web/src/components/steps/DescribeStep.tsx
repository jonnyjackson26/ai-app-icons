"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { MODES } from "@/lib/generationModes";
import { generateIcon } from "@/lib/api";
import { useWizard } from "@/components/WizardContext";

const SKIP_MODE = "__skip__";

export default function DescribeStep() {
  const router = useRouter();
  const { data, update } = useWizard();

  const [mode, setMode] = useState<"describe" | "upload" | "convert">("describe");
  const [description, setDescription] = useState(data.description);
  const [styleMode, setStyleMode] = useState<string | null>(
    data.mode ? data.mode : null
  );
  const [dragging, setDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const requestRef = useRef<{ desc: string; mode: string } | null>(null);

  useEffect(() => {
    update({ description });
  }, [description, update]);
  useEffect(() => {
    if (styleMode && styleMode !== SKIP_MODE) update({ mode: styleMode });
    if (styleMode === SKIP_MODE) update({ mode: "" });
  }, [styleMode, update]);

  useEffect(() => {
    if (!isGenerating || !requestRef.current) return;
    const { desc, mode: effectiveMode } = requestRef.current;
    const ac = new AbortController();
    generateIcon(desc, effectiveMode, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        update({ iconBase64: res.image_base64, editMessage: "", error: null });
        router.push("?step=review");
      })
      .catch((err) => {
        if (err?.name === "AbortError" || ac.signal.aborted) return;
        update({
          error: err instanceof Error ? err.message : "Generation failed",
        });
        setIsGenerating(false);
      });
    return () => ac.abort();
  }, [isGenerating, router, update]);

  const handleGenerate = useCallback(() => {
    if (!description.trim() || styleMode === null || isGenerating) return;
    requestRef.current = {
      desc: description.trim(),
      mode: styleMode === SKIP_MODE ? "" : styleMode,
    };
    setIsGenerating(true);
  }, [description, styleMode, isGenerating]);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        update({ iconBase64: base64, editMessage: "", error: null });
        router.push("?step=review");
      };
      reader.readAsDataURL(file);
    },
    [router, update]
  );

  const handleConvertFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        update({ iconBase64: base64, editMessage: "", error: null });
        router.push("?step=background");
      };
      reader.readAsDataURL(file);
    },
    [router, update]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  if (isGenerating) {
    return <Spinner message="Generating your icon..." />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        What should your icon look like?
      </h2>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("describe")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
            mode === "describe"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Describe it
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
            mode === "upload"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Upload an image
        </button>
        <button
          onClick={() => setMode("convert")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
            mode === "convert"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Generate assets from logo
        </button>
      </div>

      {mode === "describe" && (
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A friendly robot mascot for a coding education app"
            rows={4}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Style
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setStyleMode(m.id)}
                  className={`rounded-lg border-2 p-3 text-left transition-colors cursor-pointer ${
                    styleMode === m.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {m.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {m.description}
                  </p>
                </button>
              ))}
              <button
                onClick={() => setStyleMode(SKIP_MODE)}
                className={`rounded-lg border-2 border-dashed p-3 text-left transition-colors cursor-pointer ${
                  styleMode === SKIP_MODE
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
                }`}
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Skip
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  No specific style — let the model decide.
                </p>
              </button>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || styleMode === null}
            className="w-full sm:w-auto"
          >
            Generate Icon
          </Button>
        </div>
      )}

      {mode === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-zinc-300 dark:border-zinc-600"
          }`}
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Drag & drop an image here, or
          </p>
          <label className="cursor-pointer">
            <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Browse files
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            PNG, JPG, or WebP
          </p>
        </div>
      )}

      {mode === "convert" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
              handleConvertFile(file);
            }
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-zinc-300 dark:border-zinc-600"
          }`}
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Drag & drop your logo here, or
          </p>
          <label className="cursor-pointer">
            <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Browse files
            </span>
            <input
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleConvertFile(file);
              }}
            />
          </label>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Your logo will be used as-is — no AI generation or refinement
          </p>
        </div>
      )}
    </div>
  );
}
