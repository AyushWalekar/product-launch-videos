import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

/** Panel on a slight 3D turn that slowly squares up while pushing in (launch-reel product shot). */
export const Tilt: React.FC<{ children: React.ReactNode; duration: number; from?: number; to?: number; push?: number; shadow?: string }> = ({
  children,
  duration,
  from = -13,
  to = -5,
  push = 0.05,
  shadow = "drop-shadow(0 40px 60px rgba(0,0,0,0.28))",
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 2) });
  return (
    <div style={{ perspective: 2000 }}>
      <div
        style={{
          transform: `rotateY(${from + (to - from) * p}deg) rotateX(${3 - 2 * p}deg) scale(${1 + push * p})`,
          transformOrigin: "30% 50%",
          filter: shadow,
        }}
      >
        {children}
      </div>
    </div>
  );
};
