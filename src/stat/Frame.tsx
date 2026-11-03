import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CREDIT, fonts, palette as p } from "./theme";

export type Callout = { text: string; sub?: string };

export type FrameProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Short result that lands last, top right in vermilion (e.g. "1.3 tasks"). Optional: the math strip usually carries it. */
  callout?: Callout;
  calloutAt?: number;
  /**
   * The worked arithmetic behind the post, typed out under the chart, one line after another.
   * Wrap the result in [[ ]] to set it in vermilion: "2.0 pts × 66 tasks = [[1.3 tasks]]".
   */
  math?: string[];
  mathAt?: number;
  /** Source line: where every number came from, with the date. Always required. */
  source: string;
  credit?: string;
  children: React.ReactNode;
};

const PAD = 64;
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
    <div style={{ borderTop: `1.5px solid ${p.rule}`, paddingTop: 16, marginBottom: 18, fontFamily: fonts.mono, fontSize: 27, lineHeight: 1.55, color: p.ink }}>
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
                <span key={k} style={s.em ? { color: p.red, fontWeight: 700 } : undefined}>
                  {part}
                </span>
              );
            })}
            {typing && <span style={{ display: "inline-block", width: 14, height: 28, background: p.red, verticalAlign: -4, marginLeft: 2 }} />}
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
    <AbsoluteFill style={{ background: p.paper, color: p.ink, fontFamily: fonts.sans, padding: PAD, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 32, opacity: intro, transform: `translateY(${(1 - intro) * 14}px)` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {kicker && (
            <div style={{ fontFamily: fonts.mono, fontSize: 20, letterSpacing: 2.5, textTransform: "uppercase", color: p.red, marginBottom: 18 }}>
              {kicker}
            </div>
          )}
          <div style={{ fontFamily: fonts.serif, fontSize: titleSize, lineHeight: 1.12, fontWeight: 600, letterSpacing: -0.5 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 27, lineHeight: 1.35, color: p.ink2, marginTop: 14 }}>{subtitle}</div>}
        </div>
        {callout && (
          <div style={{ textAlign: "right", maxWidth: "34%", opacity: pop, transform: `translateY(${(1 - pop) * 10}px)` }}>
            <div style={{ fontFamily: fonts.serif, fontSize: callout.text.length > 6 ? 60 : 88, lineHeight: 0.95, fontWeight: 700, color: p.red }}>
              {callout.text}
            </div>
            {callout.sub && <div style={{ fontSize: 24, lineHeight: 1.3, color: p.ink2, marginTop: 10 }}>{callout.sub}</div>}
          </div>
        )}
      </div>
      <div style={{ flex: 1, position: "relative", marginTop: 36, marginBottom: 24 }}>{children}</div>
      {math && math.length > 0 && <MathStrip math={math} at={mathAt} />}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          borderTop: `1.5px solid ${p.rule}`,
          paddingTop: 18,
          fontSize: 20,
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
