import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx } from "./Sfx";

/**
 * A dark keyboard key that pops in and is pressed on screen (with thock + release sounds).
 * `presses` are local frames; the key appears a few frames before the first press unless `appearAt` is set.
 */
export const Keycap: React.FC<{
  label: React.ReactNode;
  presses: number[];
  appearAt?: number;
  size?: number;
  width?: number;
  fontFamily: string;
  sound?: boolean;
}> = ({ label, presses, appearAt, size = 96, width, fontFamily, sound = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = appearAt ?? presses[0] - 6;
  const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 240, mass: 0.6 } });
  let down = 0;
  for (const t of presses) down = Math.max(down, interpolate(frame, [t - 1, t + 1, t + 6, t + 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const w = width ?? size;
  return (
    <div style={{ width: w, height: size, transform: `scale(${0.5 + p * 0.5})`, opacity: Math.min(1, p * 3) }}>
      {sound &&
        presses.map((t) => (
          <React.Fragment key={t}>
            <Sfx name="key-down" at={t} volume={0.75} />
            <Sfx name="key-up" at={t + 7} volume={0.55} />
          </React.Fragment>
        ))}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: size * 0.2,
          background: `linear-gradient(180deg, #3a3a3e 0%, #232326 ${55 - down * 10}%, #1b1b1d 100%)`,
          boxShadow: `0 ${10 - down * 7}px ${24 - down * 14}px rgba(0,0,0,${0.35 - down * 0.1}), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -${4 - down * 3}px 0 rgba(0,0,0,0.45)`,
          transform: `translateY(${down * 5}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f4f4f5",
          fontFamily,
          fontSize: size * 0.3,
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </div>
    </div>
  );
};
