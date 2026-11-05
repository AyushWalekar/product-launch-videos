import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CREDIT, fonts, palette as p } from "./theme";

export type Callout = { text: string; sub?: string };

export type FrameProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Short result that lands last, top right in the accent colour (e.g. "1.3 tasks"). Optional: the math strip usually carries it. */
  callout?: Callout;
  calloutAt?: number;
  /**
   * The worked arithmetic behind the post, typed out under the chart, one line after another.
   * Wrap the result in [[ ]] to set it in the accent colour: "2.0 pts × 66 tasks = [[1.3 tasks]]".
   */
  math?: string[];
  mathAt?: number;
  /** Source line: where every number came from, with the date. Always required. */
  source: string;
  credit?: string;
  children: React.ReactNode;
};

const PAD = 56;
const CARD_PAD = 32;

/** Vercel-style canvas: a faint grid that fades out from the top, and a soft glow behind the title. */
const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${p.border} 1px, transparent 1px), linear-gradient(90deg, ${p.border} 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
        opacity: 0.45,
        maskImage: "radial-gradient(ellipse 90% 55% at 50% 0%, black 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 55% at 50% 0%, black 0%, transparent 75%)",
      }}
    />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 30% at 20% 0%, rgba(59,158,255,0.10), transparent 70%)" }} />
  </AbsoluteFill>
);
const CHARS_PER_FRAME = 1.6;

/** Frames the math strip needs to type out (plus a beat between lines). */
export const mathFrames = (math?: string[]) =>
  (math ?? []).reduce((t, line) => t + Math.ceil(line.replace(/\[\[|\]\]/g, "").length / CHARS_PER_FRAME) + 8, 0);

type Seg = { text: string; em: boolean };
const segments = (line: string): Seg[] =>
  line.split(/(\[\[.*?\]\])/).filter(Boolean).map((s) => (s.startsWith("[[") ? { text: s.slice(2, -2), em: true } : { text: s, em: false }));

const MathStrip: React.FC<{ math: string[]; at: number }> = ({ math, at }) => {
  const frame = useCurrentFrame();
  let start = at;
  return (
    <div style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 14, padding: "18px 26px", marginBottom: 22, fontFamily: fonts.mono, fontSize: 26, lineHeight: 1.6, color: p.ink }}>
      {math.map((line, i) => {
        const segs = segments(line);
        const total = segs.reduce((n, s) => n + s.text.length, 0);
        const shown = Math.max(0, Math.min(total, Math.floor((frame - start) * CHARS_PER_FRAME)));
        const typing = frame >= start && shown < total;
        start += Math.ceil(total / CHARS_PER_FRAME) + 8;
        let left = shown;
        return (
          <div key={i} style={{ minHeight: 42, whiteSpace: "pre" }}>
            {segs.map((s, k) => {
              const part = s.text.slice(0, Math.max(0, left));
              left -= s.text.length;
              return (
                <span key={k} style={s.em ? { color: p.accent, fontWeight: 700, background: part ? p.accentSoft : undefined, borderRadius: 6, padding: part ? "1px 6px" : 0 } : undefined}>
                  {part}
                </span>
              );
            })}
            {typing && <span style={{ display: "inline-block", width: 14, height: 28, background: p.accent, verticalAlign: -4, marginLeft: 2 }} />}
          </div>
        );
      })}
    </div>
  );
};

/** Shared clip layout: header (kicker, title, subtitle, callout), the chart, the math strip, then source and credit. */
export const Frame: React.FC<FrameProps> = ({ kicker, title, subtitle, callout, calloutAt = 0, math, mathAt = 0, source, credit = CREDIT, children }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const pop = spring({ frame: frame - calloutAt, fps, config: { damping: 200 }, durationInFrames: 12 });
  const titleSize = width >= 1500 ? 60 : title.length > 52 ? 46 : 54;

  return (
    <AbsoluteFill style={{ background: p.bg, color: p.ink, fontFamily: fonts.sans, padding: PAD, display: "flex", flexDirection: "column" }}>
      <Backdrop />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 32, opacity: intro, transform: `translateY(${(1 - intro) * 14}px)` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {kicker && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: fonts.mono, fontSize: 19, letterSpacing: 1.5, textTransform: "uppercase", color: p.ink2, border: `1px solid ${p.border}`, background: p.card, borderRadius: 999, padding: "8px 18px", marginBottom: 22 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, background: p.accent, boxShadow: `0 0 12px ${p.accent}` }} />
              {kicker}
            </div>
          )}
          <div style={{ fontSize: titleSize, lineHeight: 1.08, fontWeight: 600, letterSpacing: -titleSize * 0.022 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 26, lineHeight: 1.4, color: p.ink2, marginTop: 14 }}>{subtitle}</div>}
        </div>
        {callout && (
          <div style={{ textAlign: "right", maxWidth: "34%", opacity: pop, transform: `translateY(${(1 - pop) * 10}px)` }}>
            <div style={{ fontSize: callout.text.length > 6 ? 60 : 88, lineHeight: 0.95, fontWeight: 700, letterSpacing: -2, color: p.accent }}>
              {callout.text}
            </div>
            {callout.sub && <div style={{ fontSize: 24, lineHeight: 1.3, color: p.ink2, marginTop: 10 }}>{callout.sub}</div>}
          </div>
        )}
      </div>
      <div style={{ flex: 1, position: "relative", marginTop: 32, marginBottom: 22, background: p.card, border: `1px solid ${p.border}`, borderRadius: 16 }}>
        <div style={{ position: "absolute", inset: CARD_PAD }}>{children}</div>
      </div>
      {math && math.length > 0 && <MathStrip math={math} at={mathAt} />}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          fontSize: 19,
          lineHeight: 1.4,
          color: p.muted,
          opacity: interpolate(intro, [0, 1], [0, 1]),
        }}
      >
        <div style={{ flex: 1 }}>{source}</div>
        <div style={{ fontWeight: 600, color: p.ink2, whiteSpace: "nowrap" }}>{credit}</div>
      </div>
    </AbsoluteFill>
  );
};
