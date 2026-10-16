import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Frosted pill caption that floats over product footage. */
export const GlassCaption: React.FC<{
  children: React.ReactNode;
  delay?: number;
  fontFamily: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, fontFamily, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 22 });
  return (
    <div
      style={{
        padding: "18px 34px",
        borderRadius: 999,
        background: "rgba(14,14,30,0.55)",
        backdropFilter: "blur(18px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        color: "#fff",
        fontFamily,
        fontSize: 34,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px) scale(${0.96 + p * 0.04})`,
        filter: `blur(${(1 - p) * 8}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
