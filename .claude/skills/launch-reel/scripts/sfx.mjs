#!/usr/bin/env node
// Synthesizes a small UI sound-effects library (WAV) for launch reels: no samples, no licensing.
// Modelled on measured reference reels: ~12ms bright cut clicks, soft low-mid UI pops,
// keycap "thock" + release click, short varied typing clicks, mouse clicks, soft pan swish.
//
// Usage: node .claude/skills/launch-reel/scripts/sfx.mjs <outDir>
// Writes: cut, shutter, pop1-3, key-down, key-up, type1-6, mouse, swish, riser, riser-short .wav

import fs from "node:fs";
import path from "node:path";

const outDir = process.argv[2];
// Optional key for the pitched sounds (cut1-4, note1-8), to match the score: sfx.mjs <outDir> [key]
const KEY = process.argv[3] ?? "F";
if (!outDir) {
  console.error("usage: sfx.mjs <outDir>");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const SR = 48000;

let seed = 99991;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function render(seconds, fn) {
  const n = Math.ceil(seconds * SR);
  const out = new Float32Array(n);
  fn(out, n);
  return out;
}

// One-pole helpers
const lowpass = (fc) => {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  return (x) => (y += a * (x - y));
};
const highpass = (fc) => {
  const lp = lowpass(fc);
  return (x) => x - lp(x);
};
const bandpass = (fc, q = 1) => {
  // RBJ biquad band-pass (constant skirt)
  const w = (2 * Math.PI * fc) / SR;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0, b2 = -alpha / a0, a1 = (-2 * Math.cos(w)) / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
};

function write(name, data, gain = 1) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const norm = (0.9 / (peak || 1)) * gain;
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * norm)) * 32767), 44 + i * 2));
  fs.writeFileSync(path.join(outDir, `${name}.wav`), buf);
}

/* cut: the montage tick — very short, bright, a hint of body */
write(
  "cut",
  render(0.06, (o, n) => {
    const hp = highpass(1800);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const click = hp(rnd()) * Math.exp(-t * 520);
      const body = Math.sin(2 * Math.PI * 1150 * t) * Math.exp(-t * 300) * 0.5;
      o[i] = click + body;
    }
  }),
  0.95,
);

/* shutter: two quick clicks, for the first and last montage frames */
write(
  "shutter",
  render(0.09, (o, n) => {
    const hp = highpass(2200);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const a = hp(rnd()) * (Math.exp(-t * 600) + (t > 0.035 ? Math.exp(-(t - 0.035) * 500) * 0.7 : 0));
      o[i] = a;
    }
  }),
  0.9,
);

/* pops: soft, rounded low-mid blips for elements appearing (3 pitches) */
[520, 430, 610].forEach((f0, k) =>
  write(
    `pop${k + 1}`,
    render(0.14, (o, n) => {
      const lp = lowpass(3500);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const f = f0 * (1 + 0.45 * Math.exp(-t * 60));
        ph += f / SR;
        const env = Math.min(1, t * 900) * Math.exp(-t * 34);
        o[i] = lp(Math.sin(2 * Math.PI * ph) * env + rnd() * Math.exp(-t * 900) * 0.25);
      }
    }),
    0.6,
  ),
);

/* key-down: keycap thock — low wooden body + plastic click */
write(
  "key-down",
  render(0.16, (o, n) => {
    const bp = bandpass(1900, 1.4);
    const lp = lowpass(1400);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      ph += (190 + 120 * Math.exp(-t * 80)) / SR;
      const body = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 38);
      const knock = lp(rnd()) * Math.exp(-t * 90) * 0.9;
      const click = bp(rnd()) * Math.exp(-t * 400) * 1.6;
      o[i] = body * 0.8 + knock + click;
    }
  }),
  0.9,
);

/* key-up: lighter release click */
write(
  "key-up",
  render(0.06, (o, n) => {
    const bp = bandpass(2600, 1.6);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      o[i] = bp(rnd()) * Math.exp(-t * 520) * 1.4 + Math.sin(2 * Math.PI * 420 * t) * Math.exp(-t * 160) * 0.15;
    }
  }),
  0.5,
);

/* typing: six variations, alternating short ticks (~12ms) and slightly longer taps (~70ms) */
for (let k = 0; k < 6; k++) {
  const long = k % 2 === 1;
  const fc = 2000 + k * 260;
  write(
    `type${k + 1}`,
    render(long ? 0.09 : 0.04, (o, n) => {
      const bp = bandpass(fc, 1.2);
      const lp = lowpass(900);
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const tick = bp(rnd()) * Math.exp(-t * (long ? 260 : 480)) * 1.5;
        const thud = lp(rnd()) * Math.exp(-t * (long ? 70 : 160)) * (long ? 0.7 : 0.35);
        o[i] = tick + thud;
      }
    }),
    long ? 0.5 : 0.42,
  );
}

/* mouse: trackpad / mouse button click */
write(
  "mouse",
  render(0.05, (o, n) => {
    const bp = bandpass(3200, 2);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      o[i] = bp(rnd()) * Math.exp(-t * 700) * 1.6 + Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 400) * 0.2;
    }
  }),
  0.55,
);

/* swish: short, soft air movement for camera pans and panels sliding in */
write(
  "swish",
  render(0.45, (o, n) => {
    let fc = 400;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const x = t / 0.45;
      fc = 500 + 3500 * Math.sin(Math.min(1, x * 1.3) * Math.PI * 0.5);
      const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
      o.state = (o.state || 0) + a * (rnd() - (o.state || 0));
      const env = Math.sin(Math.PI * Math.min(1, x)) ** 2;
      o[i] = o.state * env;
    }
  }),
  0.35,
);

/* risers: filtered noise + a rising tone that build into a cut or a drop (2s for montages, 1.4s short) */
[["riser", 2.0], ["riser-short", 1.4]].forEach(([name, len]) =>
  write(
    name,
    render(len + 0.05, (o, n) => {
      let lp = 0;
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const x = Math.min(1, t / len);
        const fc = 300 + 5200 * x * x;
        const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
        lp += a * (rnd() - lp);
        ph += (110 + 330 * x * x) / SR;
        const env = Math.pow(x, 2.2) * (t > len ? Math.max(0, 1 - (t - len) / 0.05) : 1);
        o[i] = (lp * 0.8 + Math.sin(2 * Math.PI * ph) * 0.25) * env;
      }
    }),
    0.55,
  ),
);

/* pitched: cut1-4 = the cut tick plus a rising blip (montage), note1-8 = soft mallet, major pentatonic */
{
  const K = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }[KEY] ?? 5;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const root = 72 + K; // C5 + key
  [0, 4, 7, 12].forEach((st, k) =>
    write(
      `cut${k + 1}`,
      render(0.12, (o, n) => {
        const hp = highpass(1800);
        const f = mtof(root + st);
        for (let i = 0; i < n; i++) {
          const t = i / SR;
          o[i] = hp(rnd()) * Math.exp(-t * 520) + Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 38) * 0.55 + Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 70) * 0.15;
        }
      }),
      0.95,
    ),
  );
  [0, 2, 4, 7, 9, 12, 14, 16].forEach((st, k) =>
    write(
      `note${k + 1}`,
      render(0.5, (o, n) => {
        const f = mtof(root + st);
        for (let i = 0; i < n; i++) {
          const t = i / SR;
          const env = Math.min(1, t * 900) * Math.exp(-t * 9);
          o[i] = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-t * 30) + 0.12 * Math.sin(2 * Math.PI * f * 2.01 * t)) * env;
        }
      }),
      0.55,
    ),
  );
}

console.log(`wrote sfx to ${outDir}`);
