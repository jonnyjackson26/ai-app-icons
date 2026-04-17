export interface BackgroundPreset {
  id: string;
  name: string;
  colors: string[];
  direction: string;
}

export const PRESETS: BackgroundPreset[] = [
  { id: "sunset",   name: "Sunset",   colors: ["#ff9966", "#ff5e62"],                       direction: "to-bottom-right" },
  { id: "ocean",    name: "Ocean",    colors: ["#2193b0", "#6dd5ed"],                       direction: "to-bottom" },
  { id: "midnight", name: "Midnight", colors: ["#0f0c29", "#302b63", "#24243e"],            direction: "to-bottom-right" },
  { id: "forest",   name: "Forest",   colors: ["#134e5e", "#71b280"],                       direction: "to-bottom" },
  { id: "candy",    name: "Candy",    colors: ["#d53369", "#daae51"],                       direction: "to-bottom-right" },
  { id: "aurora",   name: "Aurora",   colors: ["#1d976c", "#93f9b9"],                       direction: "to-bottom-right" },
];
