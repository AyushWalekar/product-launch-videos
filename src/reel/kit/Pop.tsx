import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, type SfxName } from "./Sfx";

/** Springy pop-in (slight overshoot) at `at`, optional pop-out at `outAt`, with its own sound. */
export const Pop: React.FC<{
  at: number;
  outAt?: number;
  sound?: SfxName | null;
  volume?: number;
  from?: number;
  origin?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, outAt, sound = "pop1", volume = 0.7, from = 0.6, origin = "center", children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
  const out = outAt === undefined ? 0 : spring({ frame: frame - outAt, fps, config: { damping: 200 }, durationInFrames: 8 });
  const scale = (from + (1 - from) * p) * (1 - out * 0.4);
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: origin,
        opacity: Math.min(1, p * 3) * (1 - out),
        ...style,
      }}
    >
      {sound && <Sfx name={sound} at={at} volume={volume} />}
      {children}
    </div>
  );
};
