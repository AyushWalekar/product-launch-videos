// Visual system for stat clips: a dark, Vercel/Geist-style look sized for X's feed (1080 px wide, read at
// ~500 px on a phone). Near-black canvas, bordered cards, Geist type, white focus bars, grey context bars and
// one blue accent for the pen marks and the math result. Model rows carry their official logo.
import { staticFile } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
loadGeistMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

export const palette = {
  /** canvas */
  bg: "#0A0A0A",
  /** cards (chart, math strip) */
  card: "#111111",
  /** 1px card borders and hairlines */
  border: "#242424",
  /** primary text and focus bars */
  ink: "#EDEDED",
  /** secondary text */
  ink2: "#A1A1A1",
  /** tertiary text, context labels */
  muted: "#6E6E6E",
  /** axis rules and dividers */
  rule: "#2E2E2E",
  /** context bars, dimmed lines and points */
  context: "#2F2F2F",
  /** the pen: rings, brackets, reference lines, math result */
  accent: "#3B9EFF",
  /** faint accent fill behind the math result */
  accentSoft: "rgba(59,158,255,0.12)",
};

export const fonts = {
  sans: "Geist, -apple-system, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Geist Mono', ui-monospace, Menlo, monospace",
};

export const CREDIT = "@_ayushwalekar";

// Lab colours (tuned for a dark canvas), for `colors: "lab"`.
export const LAB_COLORS: Record<string, string> = {
  anthropic: "#D97757",
  openai: "#EDEDED",
  google: "#4285F4",
  meta: "#0089f4",
  deepseek: "#4D6BFE",
  kimi: "#3B8CFF",
  moonshot: "#3B8CFF",
  xai: "#A8A2F0",
  spacexai: "#A8A2F0",
  mistral: "#FA520F",
  alibaba: "#7C76F5",
  qwen: "#7C76F5",
  xiaomi: "#FF6900",
  zhipu: "#3B8CF8",
  "z ai": "#3B8CF8",
  minimax: "#F23F8A",
  nvidia: "#76B900",
};

export const labColor = (lab?: string, fallback = palette.ink2) =>
  (lab && LAB_COLORS[lab.toLowerCase()]) || fallback;

/** Light fills need dark text inside them; dark ones need light text. */
export const textOn = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? palette.bg : "#FFFFFF";
};

// Official marks in src/stat/public/logos (from @lobehub/icons-static-svg 1.99.0; mono marks recoloured #EDEDED).
// The model's own mark when it has one (Claude, Gemini, Kimi, Qwen, Grok…), otherwise the lab's.
const LOGO_RULES: [RegExp, string][] = [
  [/claude|opus|sonnet|haiku|fable/i, "claude-color"],
  [/gemini|gemma|\bcarbon\b/i, "gemini-color"],
  [/\bgpt|\bo[134]\b|openai|codex|\b(sol|astra|terra|luna)\b/i, "openai"],
  [/deepseek/i, "deepseek-color"],
  [/\bkimi\b/i, "kimi-color"],
  [/moonshot/i, "moonshot"],
  [/qwen|alibaba/i, "qwen-color"],
  [/\bgrok\b/i, "grok"],
  [/\bxai\b|spacexai/i, "xai"],
  [/mistral|devstral|magistral|codestral/i, "mistral-color"],
  [/llama|\bmeta\b/i, "meta-color"],
  [/\bglm\b|zhipu|\bz ai\b/i, "zhipu-color"],
  [/minimax/i, "minimax-color"],
  [/nemotron|nvidia/i, "nvidia-color"],
  [/\bmimo\b|xiaomi/i, "xiaomimimo"],
  [/anthropic/i, "anthropic"],
  [/google/i, "google-color"],
];

/**
 * Logo URL for a row. `logo` overrides: a file name in public/logos ("claude-color"), or false for none.
 * Otherwise matched from the label, then the lab.
 */
export function logoFor(label?: string, lab?: string, logo?: string | false): string | null {
  if (logo === false) return null;
  if (logo) return staticFile(`logos/${logo.replace(/\.svg$/, "")}.svg`);
  for (const s of [label, lab]) {
    if (!s) continue;
    for (const [re, file] of LOGO_RULES) if (re.test(s)) return staticFile(`logos/${file}.svg`);
  }
  return null;
}

export const ASPECTS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1600, height: 900 },
} as const;
export type Aspect = keyof typeof ASPECTS;
