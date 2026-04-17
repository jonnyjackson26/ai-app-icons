"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { generateAssets } from "@/lib/api";
import { downloadAllAsZip, downloadBase64Image } from "@/lib/download";
import { useWizard } from "@/components/WizardContext";

const PLATFORM_ORDER = ["general", "ios", "android", "web"] as const;
const PLATFORM_LABELS: Record<string, string> = {
  general: "General",
  ios: "iOS",
  android: "Android",
  web: "Web",
};

const VARIANT_LABELS: Record<string, { label: string; color: string }> = {
  dark: { label: "Dark", color: "bg-zinc-700 text-zinc-100" },
  tinted: { label: "Tinted", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" },
  monochrome: { label: "Mono", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" },
};

export default function ExportStep() {
  const router = useRouter();
  const { data, update, reset } = useWizard();
  const iconBase64 = data.iconBase64!;
  const { assets, expoConfig, backgroundConfig } = data;

  const [configCopied, setConfigCopied] = useState(false);

  useEffect(() => {
    if (assets) return;
    const ac = new AbortController();
    generateAssets(iconBase64, backgroundConfig, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        update({
          assets: res.assets,
          expoConfig: res.expo_config,
          backgroundColor: res.background_color,
          error: null,
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError" || ac.signal.aborted) return;
        update({
          error: err instanceof Error ? err.message : "Asset generation failed",
        });
        router.push("?step=background");
      });
    return () => ac.abort();
  }, [assets, iconBase64, backgroundConfig, router, update]);

  if (!assets) {
    return <Spinner message="Generating all asset sizes..." />;
  }

  const grouped = PLATFORM_ORDER.map((platform) => ({
    platform,
    label: PLATFORM_LABELS[platform],
    items: assets.filter((a) => a.platform === platform),
  })).filter((g) => g.items.length > 0);

  const handleCopyConfig = () => {
    if (!expoConfig) return;
    navigator.clipboard.writeText(JSON.stringify(expoConfig, null, 2));
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    reset();
    router.push("?step=describe");
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
        Your assets are ready!
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => expoConfig && downloadAllAsZip(assets, expoConfig)}>
          Download All (.zip)
        </Button>
        <Button variant="ghost" onClick={handleCreateAnother}>
          Create another icon
        </Button>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4 space-y-3">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Using GitHub Copilot, Cursor, Claude Code or another AI tool? You can
          skip the steps below and let your AI assistant handle them for you.
        </p>
        <button
          type="button"
          onClick={() => {
            /* placeholder */
          }}
          className="text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 cursor-pointer"
        >
          Get setup instructions for GitHub Copilot, Claude Code...
        </button>
      </div>

      {grouped.map((group) => (
        <div key={group.platform} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {group.items.map((asset) => (
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
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {asset.name}
                  </p>
                  {VARIANT_LABELS[asset.variant] && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${VARIANT_LABELS[asset.variant].color}`}
                    >
                      {VARIANT_LABELS[asset.variant].label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {asset.width}&times;{asset.height}
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
        </div>
      ))}

      {expoConfig && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Expo Configuration
          </h3>
          <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-4">
            <button
              onClick={handleCopyConfig}
              className="absolute top-3 right-3 text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer"
            >
              {configCopied ? "Copied!" : "Copy"}
            </button>
            <pre className="text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
              {JSON.stringify(expoConfig, null, 2)}
            </pre>
            <p className="mt-3 text-xs text-zinc-400">
              Add this to your app.json to use these assets.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
