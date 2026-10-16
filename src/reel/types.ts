// reel.json schema. Coordinates for screen overlays are CSS px of the captured screenshot
// (default viewport 1440×900); `capture-flow.mjs` prints them for any element you name.

export type ReelConfig = {
  /** Music key for the score and the pitched SFX (C, D, Eb, F, G, A, Bb…). */
  key?: string;
  /** Folder under public/ holding this reel's screens, logo and music (e.g. "reel/acme"). */
  assets: string;
  brand: {
    name: string;
    /** Logo file inside `assets` (png/svg), shown in the opening frame and the end card. */
    logo?: string;
    /** Logo width / height. */
    logoRatio?: number;
    /** Optional product name set after the logo as "logo / wordmark" (e.g. a sub-brand). */
    wordmark?: string;
    /** Font family loaded in fonts.ts (CSS family name). */
    font: string;
    ink: string;
    muted: string;
    /** Primary colour: buttons, selection handles, grid lines. */
    primary: string;
    /** Second halo colour (warm accent). */
    accent: string;
    /** Gradient for highlighted headline words, e.g. ["#0d9488", "#0ea5e9"]. */
    gradient: [string, string];
    background?: string;
  };
  hero: {
    /** Small pill above the headline, e.g. "Now in beta". */
    pill?: string;
    headline: string;
    /** Index of the first headline word drawn in the gradient (e.g. 3 for "Better English for every student"). */
    gradientFrom?: number;
    cta?: string;
    url: string;
  };
  /** 2–5 quick cuts after the brand frame: one capability each. `icon` is a lucide-react icon name. */
  montage: { label: string; icon: string; colors: [string, string] }[];
  /** 8–14 short labels (features, use cases, templates) that pop onto the canvas. */
  chips: { text: string; icon?: string; color?: string }[];
  /** 3–6 product beats, panned through in order. */
  beats: Beat[];
  end?: { seconds?: number };
  /** Music level under the SFX (0–1). */
  musicVolume?: number;
};

export type XY = [number, number];

export type Beat = {
  id: string;
  /** Headline lines on the left, revealed word by word. Keep to ≤ 3 words per line. */
  title: string[];
  sub?: string;
  /** Text in the browser frame's address bar. */
  url: string;
  /** Screenshot file inside `assets`. */
  screen: string;
  screenSize?: XY;
  /** Wanted length; snapped to the beat grid. */
  seconds?: number;
  /** Camera keys: [frame, zoom, centerX, centerY]. Default: gentle push-in on the centre. */
  camera?: [number, number, number, number][];
  /** Cursor path [frame, x, y] and click frames (mouse click sound on each). */
  cursor?: { path: [number, number, number][]; clicks?: number[] };
  /** Replace the screenshot at a frame (state after a click, e.g. an option selected). */
  swaps?: { at: number; screen: string }[];
  /** Text typed into a field, drawn over the screenshot inside `rect` [x, y, w, h]. */
  typing?: {
    at: number;
    rect: [number, number, number, number];
    text: string;
    prefill?: string;
    fontSize?: number;
    lineHeight?: number;
    fontFamily?: string;
    color?: string;
    background?: string;
    /** Frames per character (default 1). */
    speed?: number;
  };
  /** A real keyboard shortcut of the product, pressed on screen (only use shortcuts that exist). */
  keycap?: { label: string; presses: number[]; width?: number };
  /** A dark pill toast that pops in below the frame. */
  toast?: { text: string; at: number };
  /** Last beat only: push into the frame and grey it out before the end card. */
  pushOut?: boolean;
};
