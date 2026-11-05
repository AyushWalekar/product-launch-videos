import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { palette as p } from "./theme";

// The accent "pen": marks drawn onto a finished chart, one stroke at a time, like annotating a printout.

export const PEN_FRAMES = 16;

/** A loose hand-drawn loop around a box: one turn and a bit, slightly off-round so it reads as drawn. */
export function ringPath(cx: number, cy: number, rx: number, ry: number) {
  const pts: string[] = [];
  const turns = 1.12, steps = 72;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * Math.PI * 2 - 2.4;
    const grow = 1 + 0.07 * (i / steps);
    const x = cx + Math.cos(t) * rx * grow + Math.sin(t * 2) * 2;
    const y = cy + Math.sin(t) * ry * grow;
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

/** "]" bracket spanning y1..y2 at x, opening to the left, with a tick pointing at its label. */
export const bracketRight = (x: number, y1: number, y2: number) =>
  `M${x - 12},${y1} L${x},${y1} L${x},${y2} L${x - 12},${y2} M${x},${(y1 + y2) / 2} L${x + 12},${(y1 + y2) / 2}`;

/** Bracket over x1..x2 at y, opening downwards, with a tick pointing up at its label. */
export const bracketTop = (x1: number, x2: number, y: number) =>
  `M${x1},${y + 12} L${x1},${y} L${x2},${y} L${x2},${y + 12} M${(x1 + x2) / 2},${y} L${(x1 + x2) / 2},${y - 12}`;

/** Draws `d` with the pen starting at frame `at`. */
export const PenStroke: React.FC<{ d: string; at: number; width?: number; dash?: string }> = ({ d, at, width = 3.5, dash }) => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [at, at + PEN_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 2),
  });
  if (prog <= 0) return null;
  if (dash) return <path d={d} fill="none" stroke={p.accent} strokeWidth={width} strokeDasharray={dash} opacity={prog} />;
  const ev = evolvePath(prog, d);
  return (
    <path d={d} fill="none" stroke={p.accent} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
  );
};

/** Pen note text that fades in as its stroke finishes. Lines split on "\n". */
export const PenText: React.FC<{ x: number; y: number; text: string; at: number; size?: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  text,
  at,
  size = 25,
  anchor = "start",
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at + PEN_FRAMES * 0.6, at + PEN_FRAMES + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lines = text.split("\n");
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={700} fill={p.accent} opacity={o}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * 1.2}>
          {l}
        </tspan>
      ))}
    </text>
  );
};
