import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, mathFrames, type Callout } from "./Frame";
import { PEN_FRAMES, PenStroke, PenText, ringPath } from "./pen";
import { formatTick, formatValue, type ValueFormat } from "./format";
import { Logo } from "./logo";
import { fonts, labColor, logoFor, palette as p, type Aspect } from "./theme";
import { logTicks, niceTicks, useSize } from "./useSize";

export type Series = {
  label: string;
  /** [x, y] pairs. x is an ISO date ("2026-10-17") or any label; points are evenly spaced. */
  points: [string, number][];
  color?: string;
  lab?: string;
  focus?: boolean;
  /** Logo file in public/logos, or false for none. Default: matched from label, then lab. */
  logo?: string | false;
};

export type StatLineProps = {
  aspect: Aspect;
  kicker?: string;
  title: string;
  subtitle?: string;
  series: Series[];
  yFormat?: ValueFormat;
  yDecimals?: number;
  yMin?: number;
  yMax?: number;
  log?: boolean;
  /** "ink" (default): focus series in ink, others grey. "lab": lab colours. */
  colors?: "ink" | "lab";
  /**
   * Pen marks after the lines draw: a dashed marker at x (launch, price change), or with `ring` a loop
   * around that point of series `series` (default 0). Text sits beside the mark; "\n" breaks lines.
   */
  annotations?: { x: string; text: string; ring?: boolean; series?: number; /** Note offset from the point, px. */ dx?: number; dy?: number }[];
  math?: string[];
  callout?: Callout;
  source: string;
  credit?: string;
  drawSeconds?: number;
  holdSeconds?: number;
};

const START = 14;

export function lineTiming(props: StatLineProps, fps = 30) {
  const draw = Math.round((props.drawSeconds ?? 3) * fps);
  const notesAt = START + draw + 6;
  const n = props.annotations?.length ?? 0;
  const mathAt = notesAt + n * (PEN_FRAMES + 6);
  const calloutAt = mathAt + mathFrames(props.math);
  return { draw, notesAt, mathAt, calloutAt, duration: calloutAt + (props.callout ? 12 : 0) + Math.round((props.holdSeconds ?? 3.5) * fps) };
}

const xText = (x: string) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(x) ? new Date(`${x}T00:00:00Z`) : null;
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : x;
};

export const StatLine: React.FC<StatLineProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tm = lineTiming(props, fps);
  const [ref, size] = useSize<HTMLDivElement>();
  const xs = props.series[0].points.map(([x]) => x);
  const all = props.series.flatMap((s) => s.points.map(([, y]) => y));
  const yLo = props.yMin ?? (props.log ? Math.min(...all.filter((v) => v > 0)) : Math.min(0, ...all));
  const yHi = props.yMax ?? Math.max(...all);
  const ticks = props.log ? logTicks(yLo, yHi) : niceTicks(yLo, yHi, 4);
  const lo = props.log ? yLo : Math.min(yLo, ticks[0]);
  const hi = props.log ? yHi : Math.max(yHi, ticks[ticks.length - 1]);

  const L = 96, R = 244, T = 16, B = 48; // R leaves room for end labels
  const W = Math.max(1, size.width - L - R), H = Math.max(1, size.height - T - B);
  const X = (i: number) => L + (i / Math.max(1, xs.length - 1)) * W;
  const Y = (v: number) =>
    T + H - (props.log ? Math.log10(Math.max(v, lo) / lo) / Math.log10(hi / lo) : (v - lo) / (hi - lo)) * H;

  // A single sweep reveals every series; the cursor shows the date being drawn.
  const t = interpolate(frame, [START, START + tm.draw], [0, xs.length - 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (v) => 1 - Math.pow(1 - v, 2.2),
  });
  const done = frame >= START + tm.draw;
  const hasFocus = props.series.some((s) => s.focus);
  const labelEvery = Math.ceil(xs.length / 6);
  const cursorOpacity = interpolate(frame, [START, START + 4, START + tm.draw, START + tm.draw + 10], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const heads: { x: number; y: number; src: string; o: number }[] = [];
  return (
    // end-of-line logos, collected while drawing the series and laid over the SVG
    <Frame {...props} calloutAt={tm.calloutAt} mathAt={tm.mathAt}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }}>
        {size.width > 0 && (
          <svg width={size.width} height={size.height} style={{ overflow: "visible", fontFamily: fonts.sans }}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={L} x2={L + W} y1={Y(v)} y2={Y(v)} stroke={p.rule} strokeWidth={1.5} />
                <text x={L - 14} y={Y(v) + 8} textAnchor="end" fontSize={22} fill={p.muted}>
                  {formatTick(v, props.yFormat)}
                </text>
              </g>
            ))}
            {xs.map((x, i) =>
              (i % labelEvery === 0 && xs.length - 1 - i >= labelEvery / 2) || i === xs.length - 1 ? (
                <text key={x} x={X(i)} y={T + H + 36} textAnchor="middle" fontSize={22} fill={p.muted}>
                  {xText(x)}
                </text>
              ) : null,
            )}
            {(props.annotations ?? []).map((a, k) => {
              const i = xs.indexOf(a.x);
              if (i < 0) return null;
              const at = tm.notesAt + k * (PEN_FRAMES + 6);
              if (a.ring) {
                const s = props.series[a.series ?? 0];
                const py = Y(s.points[i][1]);
                const left = X(i) > L + W * 0.6;
                return (
                  <g key={k}>
                    <PenStroke at={at} d={ringPath(X(i), py, 26, 26)} />
                    <PenText x={X(i) + (a.dx ?? (left ? -40 : 40))} y={py + (a.dy ?? (py > T + H * 0.6 ? -40 : 52))} text={a.text} at={at} anchor={(a.dx ?? (left ? -1 : 1)) < 0 ? "end" : "start"} size={23} />
                  </g>
                );
              }
              return (
                <g key={k}>
                  <PenStroke at={at} d={`M${X(i)},${T} L${X(i)},${T + H}`} dash="8 7" width={2.5} />
                  <PenText x={X(i) + 10} y={T + 26 + k * 32} text={a.text} at={at} size={23} />
                </g>
              );
            })}
            {props.series.map((s, k) => {
              const lab = props.colors === "lab";
              const strong = s.focus || (!hasFocus && k === 0);
              const color = hasFocus && !s.focus ? p.muted : lab ? s.color ?? labColor(s.lab, p.ink) : strong ? p.ink : p.ink2;
              const n = Math.floor(t);
              const frac = t - n;
              const pts = s.points.slice(0, n + 1).map(([, y], i) => [X(i), Y(y)]);
              const next = s.points[Math.min(n + 1, s.points.length - 1)][1];
              const headV = s.points[n][1] + (next - s.points[n][1]) * frac;
              const head = [X(t), Y(headV)];
              const d = [...pts, head].map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
              const width = s.focus || !hasFocus ? 4.5 : 3;
              const logo = logoFor(s.label, s.lab, s.logo);
              const lx = head[0] + 16 + (logo ? 34 : 0);
              if (logo) heads.push({ x: head[0] + 16 + 13, y: head[1] + 14, src: logo, o: strong || !hasFocus ? 1 : 0.5 });
              return (
                <g key={s.label}>
                  <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx={head[0]} cy={head[1]} r={8} fill={color} stroke={p.card} strokeWidth={3} />
                  <text x={lx} y={head[1] - 6} fontSize={24} fontWeight={700} fill={color}>
                    {formatValue(headV, props.yFormat, props.yDecimals)}
                  </text>
                  <text x={lx} y={head[1] + 22} fontSize={21} fill={p.ink2} opacity={done ? 1 : 0.85}>
                    {s.label}
                  </text>
                </g>
              );
            })}
            <g opacity={cursorOpacity}>
              <line x1={X(t)} x2={X(t)} y1={T} y2={T + H} stroke={p.ink} strokeWidth={1.5} opacity={0.25} />
            </g>
          </svg>
        )}
        {heads.map((h, k) => (
          <Logo key={k} src={h.src} x={h.x} y={h.y} size={26} opacity={h.o} />
        ))}
      </div>
    </Frame>
  );
};
