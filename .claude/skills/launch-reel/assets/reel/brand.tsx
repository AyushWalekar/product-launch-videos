// Brand-driven surfaces for the launch reel: a product-site hero background (fading grid + slow
// halo), full-bleed colour fields for the montage, the logo lockup, pill tag, CTA and gradient text.
// Everything reads the brand from reel.json, so the look follows each product's own site.
import React from "react";
import { ArrowRight } from "lucide-react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ReelConfig } from "./types";

type Brand = ReelConfig["brand"];

export const gradientText = (b: Brand): React.CSSProperties => ({
  backgroundImage: `linear-gradient(110deg, ${b.gradient[0]}, ${b.gradient[1]}, ${b.gradient[0]})`,
  backgroundSize: "200% 100%",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  paddingBottom: "0.08em",
});

const alpha = (color: string, a: number) => `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;

/** Hero background: page colour, 56px grid in the primary colour fading from the centre, slow halo. */
export const HeroBackdrop: React.FC<{ brand: Brand; gridCenterY?: string }> = ({ brand, gridCenterY = "35%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ang = 221 + (frame / fps) * 14;
  const mask = `radial-gradient(80% 60% at 50% ${gridCenterY}, #000 30%, transparent 75%)`;
  return (
    <AbsoluteFill style={{ background: brand.background ?? "#ffffff", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "5%",
          width: "80%",
          height: "90%",
          borderRadius: "50%",
          background: `conic-gradient(from ${ang}deg at 50% 50%, ${brand.primary}, transparent 25%, ${brand.accent} 50%, transparent 75%, ${brand.primary})`,
          filter: "blur(120px)",
          opacity: 0.14,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(90deg, ${alpha(brand.primary, 0.07)} 1px, transparent 1px), linear-gradient(${alpha(brand.primary, 0.07)} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          backgroundPosition: "center center",
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
    </AbsoluteFill>
  );
};

/** Full-bleed colour field for montage cuts: gradient, white grid, moving halo, slow push-in. */
export const ColorField: React.FC<{ from: string; to: string; accent: string; duration: number }> = ({ from, to, accent, duration }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, duration], [1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mask = "radial-gradient(80% 70% at 50% 50%, #000 35%, transparent 85%)";
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <div
          style={{
            position: "absolute",
            left: "5%",
            top: 0,
            width: "90%",
            height: "100%",
            borderRadius: "50%",
            background: `conic-gradient(from ${200 + frame * 3}deg at 50% 50%, rgba(255,255,255,0.55), transparent 30%, ${accent} 55%, transparent 80%, rgba(255,255,255,0.55))`,
            filter: "blur(120px)",
            opacity: 0.35,
          }}
        />
        <AbsoluteFill
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            backgroundPosition: "center center",
            WebkitMaskImage: mask,
            maskImage: mask,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Logo (or name) + optional "/ wordmark", as most product headers show it. */
export const Lockup: React.FC<{ config: ReelConfig; height: number }> = ({ config, height }) => {
  const b = config.brand;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: height * 0.28, fontFamily: b.font }}>
      {b.logo ? (
        <Img src={staticFile(`${config.assets}/${b.logo}`)} style={{ height, width: height * (b.logoRatio ?? 3) }} />
      ) : (
        <span style={{ fontSize: height * 0.8, fontWeight: 700, letterSpacing: "-0.03em", color: b.ink }}>{b.name}</span>
      )}
      {b.wordmark && (
        <>
          <span style={{ fontSize: height * 0.62, fontWeight: 500, color: alpha(b.ink, 0.35), transform: `translateY(${-height * 0.04}px)` }}>/</span>
          <span style={{ fontSize: height * 0.66, fontWeight: 700, letterSpacing: "-0.03em", color: b.gradient[0], transform: `translateY(${-height * 0.03}px)` }}>
            {b.wordmark}
          </span>
        </>
      )}
    </div>
  );
};

export const Pill: React.FC<{ brand: Brand; children: React.ReactNode; scale?: number }> = ({ brand, children, scale = 1 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10 * scale,
      padding: `${7 * scale}px ${16 * scale}px`,
      borderRadius: 999,
      border: `1px solid ${alpha(brand.gradient[0], 0.25)}`,
      background: "rgba(255,255,255,0.7)",
      boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
      fontFamily: brand.font,
      fontSize: 18 * scale,
      fontWeight: 500,
      color: brand.muted,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 8 * scale, height: 8 * scale, borderRadius: 99, background: brand.gradient[0] }} />
    {children}
  </div>
);

export const CtaButton: React.FC<{ brand: Brand; label: string; scale?: number }> = ({ brand, label, scale = 1 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10 * scale,
      padding: `${14 * scale}px ${26 * scale}px`,
      borderRadius: 10 * scale,
      background: brand.primary,
      color: "#fff",
      fontFamily: brand.font,
      fontSize: 22 * scale,
      fontWeight: 500,
      boxShadow: `0 10px 24px -8px ${alpha(brand.primary, 0.6)}`,
      whiteSpace: "nowrap",
    }}
  >
    {label} <ArrowRight size={20 * scale} />
  </div>
);
