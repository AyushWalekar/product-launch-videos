import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/** Bright off-white studio canvas: soft centre light, faint grid, vignette and grain. */
export const PaperBackdrop: React.FC<{ base?: string; grid?: number; gridOpacity?: number }> = ({
  base = "#efefed",
  grid = 56,
  gridOpacity = 0.045,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 50% 48%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)" }} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,${gridOpacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,${gridOpacity}) 1px, transparent 1px)`,
          backgroundSize: `${grid}px ${grid}px`,
          backgroundPosition: "center center",
          WebkitMaskImage: "radial-gradient(ellipse 55% 50% at 50% 50%, black, transparent 85%)",
          maskImage: "radial-gradient(ellipse 55% 50% at 50% 50%, black, transparent 85%)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.07) 100%)" }} />
      <svg width={width} height={height} style={{ position: "absolute", opacity: 0.05, mixBlendMode: "multiply" }}>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={Math.floor(frame / 2)} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
