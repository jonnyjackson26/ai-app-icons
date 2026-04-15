import JSZip from "jszip";
import type { AssetFile } from "./types";

function base64ToBlob(base64: string, mime = "image/png"): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

export function downloadBase64Image(base64: string, filename: string) {
  const blob = base64ToBlob(base64);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadAllAsZip(
  assets: AssetFile[],
  expoConfig: Record<string, unknown>,
) {
  const zip = new JSZip();
  const assetsFolder = zip.folder("assets")!;

  for (const asset of assets) {
    const binary = atob(asset.image_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    assetsFolder.file(asset.name, bytes);
  }

  zip.file("app.json.snippet", JSON.stringify(expoConfig, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "app-icons.zip";
  a.click();
  URL.revokeObjectURL(url);
}
