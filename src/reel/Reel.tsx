// Launch reel template: brand frame → montage of hard cuts → canvas assemble → headline with
// selection handles → camera pans across real product screens brought to life (cursor, clicks,
// state swaps, typing, keycaps, toasts) → push-out → end card that rebuilds the product's hero.
// Picture and score share timeline.mjs; SFX are placed next to the visuals that make them.
import React from "react";
import { icons, type LucideIcon } from "lucide-react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import {
  Brackets,
  BrowserFrame,
  Camera,
  cameraAt,
  Cursor,
  DemoVideo,
  HeadlineLines,
  Keycap,
  Pop,
  Scaled,
  Sfx,
  Tilt,
  TypingSfx,
  WordReveal,
  type CameraKey,
  type Scene,
  type SfxName,
} from "./kit";
import { ColorField, CtaButton, gradientText, HeroBackdrop, Lockup, Pill } from "./brand";
import { PAN, SHOT, timeline } from "./timeline.mjs";
import type { Beat, ReelConfig } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FRAME_W = 1000;
const CUTS: SfxName[] = ["cut1", "cut2", "cut3", "cut4"];
const MELODY: SfxName[] = ["note1", "note2", "note3", "note4", "note5", "note6", "note5", "note6", "note7", "note8", "note6", "note7", "note8", "note8"];
const icon = (name?: string): LucideIcon | null => (name ? ((icons as Record<string, LucideIcon>)[name] ?? null) : null);

/** Product-specific animated screen for a beat (rendered at the beat's screen size inside the frame). */
export type CustomBeat = React.FC<{ width: number; height: number }>;

const Ctx = React.createContext<ReelConfig | null>(null);
const useCfg = () => React.useContext(Ctx)!;
const asset = (cfg: ReelConfig, file: string) => staticFile(`${cfg.assets}/${file}`);

/* ---------- 1 · brand frame + montage ---------- */
const Montage: React.FC = () => {
  const cfg = useCfg();
  const b = cfg.brand;
  const frame = useCurrentFrame();
  const i = Math.floor(frame / SHOT) - 1;
  const local = frame - (i + 1) * SHOT;
  const s = i >= 0 ? cfg.montage[Math.min(cfg.montage.length - 1, i)] : null;
  const Icon = icon(s?.icon);
  return (
    <AbsoluteFill>
      {cfg.montage.map((_, k) => (
        <Sfx key={k} name={CUTS[k % CUTS.length]} at={(k + 1) * SHOT} volume={0.9} />
      ))}
      <Sfx name="riser" at={12} volume={0.55} />
      {s ? (
        <Sequence from={(i + 1) * SHOT} durationInFrames={SHOT} layout="none">
          <ColorField from={s.colors[0]} to={s.colors[1]} accent={b.accent} duration={SHOT} />
        </Sequence>
      ) : (
        <HeroBackdrop brand={b} />
      )}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          {s ? (
            <div style={{ display: "flex", alignItems: "center", gap: 26, color: "#fff", fontFamily: b.font, fontSize: 108, fontWeight: 700, letterSpacing: "-0.04em", textShadow: "0 6px 30px rgba(15,23,42,0.25)", whiteSpace: "nowrap" }}>
              {Icon && <Icon size={92} strokeWidth={2.2} />}
              {s.label}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
              {cfg.hero.pill && <Pill brand={b} scale={1.3}>{cfg.hero.pill}</Pill>}
              <Lockup config={cfg} height={104} />
            </div>
          )}
          <Brackets key={i} w={s ? 780 : 840} h={s ? 150 : 260} at={-2} spread={18 + local * 1.2} color={s ? "rgba(255,255,255,0.95)" : b.primary} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- 2 · assemble: chips pop onto the canvas to a rising melody ---------- */
const SLOTS: [number, number][] = [
  [420, 300], [1190, 300], [760, 560], [1420, 520], [380, 180], [1150, 170], [990, 410],
  [1560, 330], [290, 650], [1500, 700], [470, 790], [1050, 800], [260, 430], [1660, 430],
];
const DOTS: [number, number][] = [[600, 420], [1320, 420], [600, 640], [1320, 640], [880, 330], [1050, 700], [240, 300], [1700, 760]];
const Assemble: React.FC = () => {
  const cfg = useCfg();
  const b = cfg.brand;
  const frame = useCurrentFrame();
  const open = spring({ frame, fps: 30, config: { damping: 18, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <Sfx name="shutter" at={0} volume={1} />
      <Sfx name="swish" at={80} volume={0.7} />
      <HeroBackdrop brand={b} />
      <div style={{ opacity: interpolate(frame, [10, 18], [1, 0], clamp) }}>
        <Brackets w={840 + open * 460} h={260 + open * 120} at={-10} spread={0} color={b.primary} len={60} thickness={6} />
      </div>
      {cfg.chips.slice(0, SLOTS.length).map((ch, i) => {
        const Icon = icon(ch.icon);
        return (
          <div key={i} style={{ position: "absolute", left: SLOTS[i][0], top: SLOTS[i][1] }}>
            <Pop at={14 + i * 4} outAt={84 - (i % 4)} sound={MELODY[i % MELODY.length]} volume={0.5}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "11px 20px", borderRadius: 999, background: "#fff", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 6px 18px rgba(15,23,42,0.06)", fontFamily: b.font, fontSize: 21, fontWeight: 500, color: b.ink, whiteSpace: "nowrap" }}>
                {Icon && <Icon size={20} color={ch.color ?? b.primary} />}
                {ch.text}
              </div>
            </Pop>
          </div>
        );
      })}
      {DOTS.map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y }}>
          <Pop at={16 + i * 6} outAt={84} sound={null}>
            <div style={{ width: 11, height: 11, borderRadius: 11, background: i % 2 ? b.gradient[0] : b.primary }} />
          </Pop>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------- 3 · headline with selection handles ---------- */
const Headline: React.FC = () => {
  const cfg = useCfg();
  const b = cfg.brand;
  const words = cfg.hero.headline.split(" ");
  const g = cfg.hero.gradientFrom ?? words.length;
  const size = Math.min(108, Math.floor(1500 / Math.max(10, cfg.hero.headline.length * 0.52)));
  return (
    <AbsoluteFill>
      <Sfx name="riser-short" at={4} volume={0.35} />
      {words.map((_, i) => (
        <Sfx key={i} name={MELODY[Math.min(MELODY.length - 1, i + 2)]} at={10 + i * 4} volume={0.55} />
      ))}
      <HeroBackdrop brand={b} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <WordReveal
          text={cfg.hero.headline}
          at={10}
          every={4}
          fontFamily={b.font}
          fontSize={size}
          fontWeight={700}
          letterSpacing={-0.04}
          color={b.ink}
          handles
          scatter
          handleColor={b.primary}
          sound={null}
          align="center"
          wordStyle={(i) => (i >= g ? gradientText(b) : undefined)}
          style={{ transform: `translateY(${-size * 0.6}px)` }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- 4 · product beats ---------- */
const BeatScene: React.FC<{ beat: Beat; duration: number; custom?: CustomBeat }> = ({ beat, duration, custom: Custom }) => {
  const cfg = useCfg();
  const b = cfg.brand;
  const frame = useCurrentFrame();
  const [sw, sh] = beat.screenSize ?? [1440, 900];
  const keys: CameraKey[] = (beat.camera ?? [[0, 1.2, sw / 2, sh / 2], [duration, 1.32, sw / 2, sh / 2]]).map(([f, zoom, x, y]) => ({ frame: f, zoom, x, y }));
  const { zoom } = cameraAt(frame, keys);
  const screen = [...(beat.swaps ?? [])].filter((s) => frame >= s.at).pop()?.screen ?? beat.screen;
  const push = beat.pushOut ? interpolate(frame, [duration - 46, duration], [0, 1], { ...clamp, easing: (x) => x * x * x }) : 0;
  const gray = beat.pushOut ? interpolate(frame, [duration - 34, duration - 4], [0, 1], clamp) : 0;
  const textOut = beat.pushOut ? interpolate(frame, [duration - 50, duration - 36], [1, 0], clamp) : 1;
  const ty = beat.typing;
  const typed = ty ? Math.max(0, Math.min(ty.text.length, Math.floor((frame - ty.at) / (ty.speed ?? 1)))) : 0;
  const titleWords = beat.title.join(" ").split(" ").length;

  return (
    <AbsoluteFill>
      <HeroBackdrop brand={b} />
      <Sfx name="swish" at={0} volume={0.6} />
      {beat.pushOut && <Sfx name="swish" at={duration - 44} volume={0.7} />}
      {beat.cursor?.clicks?.map((c) => <Sfx key={c} name="mouse" at={c} volume={0.9} />)}
      {ty && <TypingSfx at={ty.at} count={ty.text.length} every={ty.speed ?? 1} skip={(i) => i % 2 === 1 || /\s/.test(ty.text[i])} volume={1} />}
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 0 0 140px" }}>
        <div style={{ width: 640, opacity: textOut }}>
          <HeadlineLines lines={beat.title} at={14} size={96} fontFamily={b.font} color={b.ink} weight={700} />
          {beat.sub && (
            <div style={{ marginTop: 26 }}>
              <WordReveal text={beat.sub} at={14 + titleWords * 4 + 8} every={3} fontFamily={b.font} fontSize={34} fontWeight={500} letterSpacing={-0.015} color={b.muted} sound={null} />
            </div>
          )}
          {beat.keycap && (
            <div style={{ marginTop: 64, height: 96 }}>
              <Keycap label={beat.keycap.label} presses={beat.keycap.presses} appearAt={beat.keycap.presses[0] - 8} size={92} width={beat.keycap.width ?? 230} fontFamily={b.font} />
            </div>
          )}
        </div>
        <div
          style={{
            marginRight: 60,
            position: "relative",
            transform: `translate(${-push * 380}px, ${push * 30}px) scale(${1 + push * 2.4})`,
            transformOrigin: "60% 50%",
            filter: gray ? `grayscale(${gray}) brightness(${1 + gray * 0.5})` : undefined,
            opacity: beat.pushOut ? interpolate(frame, [duration - 12, duration], [1, 0], clamp) : 1,
          }}
        >
          <Tilt duration={duration}>
            <BrowserFrame url={beat.url} width={FRAME_W}>
              {Custom ? (
                <Scaled w={sw} h={sh} scale={FRAME_W / sw}>
                  <Custom width={sw} height={sh} />
                </Scaled>
              ) : (
                <Camera keys={keys} viewport={{ w: sw, h: sh }} content={{ w: sw, h: sh }} scale={FRAME_W / sw}>
                  <Img src={asset(cfg, screen)} style={{ width: sw, height: sh, display: "block" }} />
                  {ty && (
                    <div
                      style={{
                        position: "absolute",
                        left: ty.rect[0],
                        top: ty.rect[1],
                        width: ty.rect[2],
                        height: ty.rect[3],
                        boxSizing: "border-box",
                        padding: "10px 12px",
                        background: ty.background ?? "#fff",
                        borderRadius: 9,
                        overflow: "hidden",
                        whiteSpace: "pre-wrap",
                        fontFamily: ty.fontFamily ?? "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                        fontSize: ty.fontSize ?? 14,
                        lineHeight: `${ty.lineHeight ?? 28}px`,
                        color: ty.color ?? "#18181b",
                      }}
                    >
                      {(ty.prefill ?? "") + ty.text.slice(0, typed)}
                      <span style={{ display: "inline-block", width: 1.5, height: (ty.fontSize ?? 14) * 1.2, marginLeft: 1, verticalAlign: "-3px", background: Math.floor(frame / 8) % 2 === 0 || typed < ty.text.length ? ty.color ?? "#18181b" : "transparent" }} />
                    </div>
                  )}
                  {beat.cursor && (
                    <Cursor path={beat.cursor.path.map(([f, x, y]) => ({ frame: f, x, y }))} clicks={beat.cursor.clicks ?? []} scale={1.15 / zoom} />
                  )}
                </Camera>
              )}
            </BrowserFrame>
          </Tilt>
          {beat.toast && (
            <div style={{ position: "absolute", left: -60, bottom: -54 }}>
              <Pop at={beat.toast.at} sound="pop3" volume={0.6} origin="left center">
                <div style={{ padding: "14px 24px", borderRadius: 999, background: b.ink, color: "#fff", fontFamily: b.font, fontSize: 24, fontWeight: 500, boxShadow: "0 12px 30px rgba(15,23,42,0.25)", whiteSpace: "nowrap" }}>
                  {beat.toast.text}
                </div>
              </Pop>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- 5 · end card: the product's hero, rebuilt ---------- */
const EndCard: React.FC = () => {
  const cfg = useCfg();
  const b = cfg.brand;
  const frame = useCurrentFrame();
  const words = cfg.hero.headline.replace(/\.$/, "").split(" ");
  const g = cfg.hero.gradientFrom ?? Math.ceil(words.length / 2);
  const line1 = words.slice(0, g).join(" ");
  const line2 = words.slice(g).join(" ");
  const size = Math.min(118, Math.floor(1500 / Math.max(8, Math.max(line1.length, line2.length) * 0.55)));
  return (
    <AbsoluteFill>
      <HeroBackdrop brand={b} gridCenterY="45%" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: interpolate(frame, [0, 6], [0, 1], clamp) }}>
        <Pop at={2} sound={null}>
          <Lockup config={cfg} height={84} />
        </Pop>
        <div style={{ height: 46 }} />
        {cfg.hero.pill && (
          <>
            <Pop at={6} sound={null}>
              <Pill brand={b} scale={1.25}>{cfg.hero.pill}</Pill>
            </Pop>
            <div style={{ height: 40 }} />
          </>
        )}
        {line1 && <WordReveal text={line1} at={10} every={4} fontFamily={b.font} fontSize={size} fontWeight={700} letterSpacing={-0.04} color={b.ink} sound={null} align="center" />}
        {line2 && <WordReveal text={line2} at={10 + line1.split(" ").length * 4} every={4} fontFamily={b.font} fontSize={size} fontWeight={700} letterSpacing={-0.04} color={b.ink} sound={null} align="center" wordStyle={() => gradientText(b)} />}
        <div style={{ height: 54 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: interpolate(frame, [34, 44], [0, 1], clamp), transform: `translateY(${interpolate(frame, [34, 44], [14, 0], clamp)}px)` }}>
          {cfg.hero.cta && <CtaButton brand={b} label={cfg.hero.cta} scale={1.25} />}
          <span style={{ fontFamily: b.font, fontSize: 28, fontWeight: 500, color: b.muted }}>{cfg.hero.url}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Build a reel from a config. Returns the component and its duration for <Composition>.
 * `custom` maps beat ids to product-specific animated screens (e.g. a ported live UI).
 */
export function makeReel(config: ReelConfig, opts: { custom?: Record<string, CustomBeat> } = {}) {
  const tl = timeline(config);
  const scenes: Scene[] = tl.scenes.map((s) => {
    const base = { id: s.id, durationInFrames: s.duration, transition: s.transition, transitionFrames: s.transition === "pan" ? PAN : undefined };
    if (s.id === "montage") return { ...base, component: Montage };
    if (s.id === "assemble") return { ...base, component: Assemble };
    if (s.id === "headline") return { ...base, component: Headline };
    if (s.id === "end") return { ...base, component: EndCard };
    const beat = config.beats.find((x) => `beat:${x.id}` === s.id)!;
    const C: React.FC = () => <BeatScene beat={beat} duration={s.duration} custom={opts.custom?.[beat.id]} />;
    C.displayName = s.id;
    return { ...base, component: C };
  });
  const Reel: React.FC = () => (
    <Ctx.Provider value={config}>
      <DemoVideo
        scenes={scenes}
        transitionFrames={PAN}
        backdrop={null}
        overlay={<Audio src={asset(config, "music.wav")} volume={config.musicVolume ?? 0.9} />}
        fontFamily={config.brand.font}
      />
    </Ctx.Provider>
  );
  return { Reel, durationInFrames: tl.total, timeline: tl };
}
