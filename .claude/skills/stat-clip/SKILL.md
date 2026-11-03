---
name: stat-clip
description: Annotated data clips for X posts (6–11 s MP4 + final-frame PNG) from a props JSON, in Ayush's ink-on-paper "show the math" style: bars that draw, then vermilion pen marks (ring, bracket, reference line) and a typed math strip; plus line, scatter and "Benchmark Receipt" cards. Use when asked for a chart video, stat clip, tweet graphic or receipt card in this repo, or when changing the compositions in src/stat.
---

# Stat clips

Code: `src/stat/` (own entry `src/stat/index.ts`, independent of `src/reel` and `src/demo`).

| file | |
|---|---|
| `Root.tsx` | `StatBars`, `StatSplit` (both `StatBars`), `StatLine`, `StatScatter`, `StatReceipt`; defaults from `examples/*.json` |
| `examples/*.json` | real-data reference props (AA + OpenCode, Nov 3 2026): margin, split, trend, frontier, receipt |
| `Bars.tsx` / `Line.tsx` / `Scatter.tsx` / `Receipt.tsx` | components; each exports a `*Timing()` that sets the duration |
| `Frame.tsx` | layout: kicker, title, subtitle, callout, math strip (`[[ ]]` = vermilion), source, credit |
| `pen.tsx` | the vermilion pen: `ringPath`, brackets, `PenStroke`, `PenText` |
| `theme.ts` / `format.ts` / `useSize.ts` | palette, fonts, lab colours, aspects · value/tick formats · measuring, ticks |

Props schema and render checklist: `~/.claude/skills/ai-tweet/references/clips.md`.

```bash
npx remotion studio src/stat/index.ts
~/.claude/skills/ai-tweet/scripts/render.sh StatBars props.json out/stat clip   # MP4 + final-frame PNG
```

Rules when changing the compositions:
- Sequence is fixed: chart draws (~1 s) → pen marks one by one → math types → optional callout → hold.
  Keep it in the `*Timing()` functions so duration stays right.
- Ink on paper; grey context; vermilion only for pen marks and the math result. Lab colours only via
  `colors: "lab"`. No gradients, shadows, cards, icons, or a dot riding the bars (that's another
  account's signature).
- Text ≥ 20 px at 1080 wide. After changes, render all five examples with `--frame=-1` and look at them.
- `npx tsc --noEmit -p .` and `npx eslint src/stat` clean.
