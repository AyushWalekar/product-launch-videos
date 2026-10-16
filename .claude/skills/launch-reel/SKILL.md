---
name: launch-reel
description: Make a polished ~30 s product launch reel for any product (site URL, logged-in app, or repo) in Remotion, with a soundtrack that starts low and builds to the end plus synced UI sound design (cut ticks, pops on a melody, mouse clicks, keycaps, typing). Brand-matched to the product's own site, real screens brought to life with cursor clicks, state changes, typing and toasts. Use when the user asks for a launch video, promo / demo reel, product teaser, feature announcement video, or "a video like <some launch post>" for a product.
---

# Launch reel

One config file (`reel.json`) → a 30–34 s, 1080p launch reel with music. Product-agnostic: the
template takes all brand, copy and screens from the config. Picture and score share one timeline
(`timeline.mjs`), so every cut lands on the beat and every fill/crash lands on a cut.

## What it makes

| Time | Picture | Sound |
|---|---|---|
| 0 s | Brand frame on the product's hero background (logo lockup, pill tag, blue brackets) | Music starts low: filtered pad + low drone |
| 0.5–2.5 s | Hard cut every 0.5 s through 2–5 capability words on brand colour fields | Pitched cut ticks climbing the scale, riser |
| 2.5–5.5 s | Brackets open; feature chips pop onto the canvas | Rising mallet melody (one note per chip); soft kick enters and never stops |
| 5.5–7 s | The site's headline word by word inside selection handles, gradient words | A note per word, riser into the drop |
| ~7 s → | Camera pans to product beats: headline left, real screen right on a 3D tilt, pushing in; cursor, clicks, state swaps, typing, keycaps, toasts | Beat lands (808, hats, claps); every pan gets a fill + crash; layers keep adding (stabs, shaker, 16th hats, bells, rolls) |
| last beat | Push into the frame, grey out | Swish, peak intensity |
| end (3.5 s) | The product's hero rebuilt: lockup, pill, headline with gradient line, CTA + URL | Final chord stinger rings out, short fade |

## Workflow

### 0. Setup (once per Remotion project)
```bash
npx remotion add @remotion/transitions @remotion/layout-utils @remotion/google-fonts   # versions match the project
npm i lucide-react && npm i -D playwright-core
cp -R .claude/skills/launch-reel/assets/reel src/reel && rm src/reel/example.reel.json
node .claude/skills/launch-reel/scripts/sfx.mjs public/sfx F
```
No Remotion project yet? Scaffold one first (`npx create-video@latest --blank`). The template needs
`resolveJsonModule` in tsconfig (default in Remotion templates). Scripts need Chrome installed
(set `CHROME_PATH` otherwise).

### 1. Research the product (don't skip)
- Read the site/app: headline, sub-headline, 3–6 capabilities, primary CTA, URL. **Use the product's own
  words**; real copy beats invented copy.
- Brand tokens + hero screenshot:
  `node .claude/skills/launch-reel/scripts/capture.mjs <url> public/reel/<slug> --name hero`
  → prints accent colours, ink colour, fonts, headline, logo URL. Open the hero screenshot and note the
  background (white/dark, grid, glow), gradient text, pill tags and CTA style; the template mirrors these.
- Logo: the product's own file only when the user owns/represents the product; otherwise set no `logo`
  (the lockup falls back to the product name in its font). Ask before downloading anything.
- Font: set it in `src/reel/fonts.ts` (`@remotion/google-fonts/<Family>`) and `brand.font`.

### 2. Capture real screens
- Public pages: `capture.mjs <url> public/reel/<slug> --name <shot>`.
- Logged-in app: **never sign in yourself**. Open a window for the user, then capture with their session:
  ```bash
  node .claude/skills/launch-reel/scripts/login.mjs <app-url> <scratchpad>/profile     # user signs in, closes window
  node .claude/skills/launch-reel/scripts/capture-flow.mjs flow.json --profile <scratchpad>/profile
  ```
  `flow.json` clicks through the app like a user (`goto`, `click`, `scrollTo`, `frame: true` for
  embedded iframes), takes `shot`s, `replaceText` swaps the real name/email for a demo persona
  (presentation only), and `locate` prints the CSS-px centre/box of named elements for cursor targets
  and typing rects. Capture *states* (e.g. an option selected before/after); never submit forms or change
  settings. If the login window is still open, copy the profile (`rsync -a --exclude 'Singleton*'`).
- Keep the profile in your scratchpad, never in the repo. Tell the user what you changed on screen.

### 3. Write `src/reel/<slug>.reel.json` (or anywhere) — schema in `src/reel/types.ts`, example in `assets/reel/example.reel.json`
- `assets`: folder under `public/` with the screens/logo; music is written there as `music.wav`.
- `hero`: the site's headline; `gradientFrom` = index of the first gradient word (the end card splits there).
- `montage`: 4 capability words with a lucide icon name and two colours each (use the product's palette).
- `chips`: 8–14 real feature/use-case names.
- `beats` (3–6): `title` ≤ 3 words per line, one idea each; `screen` + overlays:
  `camera` [[frame, zoom, x, y]…] · `cursor.path` [[frame, x, y]…] + `clicks` · `swaps` (state after a
  click) · `typing` (rect over the real input, `prefill` + typed `text`) · `keycap` (**only real
  shortcuts** — grep the app for `e.key`/`e.code`) · `toast` · `pushOut` on the last beat. `seconds` is
  snapped to the beat grid. Typical: 3.5–5.5 s per beat.
- States you can't screenshot (live calls, streaming, animations): pass a custom component for that beat
  (`makeReel(cfg, { custom: { <beatId>: MyScreen } })`). Port it from the product's source when available:
  same markup/tokens as inline styles, frame-driven instead of rAF/mic.

### 4. Audio
```bash
node .claude/skills/launch-reel/scripts/audio.mjs src/reel/<slug>.reel.json
```
Writes `build.json` (cue sheet), `public/<assets>/music.wav` and, if missing, `public/sfx`. Prints the
timeline. Tune via `"audio": { "ramp": [[s, 0..1]…], "loudness": -13 }` and `musicVolume` (0.9 default).
Pick `key` once; SFX notes are generated in the same key (`sfx.mjs public/sfx <key>` after changing it).

### 5. Register, preview, render
```tsx
import { makeReel, type ReelConfig } from "../reel";        // path from your Root
import cfg from "./<slug>.reel.json";
const reel = makeReel(cfg as unknown as ReelConfig);
<Composition id="<Name>Reel" component={reel.Reel} durationInFrames={reel.durationInFrames} fps={30} width={1920} height={1080} />
```
```bash
npx remotion studio                                                       # preview
npx remotion still <entry> <Name>Reel out/check.jpg --frame=<n> --scale=0.5   # spot-check
npx remotion render <entry> <Name>Reel out/<slug>-reel.mp4 --image-format=png --crf=16 --audio-bitrate=320k
```
PNG frames keep UI text crisp (JPEG frame capture softens it). If the user wants to review first, give them
the studio/render commands and don't render the final yourself.

### 6. Check before handing over
- Look at a still from every scene: nothing clipped by the frame, no real personal data, text legible.
- Audio, from an audio-only render (`--codec=wav`, ~45 s) + `python3 -I scripts/audio_profile.py mix.wav`:
  full mix ≈ −32 dB at 0 s, ≈ −16 at the drop, ≈ −13 at the peak, steady rise between, **no dips**
  (a kick on every beat from ~2.5 s to the stinger), peak ≤ −1 dBFS, no clipped samples.
- Report: file, length, which screens are real vs recreated, which copy/data is sample, what was
  anonymised, how to tweak (copy in reel.json, `ramp`, `musicVolume`, `end.seconds`).

## Matching a different reference ("make it like <link>")
Measure, don't guess. Ask before downloading (file, source, size); keep it in the scratchpad.
- X/Twitter MP4s: `https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=4`.
- Picture: `node scripts/sheet.mjs ref.mp4 <prefix> 0.5 24`, then 0.1 s steps around key moments.
- Sound: `npx remotion ffmpeg -i ref.mp4 -vn -ac 1 -ar 48000 -c:a pcm_s16le ref.wav` then
  `audio_profile.py ref.wav mine.wav`; compare loudness curve, onset grid, and low/mid/high balance
  (default target: bass-heavy, low ≈ overall −1 dB, mids −5, highs −16). Adjust `ramp`/`loudness`, or the
  layer thresholds at the top of `scripts/build.mjs`.

## Gotchas
- Don't change `timeline.mjs` constants per product (30 fps, 120 BPM, 16-frame pans): picture and score
  both depend on them. Change beat `seconds` instead.
- Mid-video pitch-gliding sounds or half-time sections read as "the track slowing down"; `build.mjs` avoids
  both — keep it that way.
- `useVideoConfig().durationInFrames` is the whole composition; scenes get their own length via props.
- Remotion's bundled ffmpeg lacks `tile`/`xstack`/`showwavespic`; use `sheet.mjs` and `audio_profile.py`.
- Apps that only open screens via buttons (no deep links): click through in `flow.json` from the list page.
- next-themes apps: `"dark": true` in flow.json sets `localStorage.theme`.
