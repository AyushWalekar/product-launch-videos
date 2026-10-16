import React from "react";
import { measureText } from "@remotion/layout-utils";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, type SfxName } from "./Sfx";

/**
 * One-line headline that snaps in word by word (every `every` frames from `at`), optionally framed by
 * design-tool selection handles that spring outward to fit the text as it grows. With `scatter`,
 * the handles first fly in from random spots on screen.
 */
export const WordReveal: React.FC<{
  text: string;
  at: number;
  every?: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  letterSpacing?: number;
  color?: string;
  handles?: boolean;
  handleColor?: string;
  scatter?: boolean;
  sound?: SfxName | null;
  volume?: number;
  align?: "left" | "center";
  style?: React.CSSProperties;
  /** Per-word style, e.g. gradient text on the last words (background-clip: text). */
  wordStyle?: (index: number) => React.CSSProperties | undefined;
}> = ({
  text,
  at,
  every = 4,
  fontFamily,
  fontSize,
  fontWeight = 600,
  letterSpacing = -0.03,
  color = "#111",
  handles = false,
  handleColor = "#1677ff",
  scatter = false,
  sound = "pop2",
  volume = 0.6,
  align = "left",
  style,
  wordStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: vw, height: vh } = useVideoConfig();
  const words = text.split(" ");
  const font = { fontFamily, fontSize, fontWeight, letterSpacing: `${letterSpacing}em` };
  const widths = words.map((_, i) => measureText({ ...font, text: words.slice(0, i + 1).join(" "), validateFontIsLoaded: false }).width);
  const shown = Math.max(0, Math.min(words.length, Math.floor((frame - at) / every) + 1));

  // Box width springs from the previous prefix width to the current one.
  let boxW = 0;
  for (let i = 0; i < shown; i++) {
    const p = spring({ frame: frame - (at + i * every), fps, config: { damping: 16, stiffness: 260 } });
    boxW += (widths[i] - (i ? widths[i - 1] : 0)) * p;
  }
  if (shown === 0) boxW = widths[0] * 0.3;
  const pad = fontSize * 0.28;
  const h = fontSize * 1.2;
  const fullW = widths[widths.length - 1];
  const left0 = align === "center" ? -boxW / 2 : 0;

  const corners = [
    [left0 - pad, -pad],
    [left0 + boxW + pad, -pad],
    [left0 - pad, h + pad],
    [left0 + boxW + pad, h + pad],
  ];
  const fly = scatter ? spring({ frame: frame - (at - 10), fps, config: { damping: 15, stiffness: 120 } }) : 1;
  const scatterFrom = [
    [-vw * 0.32, -vh * 0.3],
    [vw * 0.38, -vh * 0.22],
    [-vw * 0.36, vh * 0.28],
    [vw * 0.3, vh * 0.33],
  ];
  const handlesIn = interpolate(frame, [at - 12, at - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", width: align === "center" ? 0 : fullW, height: h, ...style }}>
      {sound && words.map((_, i) => <Sfx key={i} name={sound} at={at + i * every} volume={volume} />)}
      <div
        style={{
          position: "absolute",
          left: align === "center" ? -boxW / 2 : 0,
          top: 0,
          whiteSpace: "pre",
          ...font,
          lineHeight: `${h}px`,
          color,
        }}
      >
        {words.slice(0, shown).map((w, i) => {
          const p = spring({ frame: frame - (at + i * every), fps, config: { damping: 14, stiffness: 300 }, durationInFrames: 8 });
          return (
            <React.Fragment key={i}>
              <span style={{ display: "inline-block", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * fontSize * 0.12}px)`, ...wordStyle?.(i) }}>{w}</span>
              {i < words.length - 1 ? " " : ""}
            </React.Fragment>
          );
        })}
      </div>
      {handles &&
        corners.map(([x, y], i) => {
          const [sx, sy] = scatterFrom[i];
          const cx = scatter ? sx + (x - sx) * fly : x;
          const cy = scatter ? sy + (y - sy) * fly : y;
          const d = fontSize * 0.13;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx - d / 2,
                top: cy - d / 2,
                width: d,
                height: d,
                borderRadius: d,
                background: handleColor,
                opacity: handlesIn,
              }}
            />
          );
        })}
    </div>
  );
};
