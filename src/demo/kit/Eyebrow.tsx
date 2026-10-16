import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

/** Small mono, letter-spaced label that wipes in from the left. */
export const Eyebrow: React.FC<{
  children: string;
  delay?: number;
  fontFamily: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, fontFamily, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        fontFamily,
        fontSize: 22,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.7)",
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        opacity: p,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
