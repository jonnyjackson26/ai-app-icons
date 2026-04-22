// Display metadata for icon-generation style modes.
//
// This file mirrors `api/src/ai_app_icons/modes.py` for UI display only.
// The backend is the source of truth for the actual style prompt text.
// If you add, rename, or remove a mode, update both files.

export interface GenerationMode {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const MODES: GenerationMode[] = [
  { id: "flat",             name: "Flat",             description: "Bold geometric shapes, solid colors, no shadows.",   image: "/style-examples/flat.png" },
  { id: "ios-liquid-glass", name: "iOS Liquid Glass", description: "Glossy translucent material with soft refraction.", image: "/style-examples/ios-liquid-glass.png" },
  { id: "single-color",     name: "Single Color",     description: "One-color silhouette on transparent background.",    image: "/style-examples/single-color.png" },
  { id: "3d",               name: "3D",               description: "Rendered 3D object with soft lighting and depth.",   image: "/style-examples/3d.png" },
];

export const DEFAULT_MODE_ID = "flat";
