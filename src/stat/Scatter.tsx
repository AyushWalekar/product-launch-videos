import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, mathFrames, type Callout } from "./Frame";
import { PEN_FRAMES, PenStroke, PenText, ringPath } from "./pen";
import { formatTick, type ValueFormat } from "./format";
import { Logo } from "./logo";
import { fonts, labColor, logoFor, palette as p, type Aspect } from "./theme";
import { logTicks, niceTicks, useSize } from "./useSize";

export type Point = {
  label: string;
  x: number;
  y: number;
  color?: string;
  lab?: string;
  focus?: boolean;
  /** Logo file in public/logos, or false for none. Default: matched from label, then lab. */
  logo?: string | false;
  /** Label this point even when it isn't a focus point. */
  showLabel?: boolean;
  /** Which side of the dot the label sits on when the default (right) collides. */
  labelSide?: "left" | "right" | "above" | "below";
  /** Pen loop around this point after the frontier, with an optional note ("\n" breaks lines). */
  ring?: boolean;
  note?: string;
  /** Note offset from the point, px; negative dx right-aligns it. */
  noteDx?: number;
  noteDy?: number;
};

export type StatScatterProps = {
  aspect: Aspect;
  kicker?: string;
  title: string;
  subtitle?: string;
  points: Point[];
  xLabel: string;
  yLabel: string;
  xFormat?: ValueFormat;
  yFormat?: ValueFormat;
  xLog?: boolean;
  /** Draw the frontier: lowest x for each level of y ("cheaper and smarter" corner is top left). */
  frontier?: boolean;
  /** "ink" (default): focus points ink, others grey. "lab": lab colours. */
  colors?: "ink" | "lab";
  math?: string[];
  callout?: Callout;
  source: string;
  credit?: string;
  holdSeconds?: number;
};

const START = 14;

export function scatterTiming(props: StatScatterProps, fps = 30) {
  const step = props.points.length > 14 ? 2 : 4;
  const labelsAt = START + props.points.length * step + 8;
  const frontierAt = labelsAt + 10;
  const ringsAt = frontierAt + (props.frontier ? PEN_FRAMES + 6 : 0);
  const rings = props.points.filter((q) => q.ring).length;
  const mathAt = ringsAt + rings * (PEN_FRAMES + 6);
  const calloutAt = mathAt + mathFrames(props.math);
  const duration = calloutAt + (props.callout ? 12 : 0) + Math.round((props.holdSeconds ?? 3.5) * fps);
  return { step, frontierAt, labelsAt, ringsAt, mathAt, calloutAt, duration };
}

export const StatScatter: React.FC<StatScatterProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tm = scatterTiming(props, fps);
  const [ref, size] = useSize<HTMLDivElement>();
  const pts = props.points;
  const xv = pts.map((q) => q.x), yv = pts.map((q) => q.y);
  const xLo = props.xLog ? Math.min(...xv) / 1.4 : Math.min(0, ...xv), xHi = Math.max(...xv) * (props.xLog ? 1.4 : 1.05);
  const yt = niceTicks(Math.min(...yv) - 2, Math.max(...yv) + 2, 4);
  const yLo = yt[0], yHi = yt[yt.length - 1];
  const xt = props.xLog ? logTicks(xLo, xHi) : niceTicks(xLo, xHi, 5);

  const L = 96, R = 40, T = 20, B = 86;
  const W = Math.max(1, size.width - L - R), H = Math.max(1, size.height - T - B);
  const X = (v: number) => L + (props.xLog ? Math.log10(v / xLo) / Math.log10(xHi / xLo) : (v - xLo) / (xHi - xLo)) * W;
  const Y = (v: number) => T + H - ((v - yLo) / (yHi - yLo)) * H;

  const order = [...pts].sort((a, b) => a.x - b.x);
  const frontier: Point[] = [];
  for (const q of order) if (!frontier.length || q.y > frontier[frontier.length - 1].y) frontier.push(q);
  const fPath = frontier.map((q, i) => `${i ? "L" : "M"}${X(q.x).toFixed(1)},${Y(q.y).toFixed(1)}`).join(" ");
  const hasFocus = pts.some((q) => q.focus);
  const labels = spring({ frame: frame - tm.labelsAt, fps, config: { damping: 200 }, durationInFrames: 12 });

  const marks: { x: number; y: number; src: string; size: number; o: number }[] = [];
  return (
    // label logos, collected while drawing the points and laid over the SVG
    <Frame {...props} calloutAt={tm.calloutAt} mathAt={tm.mathAt}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }}>
        {size.width > 0 && (
          <svg width={size.width} height={size.height} style={{ overflow: "visible", fontFamily: fonts.sans }}>
            {yt.map((v) => (
              <g key={`y${v}`}>
                <line x1={L} x2={L + W} y1={Y(v)} y2={Y(v)} stroke={p.rule} strokeWidth={1.5} />
                <text x={L - 14} y={Y(v) + 8} textAnchor="end" fontSize={22} fill={p.muted}>
                  {formatTick(v, props.yFormat)}
                </text>
              </g>
            ))}
            {xt.map((v) => (
              <text key={`x${v}`} x={X(v)} y={T + H + 34} textAnchor="middle" fontSize={22} fill={p.muted}>
                {formatTick(v, props.xFormat)}
              </text>
            ))}
            <line x1={L} x2={L + W} y1={T + H} y2={T + H} stroke={p.ink2} strokeWidth={2} />
            <text x={L + W / 2} y={T + H + 74} textAnchor="middle" fontSize={23} fontWeight={600} fill={p.ink2}>
              {props.xLabel}
            </text>
            <text transform={`translate(${L - 70},${T + H / 2}) rotate(-90)`} textAnchor="middle" fontSize={23} fontWeight={600} fill={p.ink2}>
              {props.yLabel}
            </text>
            {props.frontier && frontier.length > 1 && <PenStroke d={fPath} at={tm.frontierAt} width={3} />}
            {order.map((q, i) => {
              const s = spring({ frame: frame - START - i * tm.step, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
              const color = hasFocus && !q.focus ? p.muted : props.colors === "lab" ? q.color ?? labColor(q.lab) : p.ink;
              const cx = X(q.x), cy = Y(q.y);
              const show = q.focus || q.showLabel || (!hasFocus && pts.length <= 10);
              const side = q.labelSide ?? (cx > L + W * 0.8 ? "left" : "right");
              const gap = q.ring ? 22 : 0; // clear the pen loop drawn around ringed points
              const lx = side === "left" ? cx - 18 - gap : side === "right" ? cx + 18 + gap : cx;
              const ly = side === "above" ? cy - 22 - gap : side === "below" ? cy + 36 + gap : cy + 8;
              const logo = show && (side === "left" || side === "right") ? logoFor(q.label, q.lab, q.logo) : null;
              const ls = q.focus ? 28 : 24;
              if (logo) marks.push({ x: side === "right" ? lx + ls / 2 : lx - ls / 2, y: ly - 8, src: logo, size: ls, o: labels * (q.focus || !hasFocus ? 1 : 0.6) });
              const tx = logo ? (side === "right" ? lx + ls + 8 : lx - ls - 8) : lx;
              const anchor = side === "left" ? "end" : side === "right" ? "start" : "middle";
              return (
                <g key={q.label}>
                  <circle cx={cx} cy={cy} r={(q.focus ? 13 : 10) * s} fill={color} stroke={p.card} strokeWidth={3} />
                  {show && (
                    <text x={tx} y={ly} textAnchor={anchor} fontSize={q.focus ? 25 : 21} fontWeight={q.focus ? 700 : 500} fill={q.focus ? p.ink : p.ink2} opacity={labels}>
                      {q.label}
                    </text>
                  )}
                </g>
              );
            })}
            {pts
              .filter((q) => q.ring)
              .map((q, k) => {
                const at = tm.ringsAt + k * (PEN_FRAMES + 6);
                const cx = X(q.x), cy = Y(q.y);
                const left = cx > L + W * 0.6;
                return (
                  <g key={`ring${k}`}>
                    <PenStroke at={at} d={ringPath(cx, cy, 30, 30)} />
                    {q.note && (
                      <PenText
                        x={cx + (q.noteDx ?? (left ? -44 : 44))}
                        y={cy + (q.noteDy ?? (cy > T + H * 0.5 ? -46 : 60))}
                        text={q.note}
                        at={at}
                        anchor={(q.noteDx ?? (left ? -1 : 1)) < 0 ? "end" : "start"}
                        size={23}
                      />
                    )}
                  </g>
                );
              })}
          </svg>
        )}
        {marks.map((m, k) => (
          <Logo key={k} src={m.src} x={m.x} y={m.y} size={m.size} opacity={m.o} />
        ))}
      </div>
    </Frame>
  );
};
