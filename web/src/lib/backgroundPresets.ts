export interface BackgroundPreset {
  id: string;
  name: string;
  colors: string[];
  direction: string;
}

export const PRESETS: BackgroundPreset[] = [
  { id: "peach",         name: "Peach",         colors: ["#ffecd2", "#fcb69f"],            direction: "to-bottom-right" },
  { id: "sunset",        name: "Sunset",        colors: ["#ff512f", "#dd2476"],            direction: "to-bottom-right" },
  { id: "mango",         name: "Mango",         colors: ["#ff8008", "#ffc837"],            direction: "to-bottom-right" },
  { id: "magenta",       name: "Magenta",       colors: ["#ee0979", "#ff6a00"],            direction: "to-bottom-right" },
  { id: "rose",          name: "Rose",          colors: ["#fbc2eb", "#a6c1ee"],            direction: "to-bottom" },
  { id: "lavender",      name: "Lavender",      colors: ["#a18cd1", "#fbc2eb"],            direction: "to-bottom-right" },
  { id: "violet",        name: "Violet",        colors: ["#654ea3", "#eaafc8"],            direction: "to-bottom-right" },
  { id: "plum",          name: "Plum",          colors: ["#667eea", "#764ba2"],            direction: "to-bottom-right" },
  { id: "vice",          name: "Vice",          colors: ["#3494e6", "#ec6ead"],            direction: "to-right" },
  { id: "cosmic",        name: "Cosmic",        colors: ["#ff00cc", "#333399"],            direction: "to-bottom-right" },
  { id: "azure",         name: "Azure",         colors: ["#4facfe", "#00f2fe"],            direction: "to-bottom-right" },
  { id: "ocean",         name: "Ocean",         colors: ["#2193b0", "#6dd5ed"],            direction: "to-bottom" },
  { id: "aqua",          name: "Aqua",          colors: ["#13547a", "#80d0c7"],            direction: "to-bottom-right" },
  { id: "mint",          name: "Mint",          colors: ["#00c9ff", "#92fe9d"],            direction: "to-bottom-right" },
  { id: "aurora",        name: "Aurora",        colors: ["#1d976c", "#93f9b9"],            direction: "to-bottom-right" },
  { id: "forest",        name: "Forest",        colors: ["#134e5e", "#71b280"],            direction: "to-bottom" },
  { id: "midnight",      name: "Midnight",      colors: ["#0f0c29", "#302b63", "#24243e"], direction: "to-bottom-right" },
  { id: "royal",         name: "Royal",         colors: ["#141e30", "#243b55"],            direction: "to-bottom" },
  { id: "dusk",          name: "Dusk",          colors: ["#2c3e50", "#fd746c"],            direction: "to-bottom-right" },
  { id: "instagram",     name: "Instagram",     colors: ["#833ab4", "#fd1d1d", "#fcb045"], direction: "to-bottom-right" },
  { id: "candy",         name: "Candy",         colors: ["#d53369", "#daae51"],            direction: "to-bottom-right" },
  { id: "coral",         name: "Coral",         colors: ["#fa709a", "#fee140"],            direction: "to-bottom-right" },
];
