import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Viewfinder brackets: short dashes beside each corner of a w×h box, springing outward from `at`. */
export const Brackets: React.FC<{
  w: number;
  h: number;
  color?: string;
  at?: number;
  spread?: number;
  len?: number;
  thickness?: number;
}> = ({ w, h, color = "#fff", at = 0, spread = 40, len = 34, thickness = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 180 } });
  const gx = w / 2 + spread * p;
  const gy = h / 2;
  const dash = (x: number, y: number, key: string) => (
    <div key={key} style={{ position: "absolute", left: x - len / 2, top: y - thickness / 2, width: len, height: thickness, borderRadius: thickness, background: color }} />
  );
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, opacity: Math.min(1, p * 2) }}>
      {dash(-gx, -gy, "tl")}
      {dash(gx, -gy, "tr")}
      {dash(-gx, gy, "bl")}
      {dash(gx, gy, "br")}
    </div>
  );
};
