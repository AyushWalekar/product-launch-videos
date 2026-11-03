import React from "react";
import { interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, mathFrames, type Callout } from "./Frame";
import { formatValue, type ValueFormat } from "./format";
import { PEN_FRAMES, PenStroke, PenText, bracketRight, bracketTop, ringPath } from "./pen";
import { fonts, labColor, palette as p, type Aspect } from "./theme";
import { useSize } from "./useSize";

export type Bar = {
  label: string;
  /** Second line under the label: effort, rank, plan. */
  sub?: string;
  value: number;
  /** Final label text when the formatter can't express it. */
  display?: string;
  color?: string;
  lab?: string;
  /** The bars the post is about: drawn in ink, the rest in a light grey. */
  focus?: boolean;
};

export type Panel = {
  title?: string;
  /** Right side of the panel title, e.g. "lower is better". */
  note?: string;
  bars: Bar[];
  format?: ValueFormat;
  decimals?: number;
  /** Axis maximum; defaults to the largest bar. */
  max?: number;
  /** Log scale for ranges over ~30×. Say so in the subtitle. */
  log?: boolean;
};

/** Pen marks drawn in order after the bars, each pointing at the part of the chart the math is about. */
export type Annotation =
  | { type: "ring"; bar: number; panel?: number }
  | { type: "bracket"; from: number; to: number; text: string; panel?: number }
  | { type: "line"; value: number; text?: string; panel?: number };

export type StatBarsProps = {
  aspect: Aspect;
  kicker?: string;
  title: string;
  subtitle?: string;
  panels: Panel[];
  orientation?: "auto" | "vertical" | "horizontal";
  /** "ink" (default): ink focus bars, grey context, vermilion only for the pen. "lab": lab colours. */
  colors?: "ink" | "lab";
  annotations?: Annotation[];
  math?: string[];
  callout?: Callout;
  source: string;
  credit?: string;
  holdSeconds?: number;
};

const START = 12;
const GROW = 20;
const CONTEXT = "#CFC8B9"; // context bars: visible, clearly behind the focus bars
const ANN_GAP = PEN_FRAMES + 6;

const isHorizontal = (props: StatBarsProps) =>
  props.orientation === "horizontal" || (props.orientation !== "vertical" && props.panels.some((x) => x.bars.length > 6));

export function barsTiming(props: StatBarsProps, fps = 30) {
  const stagger = isHorizontal(props) ? 3 : 4;
  const starts: number[] = [];
  let t = START;
  for (const panel of props.panels) {
    starts.push(t);
    t += (panel.bars.length - 1) * stagger + GROW + 10;
  }
  const chartEnd = t;
  const n = props.annotations?.length ?? 0;
  const annAt = Array.from({ length: n }, (_, k) => chartEnd + k * ANN_GAP);
  const mathAt = chartEnd + n * ANN_GAP + (n ? 4 : 0);
  const calloutAt = mathAt + mathFrames(props.math);
  const duration = calloutAt + (props.callout ? 12 : 0) + Math.round((props.holdSeconds ?? 3.5) * fps);
  return { stagger, starts, chartEnd, annAt, mathAt, calloutAt, duration };
}

function scaler(panel: Panel) {
  const max = panel.max ?? Math.max(...panel.bars.map((b) => b.value));
  if (!panel.log) return (v: number) => Math.max(0, v) / max;
  const lo = Math.pow(10, Math.floor(Math.log10(Math.min(...panel.bars.map((b) => b.value).filter((v) => v > 0)) / 2)));
  return (v: number) => Math.max(0, Math.log10(Math.max(v, lo) / lo) / Math.log10(max / lo));
}

const valueText = (panel: Panel, bar: Bar, grow: number) =>
  grow > 0.985 && bar.display ? bar.display : formatValue(bar.value * grow, panel.format, panel.decimals);

/** Rough width of bold Avenir text, enough to place pen marks clear of labels. */
const textW = (s: string, size: number) => s.length * size * 0.6;

function wrap(text: string, maxChars: number) {
  const out: string[] = [];
  for (const w of text.split(" ")) {
    const last = out[out.length - 1];
    if (last && (last + " " + w).length <= maxChars) out[out.length - 1] = last + " " + w;
    else out.push(w);
  }
  return out;
}

function useBars(props: StatBarsProps, panel: Panel, pi: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tm = barsTiming(props, fps);
  const hasFocus = panel.bars.some((b) => b.focus);
  const lab = props.colors === "lab";
  const emph = spring({ frame: frame - tm.chartEnd, fps, config: { damping: 200 }, durationInFrames: 12 });
  const bars = panel.bars.map((b, i) => {
    const grow = spring({ frame: frame - tm.starts[pi] - i * tm.stagger, fps, config: { damping: 200 }, durationInFrames: GROW });
    let fill: string;
    if (lab) {
      const base = b.color ?? labColor(b.lab);
      fill = hasFocus && !b.focus ? interpolateColors(emph, [0, 1], [base, p.tint]) : base;
    } else fill = !hasFocus ? p.ink2 : b.focus ? p.ink : CONTEXT;
    const strong = !hasFocus || b.focus;
    return { b, grow, fill, ink: strong ? p.ink : p.muted, subInk: strong ? p.ink2 : p.muted };
  });
  const anns = (props.annotations ?? []).map((a, k) => ({ a, at: tm.annAt[k] })).filter((x) => (x.a.panel ?? 0) === pi);
  return { bars, anns, scale: scaler(panel) };
}

const PanelTitle: React.FC<{ panel: Panel }> = ({ panel }) =>
  panel.title || panel.note ? (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: p.ink }}>{panel.title}</div>
      {panel.note && <div style={{ fontSize: 24, color: p.muted }}>{panel.note}</div>}
    </div>
  ) : null;

const HorizontalPanel: React.FC<{ props: StatBarsProps; panel: Panel; pi: number }> = ({ props, panel, pi }) => {
  const [ref, size] = useSize<HTMLDivElement>();
  const { bars, anns, scale } = useBars(props, panel, pi);
  const n = bars.length;
  const font = n > 9 ? 23 : 27;
  const W = size.width, H = size.height;
  const rowH = H / n, thick = Math.min(54, rowH * 0.58);
  const labelW = W * 0.33, x0 = labelW + 20;
  const hasBracket = anns.some((x) => x.a.type === "bracket");
  const trackW = (W - x0) * (hasBracket ? 0.56 : 0.76);
  const yc = (i: number) => rowH * (i + 0.5);
  const end = (i: number) => x0 + scale(bars[i].b.value) * trackW;
  const labelEnd = (i: number) => end(i) + 14 + textW(valueText(panel, bars[i].b, 1), font + 3);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <PanelTitle panel={panel} />
      <div ref={ref} style={{ flex: 1, position: "relative" }}>
        {W > 0 && (
          <svg width={W} height={H} style={{ overflow: "visible", fontFamily: fonts.sans, position: "absolute", inset: 0 }}>
            {bars.map(({ b, grow, fill, ink, subInk }, i) => {
              const w = scale(b.value) * grow * trackW;
              return (
                <g key={i}>
                  <text x={labelW} y={yc(i) + (b.sub ? -3 : font * 0.36)} textAnchor="end" fontSize={font} fontWeight={700} fill={ink}>
                    {b.label}
                  </text>
                  {b.sub && (
                    <text x={labelW} y={yc(i) + font * 0.95} textAnchor="end" fontSize={font - 5} fill={subInk}>
                      {b.sub}
                    </text>
                  )}
                  <rect x={x0} y={yc(i) - thick / 2} width={w} height={thick} fill={fill} rx={2} />
                  <text x={x0 + w + 14} y={yc(i) + font * 0.38} fontSize={font + 3} fontWeight={700} fill={ink} opacity={Math.min(1, grow * 4)} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {valueText(panel, b, grow)}
                  </text>
                </g>
              );
            })}
            <line x1={x0} x2={x0} y1={0} y2={H} stroke={p.ink2} strokeWidth={2} />
            {anns.map(({ a, at }, k) => {
              if (a.type === "ring") {
                const vw = textW(valueText(panel, bars[a.bar].b, 1), font + 3);
                return <PenStroke key={k} at={at} d={ringPath(end(a.bar) + 14 + vw / 2, yc(a.bar), vw / 2 + 22, thick * 0.78)} />;
              }
              if (a.type === "bracket") {
                const [i, j] = [Math.min(a.from, a.to), Math.max(a.from, a.to)];
                let x = 0;
                for (let r = i; r <= j; r++) x = Math.max(x, labelEnd(r));
                x += 24;
                const lines = a.text.split("\n").length;
                const ym = (yc(i) + yc(j)) / 2;
                return (
                  <g key={k}>
                    <PenStroke at={at} d={bracketRight(x, yc(i), yc(j))} />
                    <PenText x={x + 22} y={ym + 9 - (lines - 1) * 15} text={a.text} at={at} />
                  </g>
                );
              }
              const lx = x0 + scale(a.value) * trackW;
              return (
                <g key={k}>
                  <PenStroke at={at} d={`M${lx},${-8} L${lx},${H}`} dash="8 7" width={2.5} />
                  {a.text && <PenText x={lx + 8} y={-16} text={a.text} at={at} size={22} />}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

const VerticalPanel: React.FC<{ props: StatBarsProps; panel: Panel; pi: number }> = ({ props, panel, pi }) => {
  const [ref, size] = useSize<HTMLDivElement>();
  const { bars, anns, scale } = useBars(props, panel, pi);
  const n = bars.length;
  const font = n > 4 ? 32 : 40;
  const nameSize = n > 4 ? 23 : 27;
  const W = size.width, H = size.height;
  const hasBracket = anns.some((x) => x.a.type === "bracket");
  const labelsH = 100;
  const top = 62 + (hasBracket ? 96 : 0);
  const plotH = Math.max(1, H - top - labelsH);
  const base = top + plotH;
  const colW = W / n, barW = Math.min(150, colW * 0.6);
  const cx = (i: number) => colW * (i + 0.5);
  const yTop = (i: number) => base - scale(bars[i].b.value) * plotH;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <PanelTitle panel={panel} />
      <div ref={ref} style={{ flex: 1, position: "relative" }}>
        {W > 0 && (
          <svg width={W} height={H} style={{ overflow: "visible", fontFamily: fonts.sans, position: "absolute", inset: 0 }}>
            {bars.map(({ b, grow, fill, ink, subInk }, i) => {
              const h = scale(b.value) * grow * plotH;
              const name = wrap(b.label, Math.floor(colW / (nameSize * 0.58)));
              return (
                <g key={i}>
                  <rect x={cx(i) - barW / 2} y={base - h} width={barW} height={h} fill={fill} rx={2} />
                  <text x={cx(i)} y={base - h - 16} textAnchor="middle" fontSize={font} fontWeight={700} fill={ink} opacity={Math.min(1, grow * 4)} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {valueText(panel, b, grow)}
                  </text>
                  <text x={cx(i)} y={base + 36} textAnchor="middle" fontSize={nameSize} fontWeight={700} fill={ink}>
                    {name.map((l, k) => (
                      <tspan key={k} x={cx(i)} dy={k ? nameSize * 1.15 : 0}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                  {b.sub && (
                    <text x={cx(i)} y={base + 36 + name.length * nameSize * 1.15 + 2} textAnchor="middle" fontSize={nameSize - 4} fill={subInk}>
                      {b.sub}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={0} x2={W} y1={base} y2={base} stroke={p.ink2} strokeWidth={2} />
            {anns.map(({ a, at }, k) => {
              if (a.type === "ring") {
                const vw = textW(valueText(panel, bars[a.bar].b, 1), font);
                return <PenStroke key={k} at={at} d={ringPath(cx(a.bar), yTop(a.bar) - 20 - font * 0.35, vw / 2 + 22, font * 0.68)} />;
              }
              if (a.type === "bracket") {
                const y = Math.min(yTop(a.from), yTop(a.to)) - font - 46;
                const lines = a.text.split("\n").length;
                return (
                  <g key={k}>
                    <PenStroke at={at} d={bracketTop(cx(a.from), cx(a.to), y)} />
                    <PenText x={(cx(a.from) + cx(a.to)) / 2} y={y - 24 - (lines - 1) * 30} text={a.text} at={at} anchor="middle" />
                  </g>
                );
              }
              const ly = base - scale(a.value) * plotH;
              return (
                <g key={k}>
                  <PenStroke at={at} d={`M0,${ly} L${W},${ly}`} dash="8 7" width={2.5} />
                  {a.text && <PenText x={W} y={ly - 10} text={a.text} at={at} size={22} anchor="end" />}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export const StatBars: React.FC<StatBarsProps> = (props) => {
  const { fps } = useVideoConfig();
  const tm = barsTiming(props, fps);
  const horizontal = isHorizontal(props);
  const stacked = horizontal && props.panels.length > 1;
  return (
    <Frame {...props} calloutAt={tm.calloutAt} mathAt={tm.mathAt}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: stacked ? "column" : "row", gap: 56 }}>
        {props.panels.map((panel, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ [stacked ? "height" : "width"]: 1.5, background: p.rule, flexShrink: 0 }} />}
            {horizontal ? <HorizontalPanel props={props} panel={panel} pi={i} /> : <VerticalPanel props={props} panel={panel} pi={i} />}
          </React.Fragment>
        ))}
      </div>
    </Frame>
  );
};
