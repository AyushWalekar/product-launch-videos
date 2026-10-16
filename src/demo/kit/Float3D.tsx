import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Lifts its children onto a slowly drifting 3D plane with a springy entrance.
 * `tilt` is the resting rotateX in degrees; `sway` the drift amplitude.
 */
export const Float3D: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tilt?: number;
  sway?: number;
  push?: number;
  /** Scene length in frames; drives the slow push-in. */
  duration?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, tilt = 6, sway = 2.5, push = 0.04, duration = 150, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.9 } });
  const t = frame / fps;
  const progress = Math.min(1, frame / duration);

  const rx = tilt * (1 - progress * 0.6) + (1 - enter) * 14 + Math.cos(t * 0.8) * sway * 0.4;
  const ry = Math.sin(t * 0.6) * sway;
  const scale = (0.92 + enter * 0.08) * (1 + progress * push);

  return (
    <div style={{ perspective: 2200, ...style }}>
      <div
        style={{
          transform: `translateY(${(1 - enter) * 120}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
          opacity: Math.min(1, enter * 1.4),
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
};
