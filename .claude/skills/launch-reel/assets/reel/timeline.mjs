// Shared timing for the launch reel: used by the React template (picture) and by scripts/cues.mjs
// (music cue sheet), so picture and score can never drift apart.
//
// Fixed format: 30 fps, 120 BPM → one beat = 15 frames. Every pan lands on a beat; the score's
// fills and crashes are timed to these starts.

export const FPS = 30;
export const BPM = 120;
export const BEAT = 15; // frames per beat at 120 BPM / 30 fps
export const PAN = 16; // frames of overlap for camera-pan transitions
export const SHOT = 15; // frames per montage cut
export const ASSEMBLE = 90;

const snapPan = (frames) => BEAT * Math.max(6, Math.round((frames - PAN) / BEAT)) + PAN; // next start on the grid
const snapCut = (frames) => BEAT * Math.max(6, Math.round(frames / BEAT));

/**
 * @param {{ montage: unknown[]; beats: { id: string; seconds?: number }[]; end?: { seconds?: number } }} config
 */
export function timeline(config) {
  const montage = SHOT * (config.montage.length + 1); // shot 0 is the brand frame
  const headlineStart = montage + ASSEMBLE;
  let headline = 55;
  while ((headlineStart + headline - PAN) % BEAT !== 0) headline++;

  const scenes = [
    { id: "montage", from: 0, duration: montage, transition: "cut" },
    { id: "assemble", from: montage, duration: ASSEMBLE, transition: "cut" },
    { id: "headline", from: headlineStart, duration: headline, transition: "cut" },
  ];
  let start = headlineStart + headline - PAN;
  config.beats.forEach((b, i) => {
    const last = i === config.beats.length - 1;
    const want = Math.round((b.seconds ?? 5) * FPS);
    const duration = last ? snapCut(want) : snapPan(want);
    scenes.push({ id: `beat:${b.id}`, from: start, duration, transition: "pan" });
    start += last ? duration : duration - PAN;
  });
  const endDuration = Math.round((config.end?.seconds ?? 3.5) * FPS);
  scenes.push({ id: "end", from: start, duration: endDuration, transition: "cut" });
  const total = start + endDuration;

  const beatStarts = scenes.filter((s) => s.id.startsWith("beat:")).map((s) => s.from / FPS);
  const drop = beatStarts[0];
  const stinger = start / FPS;
  const ramp = [
    [0, 0.12],
    [montage / FPS, 0.2],
    [drop - 0.05, 0.33],
    [drop, 0.42],
    ...beatStarts.slice(1).map((t, k, arr) => [t, +(0.42 + (0.43 * (k + 1)) / Math.max(1, arr.length)).toFixed(3)]),
    [stinger - 0.1, 1],
  ];
  return { scenes, total, drop, transitions: beatStarts.slice(1), stinger, ramp, montage, headline };
}
