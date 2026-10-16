import React from "react";

/** Renders children at native CSS size `w`×`h`, scaled by `scale` (for crisp, readable UI ports). */
export const Scaled: React.FC<{ w: number; h: number; scale: number; children: React.ReactNode }> = ({ w, h, scale, children }) => (
  <div style={{ width: w * scale, height: h * scale, position: "relative", overflow: "hidden" }}>
    <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute" }}>{children}</div>
  </div>
);
