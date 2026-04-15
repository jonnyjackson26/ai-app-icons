"use client";

import { useCallback, useState } from "react";
import Button from "@/components/ui/Button";
import type { WizardAction } from "@/lib/types";

interface Props {
  dispatch: React.Dispatch<WizardAction>;
}

export default function DescribeStep({ dispatch }: Props) {
  const [mode, setMode] = useState<"describe" | "upload" | "convert">("describe");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleGenerate = () => {
    if (!description.trim()) return;
    dispatch({ type: "SET_DESCRIPTION", description: description.trim() });
    dispatch({ type: "GENERATE_START" });
  };

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        dispatch({ type: "UPLOAD_ICON", iconBase64: base64 });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  const handleConvertFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        dispatch({ type: "UPLOAD_LOGO", iconBase64: base64 });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

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
          <Button
            onClick={handleGenerate}
            disabled={!description.trim()}
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
