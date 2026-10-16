#!/usr/bin/env node
// Generates all audio for a reel from its reel.json, using the same timeline as the picture:
//   1. build.json (cue sheet: ramp, drop, transitions, stinger) next to reel.json
//   2. public/<assets>/music.wav via build.mjs (starts low, beat lands on the first pan, builds to the end)
//   3. public/sfx/*.wav via sfx.mjs (UI ticks + pitched notes/cuts in the score's key), if missing or --sfx
//
// Usage: node .claude/skills/launch-reel/scripts/audio.mjs <path/to/reel.json> [--public public] [--sfx]
// Override the curve by adding "audio": { "ramp": [[s, 0..1], ...], "loudness": -13 } to reel.json.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timeline } from "../assets/reel/timeline.mjs";

const args = process.argv.slice(2);
const reelPath = args[0];
if (!reelPath) {
  console.error("usage: audio.mjs <reel.json> [--public public] [--sfx]");
  process.exit(1);
}
const pubIdx = args.indexOf("--public");
const PUBLIC = path.resolve(pubIdx === -1 ? "public" : args[pubIdx + 1]);
const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(reelPath, "utf8"));
const tl = timeline(cfg);
const key = cfg.key ?? "F";

const cue = {
  duration: +(tl.total / 30).toFixed(3),
  bpm: 120,
  key,
  ramp: cfg.audio?.ramp ?? tl.ramp,
  drop: tl.drop,
  transitions: tl.transitions,
  stinger: tl.stinger,
  loudness: cfg.audio?.loudness ?? -13,
};
const cuePath = path.join(path.dirname(reelPath), "build.json");
fs.writeFileSync(cuePath, JSON.stringify(cue, null, 2) + "\n");

const outDir = path.join(PUBLIC, cfg.assets);
fs.mkdirSync(outDir, { recursive: true });
const run = (script, ...a) => {
  const r = spawnSync(process.execPath, [path.join(here, script), ...a], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run("build.mjs", cuePath, path.join(outDir, "music.wav"));
const sfxDir = path.join(PUBLIC, "sfx");
if (args.includes("--sfx") || !fs.existsSync(path.join(sfxDir, "note1.wav"))) run("sfx.mjs", sfxDir, key);

const fmt = (f) => `${(f / 30).toFixed(2)}s`;
console.log("\nTimeline (frames @30fps, starts on the 120 BPM grid):");
for (const s of tl.scenes) console.log(`  ${s.id.padEnd(22)} ${String(s.from).padStart(4)}  ${fmt(s.from).padStart(7)}  +${s.duration}  (${s.transition})`);
console.log(`  total ${tl.total} frames = ${fmt(tl.total)} · drop ${tl.drop}s · stinger ${tl.stinger}s`);
