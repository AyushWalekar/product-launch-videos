import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type CursorKey = { frame: number; x: number; y: number };

/** Animated pointer that eases between keyframes and ripples on `clicks`. */
export const Cursor: React.FC<{ path: CursorKey[]; clicks?: number[]; scale?: number }> = ({
  path,
  clicks = [],
  scale = 1.4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frames = path.map((k) => k.frame);
  const ease = { easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const x = path.length > 1 ? interpolate(frame, frames, path.map((k) => k.x), ease) : path[0].x;
  const y = path.length > 1 ? interpolate(frame, frames, path.map((k) => k.y), ease) : path[0].y;
  const appear = interpolate(frame, [path[0].frame - 8, path[0].frame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let press = 0;
  let ripple: React.ReactNode = null;
  for (const c of clicks) {
    if (frame >= c - 4 && frame < c + 30) {
      press = interpolate(frame, [c - 4, c, c + 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const r = spring({ frame: frame - c, fps, config: { damping: 200 }, durationInFrames: 24 });
      ripple = (
        <div
          style={{
            position: "absolute",
            left: x - 40,
            top: y - 40,
            width: 80,
            height: 80,
            borderRadius: 40,
            border: "3px solid rgba(255,255,255,0.9)",
            transform: `scale(${0.2 + r})`,
            opacity: 1 - r,
          }}
        />
      );
    }
  }

  return (
    <>
      {ripple}
      <svg
        width={28 * scale}
        height={36 * scale}
        viewBox="0 0 28 36"
        style={{
          position: "absolute",
          left: x,
          top: y,
          opacity: appear,
          transform: `scale(${1 - press * 0.15})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
        }}
      >
        <path d="M2 2 L2 28 L9 21.5 L13.5 32 L18 30 L13.6 19.8 L23 19.8 Z" fill="#111" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </>
  );
};
