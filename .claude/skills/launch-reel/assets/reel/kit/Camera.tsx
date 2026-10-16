import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/** A camera keyframe: at `frame`, centre the content point (x, y) at `zoom`. Content px. */
export type CameraKey = { frame: number; zoom: number; x: number; y: number };

const ease = { easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const cameraAt = (frame: number, keys: CameraKey[]) => {
  if (keys.length === 1) return keys[0];
  const f = keys.map((k) => k.frame);
  return {
    frame,
    zoom: interpolate(frame, f, keys.map((k) => k.zoom), ease),
    x: interpolate(frame, f, keys.map((k) => k.x), ease),
    y: interpolate(frame, f, keys.map((k) => k.y), ease),
  };
};

/**
 * Pans and zooms over large content (a full-page screenshot, a recreated screen) inside a fixed
 * viewport. `viewport` and `content` are in content px; `scale` maps content px to video px.
 * The view is clamped so it never shows past the content edges.
 */
export const Camera: React.FC<{
  keys: CameraKey[];
  viewport: { w: number; h: number };
  content: { w: number; h: number };
  scale?: number;
  children: React.ReactNode;
}> = ({ keys, viewport, content, scale = 1, children }) => {
  const frame = useCurrentFrame();
  const { zoom, x, y } = cameraAt(frame, keys);
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const tx = clamp(viewport.w / 2 - x * zoom, viewport.w - content.w * zoom, 0);
  const ty = clamp(viewport.h / 2 - y * zoom, viewport.h - content.h * zoom, 0);
  return (
    <div style={{ width: viewport.w * scale, height: viewport.h * scale, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          width: content.w,
          height: content.h,
          transformOrigin: "0 0",
          transform: `scale(${scale}) translate(${tx}px, ${ty}px) scale(${zoom})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
