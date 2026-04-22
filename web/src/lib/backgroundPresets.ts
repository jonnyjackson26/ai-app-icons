export interface BackgroundPreset {
  id: string;
  name: string;
  colors: string[];
  direction: string;
}

export const PRESETS: BackgroundPreset[] = [
  { id: "cream",     name: "Cream",     colors: ["#ffffff", "#f3f0e7"], direction: "to-bottom-right" },
  { id: "peach",     name: "Peach",     colors: ["#ffecd2", "#fcb69f"], direction: "to-bottom-right" },
  { id: "blossom",   name: "Blossom",   colors: ["#fde4ec", "#f8c6d3"], direction: "to-bottom-right" },
  { id: "rose",      name: "Rose",      colors: ["#fbc2eb", "#a6c1ee"], direction: "to-bottom" },
  { id: "coral",     name: "Coral",     colors: ["#fa709a", "#fee140"], direction: "to-bottom-right" },
  { id: "mango",     name: "Mango",     colors: ["#ff8008", "#ffc837"], direction: "to-bottom-right" },
  { id: "sand",      name: "Sand",      colors: ["#f4ead5", "#e6d3a8"], direction: "to-bottom-right" },
  { id: "champagne", name: "Champagne", colors: ["#f5ecd9", "#e6d5b2"], direction: "to-bottom-right" },
  { id: "stone",     name: "Stone",     colors: ["#efebe4", "#d4cec2"], direction: "to-bottom-right" },
  { id: "dove",      name: "Dove",      colors: ["#eae8e4", "#c9c5bf"], direction: "to-bottom-right" },
  { id: "pearl",     name: "Pearl",     colors: ["#f5eef2", "#e4d6dd"], direction: "to-bottom-right" },
  { id: "lavender",  name: "Lavender",  colors: ["#a18cd1", "#fbc2eb"], direction: "to-bottom-right" },
  { id: "sage",      name: "Sage",      colors: ["#e3ebe3", "#b5c9b5"], direction: "to-bottom-right" },
  { id: "mist",      name: "Mist",      colors: ["#e8f0ea", "#c1d5c8"], direction: "to-bottom-right" },
  { id: "aurora",    name: "Aurora",    colors: ["#1d976c", "#93f9b9"], direction: "to-bottom-right" },
  { id: "mint",      name: "Mint",      colors: ["#00c9ff", "#92fe9d"], direction: "to-bottom-right" },
  { id: "frost",     name: "Frost",     colors: ["#e3f2fd", "#bbdefb"], direction: "to-bottom-right" },
  { id: "sky",       name: "Sky",       colors: ["#dbeafe", "#a5c3e9"], direction: "to-bottom" },
  { id: "fog",       name: "Fog",       colors: ["#f0f4f7", "#d5dde5"], direction: "to-bottom-right" },
  { id: "slate",     name: "Slate",     colors: ["#e2e8f0", "#cbd5e1"], direction: "to-bottom-right" },
  { id: "graphite",  name: "Graphite",  colors: ["#cbd0d8", "#8b93a0"], direction: "to-bottom-right" },
  { id: "vice",      name: "Vice",      colors: ["#3494e6", "#ec6ead"], direction: "to-right" },
  { id: "royal",     name: "Royal",     colors: ["#141e30", "#243b55"], direction: "to-bottom" },
];
