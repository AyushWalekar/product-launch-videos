import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CREDIT, fonts, palette as p, type Aspect } from "./theme";

// "Benchmark Receipt #N": a recurring card for the occasional series. A narrow printed slip: header,
// itemised lines that print one by one, a rule, then the verdict. No chart.

export type ReceiptLine = { label: string; value: string; /** Set the value in vermilion. */ em?: boolean };

export type StatReceiptProps = {
  aspect: Aspect;
  series?: string;
  number: number;
  /** What the receipt is for: "Terminal-Bench 4.0". */
  topic: string;
  /** Date line under the topic, e.g. "Artificial Analysis · Nov 3 2026". */
  dated: string;
  lines: ReceiptLine[];
  verdict: string;
  source: string;
  credit?: string;
  holdSeconds?: number;
};

const START = 14;
const LINE_GAP = 9;

export function receiptTiming(props: StatReceiptProps, fps = 30) {
  const verdictAt = START + 16 + props.lines.length * LINE_GAP + 8;
  return { verdictAt, duration: verdictAt + 16 + Math.round((props.holdSeconds ?? 3.5) * fps) };
}

const Rule: React.FC<{ dashed?: boolean }> = ({ dashed }) => (
  <div style={{ borderTop: `2px ${dashed ? "dashed" : "solid"} ${dashed ? p.muted : p.ink}`, margin: "26px 0" }} />
);

export const StatReceipt: React.FC<StatReceiptProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const tm = receiptTiming(props, fps);
  const intro = spring({ frame: frame - 2, fps, config: { damping: 200 }, durationInFrames: 14 });
  const verdict = spring({ frame: frame - tm.verdictAt, fps, config: { damping: 200 }, durationInFrames: 14 });
  const big = height > 1200;

  return (
    <AbsoluteFill style={{ background: p.paper, color: p.ink, fontFamily: fonts.mono, padding: 64, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ flex: 1, width: "100%", maxWidth: 820, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ opacity: intro, transform: `translateY(${(1 - intro) * 12}px)` }}>
          <div style={{ fontSize: 22, letterSpacing: 3, color: p.red, textTransform: "uppercase" }}>
            {props.series ?? "Benchmark Receipt"} #{props.number}
          </div>
          <div style={{ fontFamily: fonts.serif, fontSize: big ? 64 : 56, fontWeight: 600, lineHeight: 1.08, marginTop: 16, letterSpacing: -0.5 }}>{props.topic}</div>
          <div style={{ fontSize: 22, color: p.muted, marginTop: 12 }}>{props.dated}</div>
        </div>
        <Rule dashed />
        {props.lines.map((l, i) => {
          const at = START + 16 + i * LINE_GAP;
          const o = interpolate(frame, [at, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 14, fontSize: big ? 32 : 29, lineHeight: 1.25, padding: "11px 0", opacity: o, transform: `translateY(${(1 - o) * -8}px)` }}>
              <span style={{ color: p.ink2, whiteSpace: "nowrap" }}>{l.label}</span>
              <span style={{ flex: 1, borderBottom: `2px dotted ${p.rule}`, transform: "translateY(-6px)" }} />
              <span style={{ fontWeight: 700, color: l.em ? p.red : p.ink, whiteSpace: "nowrap" }}>{l.value}</span>
            </div>
          );
        })}
        <Rule />
        <div style={{ opacity: verdict, transform: `translateY(${(1 - verdict) * 10}px)` }}>
          <div style={{ fontSize: 22, letterSpacing: 3, color: p.red }}>VERDICT</div>
          <div style={{ fontFamily: fonts.serif, fontSize: big ? 46 : 40, lineHeight: 1.2, fontWeight: 600, marginTop: 12 }}>{props.verdict}</div>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          borderTop: `1.5px solid ${p.rule}`,
          paddingTop: 18,
          fontFamily: fonts.sans,
          fontSize: 20,
          lineHeight: 1.4,
          color: p.muted,
          opacity: intro,
        }}
      >
        <div style={{ flex: 1 }}>{props.source}</div>
        <div style={{ fontWeight: 600, color: p.ink2, whiteSpace: "nowrap" }}>{props.credit ?? CREDIT}</div>
      </div>
    </AbsoluteFill>
  );
};
