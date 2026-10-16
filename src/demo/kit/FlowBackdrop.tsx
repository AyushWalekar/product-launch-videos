import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type BackdropPalette = {
  base: string;
  blobs: string[];
};

/**
 * Slowly flowing, liquid colour field with film grain and a vignette.
 * Render it once beneath all scenes so it stays continuous across cuts.
 */
export const FlowBackdrop: React.FC<{
  palette: BackdropPalette;
  grain?: number;
  speed?: number;
}> = ({ palette, grain = 0.1, speed = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = (frame / fps) * speed;

  const blobs = palette.blobs.map((color, i) => {
    const phase = i * 1.7;
    const x = width * (0.5 + 0.34 * Math.sin(t * 0.21 + phase));
    const y = height * (0.5 + 0.32 * Math.cos(t * 0.17 + phase * 1.3));
    const size = width * (0.5 + 0.12 * Math.sin(t * 0.29 + i));
    return `radial-gradient(circle ${size / 2}px at ${x}px ${y}px, ${color} 0%, transparent 70%)`;
  });

  // Turbulence drift drives the liquid warping; deterministic per frame.
  const freq = 0.0016 + 0.0004 * Math.sin(t * 0.3);

  return (
    <AbsoluteFill style={{ backgroundColor: palette.base, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="flow-liquid" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={260} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="flow-grain">
          <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={3} seed={Math.floor(frame / 2)} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          inset: -200,
          background: blobs.join(", "),
          filter: "url(#flow-liquid) blur(60px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <svg width={width} height={height} style={{ position: "absolute", opacity: grain, mixBlendMode: "overlay" }}>
        <rect width="100%" height="100%" filter="url(#flow-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
