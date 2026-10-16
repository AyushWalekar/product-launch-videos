#!/usr/bin/env node
// "Starts low, slowly gets intense" launch-reel score. Original and royalty-free: pure DSP.
// One continuous intensity curve drives everything: each layer fades in as the curve crosses its
// threshold (pad → soft kick → syncopated 808 bass → claps + hats → chord stabs → 16th hats + bells
// → hat rolls), filters open with it, fills into every cut grow with it, and it peaks into a final
// chord stinger. The kick, once in, plays every beat to the end, so the tempo never feels like it drops.
// Modelled on measured references: low/filtered intro, beat landing ~5–7 s, bass-heavy mix
// (low ≈ mid + 4 dB, highs ≈ −11 dB below mids), then steady build to the end.
//
// Usage: node .claude/skills/launch-reel/scripts/build.mjs <build.json> <out.wav>
// build.json:
// {
//   "duration": 34, "bpm": 120, "key": "F",
//   "ramp": [[0, 0.12], [3.5, 0.22], [7, 0.42], [14, 0.6], [23.5, 0.88], [28.3, 1]],  // [seconds, 0..1]
//   "drop": 7,                           // the beat lands here (crash + sub); optional
//   "transitions": [10, 14, 18.5, 23.5], // fills into these, crash on them (scaled by intensity)
//   "stinger": 28.5,                     // band stops, final chord rings out; omit to run to the end
//   "loudness": -14                      // RMS dBFS of the loudest (final) stretch
// }
// Thresholds (intensity): kick 0.2 · 808 0.36 · hats 0.4 · claps 0.45 · stabs 0.5 · shaker 0.5 · 16th hats 0.62 · bells 0.7 · rolls 0.8

import fs from "node:fs";

const [cuesPath, outPath] = process.argv.slice(2);
if (!cuesPath || !outPath) {
  console.error("usage: build.mjs <build.json> <out.wav>");
  process.exit(1);
}
const cue = JSON.parse(fs.readFileSync(cuesPath, "utf8"));
const SR = 44100;
const DUR = cue.duration;
const N = Math.ceil(DUR * SR);
const BEAT = 60 / (cue.bpm ?? 120);
const BAR = BEAT * 4;
const S16 = BEAT / 4;
const STING = cue.stinger ?? null;
const END = STING ?? DUR;
const DROP = cue.drop ?? null;
const TRANS = (cue.transitions ?? []).filter((t) => t < END);
const RAMP = cue.ramp ?? [[0, 0.2], [DUR, 1]];

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const level = (t) => {
  if (t >= END) return 0;
  if (t <= RAMP[0][0]) return RAMP[0][1];
  for (let k = 1; k < RAMP.length; k++) {
    const [t1, v1] = RAMP[k];
    const [t0, v0] = RAMP[k - 1];
    if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return RAMP[RAMP.length - 1][1];
};
const on = (t, a, b) => clamp01((level(t) - a) / (b - a)); // 0..1 fade-in of a layer

let seed = 1337;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const bus = () => [new Float32Array(N), new Float32Array(N)];
const pad = bus(), keys = bus(), bass = bus(), drums = bus(), arp = bus(), fx = bus(), send = bus();
const add = (b, i, l, r = l) => {
  if (i >= 0 && i < N) {
    b[0][i] += l;
    b[1][i] += r;
  }
};
const pan = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
const KEYS = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const ROOT = 48 + (KEYS[cue.key ?? "C"] ?? 0);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
// vi – IV – I – V: minor-leaning, builds tension well.
const PROG = [
  [-3, 0, 4, 7, 11],
  [-7, 0, 4, 5, 9],
  [0, 4, 7, 11, 14],
  [-5, 2, 7, 11, 14],
];
const chordAt = (t) => PROG[((Math.floor(t / BAR + 1e-6) % 4) + 4) % 4];
const PENTA = [0, 2, 4, 7, 9];

/* ---------- pad: from the first frame, filter opens with intensity ---------- */
for (let b = 0; b * BAR < END + BAR; b++) {
  const t0 = b * BAR;
  const chord = PROG[b % 4];
  for (const [vi, st] of chord.entries()) {
    for (const det of [-0.1, 0.09]) {
      const f = mtof(ROOT + 12 + st) * Math.pow(2, det / 12);
      const [gl, gr] = pan(det * 5 + (vi - 2) * 0.22);
      let ph = vi * 0.17;
      const len = BAR + 0.5;
      const s0 = Math.floor(t0 * SR);
      for (let i = 0; i < len * SR; i++) {
        const tt = i / SR;
        const t = t0 + tt;
        if (t >= END) break;
        const env = Math.min(1, tt / 0.3) * Math.min(1, (len - tt) / 0.5) * Math.min(1, t / 1.0);
        ph = (ph + f / SR) % 1;
        const v = (2 * ph - 1) * env * 0.022 * (0.7 + 0.3 * level(t));
        add(pad, s0 + i, v * gl, v * gr);
      }
    }
  }
}
// low drone under the intro: the "starts low" weight before the beat arrives
{
  const f = mtof(ROOT - 12 + PROG[0][0]);
  for (let i = 0; i < Math.min(END, 9) * SR; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 1.5) * (1 - on(t, 0.3, 0.45)) * 0.06;
    add(bass, i, Math.sin(2 * Math.PI * f * t) * g * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t)));
  }
}
function lowpass(buf, cutoff, q = 0.8) {
  for (const ch of buf) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0;
    for (let i = 0; i < N; i++) {
      if (i % 64 === 0) {
        const w = (2 * Math.PI * Math.min(16000, cutoff(i / SR))) / SR;
        const al = Math.sin(w) / (2 * q), cw = Math.cos(w), a0 = 1 + al;
        b0 = (1 - cw) / 2 / a0; b1 = (1 - cw) / a0; b2 = b0; a1 = (-2 * cw) / a0; a2 = (1 - al) / a0;
      }
      const x = ch[i];
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      ch[i] = y;
    }
  }
}
const sweep = (t) => {
  let s = 0;
  for (const T of [...TRANS, ...(STING ? [STING] : [])]) if (t > T - BAR / 2 && t < T) s = Math.max(s, (t - (T - BAR / 2)) / (BAR / 2));
  return s;
};
lowpass(pad, (t) => (280 + 3600 * Math.pow(level(t), 1.6)) * (1 + sweep(t) * 1.8));

/* ---------- drums ---------- */
const kicks = [];
function kick(t, g, click) {
  kicks.push([t, g]);
  const s0 = Math.floor(t * SR);
  let ph = 0;
  for (let i = 0; i < 0.45 * SR; i++) {
    const tt = i / SR;
    ph += (46 + 115 * Math.exp(-tt * 28)) / SR;
    const body = Math.tanh(Math.sin(2 * Math.PI * ph) * 1.8) * Math.exp(-tt * 6);
    const cl = i < 140 ? rnd() * 0.22 * (1 - i / 140) * click : 0;
    add(drums, s0 + i, (body + cl) * 0.55 * g);
  }
}
function clap(t, g) {
  const s0 = Math.floor(t * SR);
  let b1 = 0, b2 = 0;
  for (let i = 0; i < 0.25 * SR; i++) {
    const tt = i / SR;
    const burst = tt < 0.025 ? 0.55 + 0.45 * Math.cos(tt * 1200) : 1;
    const n = rnd();
    b1 += 0.42 * (n - b1);
    b2 += 0.42 * (b1 - b2);
    const v = (b1 - b2) * Math.exp(-tt * 14) * burst * 0.42 * g;
    add(drums, s0 + i, v);
    add(send, s0 + i, v * 0.45, v * 0.45);
  }
}
function snare(t, g) {
  const s0 = Math.floor(t * SR);
  let lp = 0;
  for (let i = 0; i < 0.16 * SR; i++) {
    const tt = i / SR;
    const n = rnd();
    lp += 0.5 * (n - lp);
    const v = ((n - lp) * Math.exp(-tt * 22) + Math.sin(2 * Math.PI * 200 * tt) * Math.exp(-tt * 35) * 0.4) * 0.28 * g;
    add(drums, s0 + i, v);
    add(send, s0 + i, v * 0.2, v * 0.2);
  }
}
function hat(t, g, open = false) {
  const s0 = Math.floor(t * SR);
  let lp = 0, lp2 = 0;
  const [gl, gr] = pan(0.28);
  for (let i = 0; i < (open ? 0.2 : 0.04) * SR; i++) {
    const tt = i / SR;
    const n = rnd();
    lp += 0.45 * (n - lp);
    const hp = n - lp;
    lp2 += 0.8 * (hp - lp2); // gentle top roll-off only
    const v = lp2 * Math.exp(-tt * (open ? 18 : 70)) * 0.45 * g;
    add(drums, s0 + i, v * gl, v * gr);
  }
}
function shaker(t, g) {
  const s0 = Math.floor(t * SR);
  let lp = 0;
  const [gl, gr] = pan(-0.35);
  for (let i = 0; i < 0.09 * SR; i++) {
    const tt = i / SR;
    const n = rnd();
    lp += 0.3 * (n - lp);
    const env = Math.min(1, tt / 0.012) * Math.exp(-tt * 38);
    const v = (n - lp) * env * 0.34 * g;
    add(drums, s0 + i, v * gl, v * gr);
  }
}
for (let t = 0; t < END - 1e-6; t += S16) {
  const step = Math.round(t / S16) % 16;
  const beat = step % 4 === 0;
  const k = on(t, 0.2, 0.42);
  if (beat && k > 0) kick(t, 0.3 + 0.7 * k, on(t, 0.3, 0.5));
  if ((step === 4 || step === 12) && on(t, 0.45, 0.6) > 0) clap(t, on(t, 0.45, 0.6));
  const h8 = on(t, 0.4, 0.55), h16 = on(t, 0.62, 0.75);
  if (step % 4 === 2 && h8 > 0) hat(t, 0.85 * h8, step === 14 && on(t, 0.75, 0.85) > 0);
  if (step % 2 === 1 && h16 > 0) hat(t, 0.38 * h16);
  // shaker: 16ths, accent on the offbeats, fades in from 0.5 for steady top-end energy
  const sh = on(t, 0.5, 0.8);
  if (sh > 0) shaker(t, (step % 2 === 0 ? 0.55 : 1) * sh);
  // trap-style hat roll at the end of every other bar once things are hot
  const barNo = Math.floor(t / BAR + 1e-6);
  if (step === 14 && barNo % 2 === 1 && on(t, 0.8, 0.9) > 0) for (let r = 1; r < 6; r++) hat(t + (r * S16 * 2) / 6, 0.3 * on(t, 0.8, 0.9));
}

/* ---------- 808 bass: syncopated, fixed pitch per note (no glides), saturated for small speakers ---------- */
const PAT_A = [0, 6, 8, 14];
const PAT_B = [0, 3, 6, 8, 10, 11, 14];
{
  const hits = [];
  for (let t = 0; t < END - 1e-6; t += S16) {
    const g = on(t, 0.36, 0.5);
    if (g <= 0) continue;
    const step = Math.round(t / S16) % 16;
    const pat = level(t) >= 0.6 ? PAT_B : PAT_A;
    if (pat.includes(step)) hits.push({ t, g, oct: step === 14 && level(t) >= 0.75 ? 12 : 0 });
  }
  hits.forEach((h, k) => {
    const next = k + 1 < hits.length ? hits[k + 1].t : Math.min(END, h.t + BEAT);
    const len = Math.min(next - h.t, BEAT * 1.5);
    const f = mtof(ROOT - 12 + chordAt(h.t)[0] + h.oct);
    const drive = 1.6 + 2 * level(h.t);
    const s0 = Math.floor(h.t * SR);
    let ph = 0;
    for (let i = 0; i < len * SR; i++) {
      const tt = i / SR;
      ph = (ph + f / SR) % 1;
      const s = Math.sin(2 * Math.PI * ph);
      const env = Math.min(1, tt * 400) * Math.exp(-tt * 1.6) * Math.min(1, (len - tt) * 120);
      add(bass, s0 + i, Math.tanh(s * drive) * env * 0.2 * h.g);
    }
  });
}

/* ---------- chord stabs (FM EP) and bells ---------- */
function ep(t, midi, vel, dur = 0.3, p = 0) {
  const f = mtof(midi);
  const s0 = Math.floor(t * SR);
  const [gl, gr] = pan(p);
  for (let i = 0; i < dur * SR; i++) {
    const tt = i / SR;
    const m = Math.sin(2 * Math.PI * f * tt) * 2.2 * Math.exp(-tt * 9);
    const v = Math.sin(2 * Math.PI * f * tt + m) * Math.min(1, tt * 600) * Math.exp(-tt * 7) * Math.min(1, (dur - tt) * 40) * vel;
    add(keys, s0 + i, v * gl, v * gr);
    add(send, s0 + i, v * 0.25, v * 0.25);
  }
}
for (let t = BEAT / 2; t < END - 1e-6; t += BEAT) {
  const g = on(t, 0.5, 0.65);
  if (g <= 0) continue;
  const chord = chordAt(t);
  [chord[1], chord[2], chord[3]].forEach((st, k) => ep(t, ROOT + 12 + st, 0.05 * g * (k === 1 ? 1 : 0.8), 0.3, (k - 1) * 0.5));
}
for (let t = 0; t < END - 1e-6; t += S16) {
  const g = on(t, 0.7, 0.85);
  if (g <= 0) continue;
  const k = Math.round(t / S16);
  if (k % 4 === 3) continue;
  const midi = ROOT + 24 + PENTA[[0, 2, 4, 3, 1, 4, 2, 3][k % 8]] + (k % 16 >= 8 ? 12 : 0);
  const f = mtof(midi);
  const s0 = Math.floor(t * SR);
  const [gl, gr] = pan(Math.sin(k * 0.9) * 0.6);
  for (let i = 0; i < 0.33 * SR; i++) {
    const tt = i / SR;
    const v = (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt * 18)) * Math.exp(-tt * 11) * Math.min(1, tt * 800) * 0.034 * g;
    add(arp, s0 + i, v * gl, v * gr);
  }
}
{
  const d = Math.floor(BEAT * 0.75 * SR);
  for (let i = d; i < N; i++) {
    arp[0][i] += arp[1][i - d] * 0.33;
    arp[1][i] += arp[0][i - d] * 0.33;
  }
}

/* ---------- fills, the drop, the stinger ---------- */
function crash(t, g) {
  const s0 = Math.floor(t * SR);
  let x1 = 0;
  for (let i = 0; i < 2 * SR; i++) {
    const tt = i / SR;
    const n = rnd();
    const v = (n - x1) * Math.exp(-tt * 2.3) * 0.11 * g;
    x1 = n;
    add(fx, s0 + i, v);
    add(send, s0 + i, v * 0.4, v * 0.4);
  }
}
function swell(T, len, g) {
  const s0 = Math.floor((T - len) * SR);
  let lp = 0;
  for (let i = 0; i < len * SR; i++) {
    const x = i / (len * SR);
    lp += (1 - Math.exp((-2 * Math.PI * (700 + 9000 * x * x)) / SR)) * (rnd() - lp);
    add(fx, s0 + i, (rnd() - lp) * Math.pow(x, 3) * 0.15 * g);
  }
}
function roll(T, len, g) {
  for (let t = T - len; t < T - 1e-6; ) {
    const x = (t - (T - len)) / len;
    snare(t, (0.15 + 0.7 * x * x) * g);
    t += x < 0.5 ? S16 : S16 / 2;
  }
}
function lowHit(t, g) {
  const s0 = Math.floor(t * SR);
  for (let i = 0; i < 0.35 * SR; i++) add(fx, s0 + i, Math.sin(2 * Math.PI * 52 * (i / SR)) * Math.exp(-(i / SR) * 9) * 0.3 * g);
}
function subDrop(t, g) {
  const s0 = Math.floor(t * SR);
  let ph = 0;
  for (let i = 0; i < 1.1 * SR; i++) {
    const tt = i / SR;
    ph += (60 - 26 * Math.min(1, tt / 0.9)) / SR;
    add(fx, s0 + i, Math.sin(2 * Math.PI * ph) * Math.exp(-tt * 2.6) * 0.34 * g);
  }
}
for (const T of TRANS) {
  const L = level(T - 0.01);
  roll(T, L >= 0.6 ? BAR / 2 : BEAT, 0.5 + 0.5 * L);
  swell(T, 1.0, 0.5 + 0.5 * L);
  crash(T, 0.4 + 0.6 * L);
  lowHit(T, 0.6 + 0.4 * L);
}
if (DROP !== null) {
  swell(DROP, 1.5, 1);
  crash(DROP, 1);
  subDrop(DROP, 1);
}
if (STING) {
  roll(STING, BAR, 1.1);
  swell(STING, 2.0, 1.2);
  crash(STING, 1.2);
  subDrop(STING, 1.2);
  kick(STING, 1.1, 1);
  const s0 = Math.floor(STING * SR);
  const len = DUR - STING;
  [0, 7, 12, 16, 19, 23, 26].forEach((st, k) => {
    const f = mtof(ROOT + st);
    const [gl, gr] = pan((k / 6) * 1.4 - 0.7);
    let p1 = 0, p2 = 0;
    for (let i = 0; i < len * SR; i++) {
      const tt = i / SR;
      p1 = (p1 + (f * 1.003) / SR) % 1;
      p2 = (p2 + (f * 0.997) / SR) % 1;
      const v = (p1 + p2 - 1) * Math.min(1, tt / 0.01) * Math.exp(-tt * 0.32) * 0.07;
      add(pad, s0 + i, v * gl, v * gr);
      add(send, s0 + i, v * 0.5, v * 0.5);
    }
    ep(STING, ROOT + 12 + st, 0.05, 2.4, (k / 6) * 1.2 - 0.6);
  });
  for (const m of [ROOT + 36, ROOT + 43, ROOT + 48]) {
    const f = mtof(m);
    for (let i = 0; i < 3 * SR; i++) {
      const tt = i / SR;
      const v = Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 1.2) * Math.min(1, tt * 800) * 0.05;
      add(arp, s0 + i, v);
      add(send, s0 + i, v * 0.6, v * 0.6);
    }
  }
}

/* ---------- sidechain, reverb, master ---------- */
const duck = new Float32Array(N).fill(1);
for (const [t, g] of kicks) {
  const s0 = Math.floor(t * SR);
  for (let i = 0; i < BEAT * SR && s0 + i < N; i++) duck[s0 + i] = Math.min(duck[s0 + i], 1 - 0.5 * g * Math.exp(-(i / SR) * 10));
}
for (let i = 0; i < N; i++) {
  send[0][i] += pad[0][i] * 0.45 + arp[0][i] * 0.5;
  send[1][i] += pad[1][i] * 0.45 + arp[1][i] * 0.5;
}
function reverb(input, spread) {
  const out = new Float32Array(N);
  for (const d of [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((x) => x + spread)) {
    const buf = new Float32Array(d);
    let idx = 0, filt = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      filt = y * 0.65 + filt * 0.35;
      buf[idx] = input[i] * 0.015 + filt * 0.86;
      out[i] += y;
      idx = (idx + 1) % d;
    }
  }
  for (const d of [556, 441, 341, 225].map((x) => x + spread)) {
    const buf = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx], x = out[i];
      buf[idx] = x + b * 0.5;
      out[i] = b - x;
      idx = (idx + 1) % d;
    }
  }
  return out;
}
const revL = reverb(send[0], 0), revR = reverb(send[1], 23);

const L = new Float32Array(N), R = new Float32Array(N);
{
  let env = 0;
  const att = Math.exp(-1 / (0.01 * SR)), rel = Math.exp(-1 / (0.15 * SR));
  const thr = Math.pow(10, -10 / 20);
  for (let i = 0; i < N; i++) {
    const d = duck[i];
    let l = pad[0][i] * d + keys[0][i] * (0.6 + 0.4 * d) + arp[0][i] + bass[0][i] * (0.55 + 0.45 * d) + drums[0][i] + revL[i] * 0.5;
    let r = pad[1][i] * d + keys[1][i] * (0.6 + 0.4 * d) + arp[1][i] + bass[1][i] * (0.55 + 0.45 * d) + drums[1][i] + revR[i] * 0.5;
    // The whole band rises with the intensity curve (≈ −9 dB at the start → 0 dB at the peak).
    const ride = 0.35 + 0.65 * level(i / SR) + (STING && i / SR >= STING ? 0.65 : 0);
    l *= ride;
    r *= ride;
    const lvl = Math.max(Math.abs(l), Math.abs(r));
    env = lvl > env ? att * env + (1 - att) * lvl : rel * env + (1 - rel) * lvl;
    const g = env > thr ? Math.pow(env / thr, 1 / 2 - 1) : 1;
    L[i] = Math.tanh(l * g * 1.6 + fx[0][i] * 1.5);
    R[i] = Math.tanh(r * g * 1.6 + fx[1][i] * 1.5);
  }
}
// Loudness reference: the final, most intense stretch (last 4 s before the stinger / end).
const to = Math.floor(Math.min(END, DUR) * SR), from = Math.max(0, to - 4 * SR);
let acc = 0;
for (let i = from; i < to; i++) acc += (L[i] * L[i] + R[i] * R[i]) / 2;
let gain = Math.pow(10, (cue.loudness ?? -14) / 20) / (Math.sqrt(acc / Math.max(1, to - from)) || 1);
// Short fade over the last 0.6 s so a ringing stinger never ends on a hard cut.
for (let i = Math.max(0, N - Math.floor(0.6 * SR)); i < N; i++) {
  const f = (N - i) / (0.6 * SR);
  L[i] *= f * f;
  R[i] *= f * f;
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i] * gain), Math.abs(R[i] * gain));
if (peak > 0.89) gain *= 0.89 / peak;

const data = Buffer.alloc(44 + N * 4);
data.write("RIFF", 0); data.writeUInt32LE(36 + N * 4, 4); data.write("WAVEfmt ", 8);
data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22); data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write("data", 36); data.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), 44 + i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), 46 + i * 4);
}
fs.writeFileSync(outPath, data);
console.log(JSON.stringify({ out: outPath, seconds: DUR, gainDb: +(20 * Math.log10(gain)).toFixed(1) }));
