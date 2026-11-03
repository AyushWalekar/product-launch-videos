// Visual system for stat clips: the same ink-on-paper look as Ayush's article figures
// (articles/scripts/lib/graphics.mjs), sized for X's feed (1080 px wide, read at ~500 px on a phone).
// Model bars take their lab's colour; everything else is ink, paper, hairlines and one vermilion accent.

export const palette = {
  paper: "#F7F4EE",
  panel: "#FFFDF8",
  ink: "#1C1B19",
  ink2: "#4A4740",
  muted: "#857F73",
  rule: "#D9D3C5",
  tint: "#E4DFD3",
  red: "#D2462A",
  blue: "#1F5FA8",
};

// macOS system fonts, matching the article figures.
export const fonts = {
  serif: "Charter, 'Iowan Old Style', Georgia, serif",
  sans: "'Avenir Next', Avenir, 'Helvetica Neue', Arial, sans-serif",
  mono: "Menlo, 'SF Mono', Consolas, monospace",
};

export const CREDIT = "@_ayushwalekar";

// Lab colours as Artificial Analysis draws them, for data that doesn't carry its own colour.
export const LAB_COLORS: Record<string, string> = {
  anthropic: "#cc785c",
  openai: "#1f1f1f",
  google: "#34A853",
  meta: "#0089f4",
  deepseek: "#2243e6",
  kimi: "#047AFE",
  moonshot: "#047AFE",
  xai: "#736cd3",
  spacexai: "#736cd3",
  mistral: "#fa520f",
  alibaba: "#615ced",
  qwen: "#615ced",
  xiaomi: "#ff6900",
  zhipu: "#1c7ff8",
  "z ai": "#1c7ff8",
  minimax: "#e2167e",
  nvidia: "#76b900",
};

export const labColor = (lab?: string, fallback = palette.ink2) =>
  (lab && LAB_COLORS[lab.toLowerCase()]) || fallback;

/** Very dark lab colours (OpenAI) need light value text inside the bar; light ones need ink. */
export const textOn = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? palette.ink : "#FFFFFF";
};

export const ASPECTS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1600, height: 900 },
} as const;
export type Aspect = keyof typeof ASPECTS;
