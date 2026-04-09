"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { generateAssets } from "@/lib/api";
import { downloadAllAsZip, downloadBase64Image } from "@/lib/download";
import type { AssetFile, BackgroundConfig, WizardAction } from "@/lib/types";

interface Props {
  iconBase64: string;
  backgroundConfig: BackgroundConfig;
  assets: AssetFile[] | null;
  dispatch: React.Dispatch<WizardAction>;
}

export default function ExportStep({
  iconBase64,
  backgroundConfig,
  assets,
  dispatch,
}: Props) {
  const [loading, setLoading] = useState(!assets);

  useEffect(() => {
    if (assets) return;

    generateAssets(iconBase64, backgroundConfig)
      .then((res) => {
        dispatch({ type: "EXPORT_SUCCESS", assets: res.assets });
        setLoading(false);
      })
      .catch((err) => {
        dispatch({
          type: "EXPORT_ERROR",
          error: err instanceof Error ? err.message : "Asset generation failed",
        });
        setLoading(false);
      });
  }, [iconBase64, backgroundConfig, assets, dispatch]);

  if (loading) {
    return <Spinner message="Generating all asset sizes..." />;
  }

  if (!assets) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
        Your assets are ready!
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.name}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-center space-y-2"
          >
            <div
              className="mx-auto w-20 h-20 rounded-lg overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), " +
                  "linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), " +
                  "linear-gradient(45deg, transparent 75%, #e5e7eb 75%), " +
                  "linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                backgroundSize: "10px 10px",
                backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${asset.image_base64}`}
                alt={asset.name}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {asset.name}
            </p>
            <p className="text-xs text-zinc-400">
              {asset.width}&times;{asset.height}
            </p>
            <p className="text-xs text-zinc-400">
              {asset.has_background ? "with bg" : "transparent"}
            </p>
            <button
              onClick={() =>
                downloadBase64Image(asset.image_base64, asset.name)
              }
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
            >
              Download
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => downloadAllAsZip(assets)}>
          Download All (.zip)
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "START_OVER" })}
        >
          Create another icon
        </Button>
      </div>
    </div>
  );
}
