import React from "react";
import { Img } from "remotion";

/** An official model/lab mark, centred on (x, y), laid over a chart's SVG (Img waits for the file to load). */
export const Logo: React.FC<{ src: string; x: number; y: number; size: number; opacity?: number }> = ({ src, x, y, size, opacity = 1 }) => (
  <Img src={src} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity, objectFit: "contain" }} />
);
