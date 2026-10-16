import React, { useId } from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type MaterialName = "agate" | "ocean" | "dunes" | "canopy" | "sky" | "dusk";

/**
 * Full-bleed, photographic-looking procedural textures for montage shots (no stock photos needed).
 * Pass `src` to use a real photo instead. Slow push-in, grain and vignette are applied either way.
 */
export const Material: React.FC<{
  name: MaterialName;
  src?: string;
  duration?: number;
  dim?: number;
}> = ({ name, src, duration = 15, dim = 0 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const zoom = interpolate(frame, [0, duration], [1.08, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const drift = interpolate(frame, [0, duration], [0, -18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const scene = src ? (
    <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        {/* agate: concentric bands warped by turbulence */}
        <radialGradient id={`${id}rings`} cx="38%" cy="58%" r="9%" spreadMethod="repeat" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#f6efe6" />
          <stop offset="0.18" stopColor="#d9b48a" />
          <stop offset="0.32" stopColor="#b8642a" />
          <stop offset="0.46" stopColor="#efe2cf" />
          <stop offset="0.62" stopColor="#c98a52" />
          <stop offset="0.8" stopColor="#f7f1ea" />
          <stop offset="1" stopColor="#f6efe6" />
        </radialGradient>
        <filter id={`${id}warp`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.005" numOctaves={4} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={260} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* relief lighting used by dunes / canopy / ocean */}
        <filter id={`${id}dunes`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.0055" numOctaves={4} seed={11} result="n" />
          <feDiffuseLighting in="n" surfaceScale={42} lightingColor="#ffd9a8" diffuseConstant={1.15}>
            <feDistantLight azimuth={215} elevation={22} />
          </feDiffuseLighting>
        </filter>
        <filter id={`${id}canopy`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves={6} seed={3} result="n" />
          <feDiffuseLighting in="n" surfaceScale={26} lightingColor="#e8ffd0" diffuseConstant={1.25}>
            <feDistantLight azimuth={45} elevation={30} />
          </feDiffuseLighting>
        </filter>
        <filter id={`${id}ocean`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.018" numOctaves={4} seed={21} result="n" />
          <feDiffuseLighting in="n" surfaceScale={14} lightingColor="#bfe9ff" diffuseConstant={1.1}>
            <feDistantLight azimuth={270} elevation={35} />
          </feDiffuseLighting>
        </filter>
        <filter id={`${id}clouds`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0028 0.006" numOctaves={5} seed={5} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.6 0 0 0 -0.62" />
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
        <filter id={`${id}grass`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.004" numOctaves={3} seed={9} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.04  0 0 0 0 0.03  2.2 0 0 0 -0.9" />
        </filter>
        <radialGradient id={`${id}leak`} cx="78%" cy="12%" r="55%">
          <stop offset="0" stopColor="#fff6c8" stopOpacity={0.85} />
          <stop offset="1" stopColor="#fff6c8" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c6fd6" />
          <stop offset="0.6" stopColor="#7fb2ee" />
          <stop offset="1" stopColor="#dbe9f7" />
        </linearGradient>
        <linearGradient id={`${id}horizon`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#0b0806" stopOpacity={0} />
          <stop offset="0.8" stopColor="#0b0806" stopOpacity={0.75} />
          <stop offset="1" stopColor="#0b0806" stopOpacity={0.95} />
        </linearGradient>
        <linearGradient id={`${id}dusk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24324f" />
          <stop offset="0.45" stopColor="#6f6a7a" />
          <stop offset="0.72" stopColor="#d79a62" />
          <stop offset="1" stopColor="#3a2a1c" />
        </linearGradient>
      </defs>

      {name === "agate" && (
        <g filter={`url(#${id}warp)`}>
          <rect x={-100} y={-100} width={W + 200} height={H + 200} fill={`url(#${id}rings)`} />
        </g>
      )}
      {name === "dunes" && (
        <>
          <rect width={W} height={H} filter={`url(#${id}dunes)`} />
          <rect width={W} height={H} fill="#c8722e" style={{ mixBlendMode: "multiply" }} />
        </>
      )}
      {name === "canopy" && (
        <>
          <rect width={W} height={H} filter={`url(#${id}canopy)`} />
          <rect width={W} height={H} fill="#2d7a3a" style={{ mixBlendMode: "multiply" }} />
          <rect width={W} height={H} fill={`url(#${id}leak)`} style={{ mixBlendMode: "screen" }} />
        </>
      )}
      {name === "ocean" && (
        <>
          <rect width={W} height={H} filter={`url(#${id}ocean)`} />
          <rect width={W} height={H} fill="#0d4f73" style={{ mixBlendMode: "multiply" }} />
        </>
      )}
      {name === "sky" && (
        <>
          <rect width={W} height={H} fill={`url(#${id}sky)`} />
          <rect width={W} height={H} filter={`url(#${id}clouds)`} />
        </>
      )}
      {name === "dusk" && (
        <>
          <rect width={W} height={H} fill={`url(#${id}dusk)`} />
          <rect width={W} height={H} filter={`url(#${id}clouds)`} opacity={0.5} />
          <rect width={W} height={H} fill="#e7a15e" style={{ mixBlendMode: "soft-light" }} />
          <rect width={W} height={H} fill={`url(#${id}horizon)`} />
        </>
      )}
    </svg>
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${drift}px)` }}>{scene}</AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.45) 100%)" }} />
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />}
      <svg width={W} height={H} style={{ position: "absolute", opacity: 0.12, mixBlendMode: "overlay" }}>
        <filter id={`${id}grain`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={Math.floor(frame / 2)} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id}grain)`} />
      </svg>
    </AbsoluteFill>
  );
};
