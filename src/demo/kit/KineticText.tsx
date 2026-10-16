import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Text that rises out of a blur, word-by-word (or char-by-char).
 * Supports "\n" for line breaks. `exitAt` (local frame) fades it all out.
 */
export const KineticText: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  by?: "word" | "char";
  exitAt?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 4, by = "word", exitAt, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exit =
    exitAt === undefined ? 0 : spring({ frame: frame - exitAt, fps, config: { damping: 200 }, durationInFrames: 14 });

  let index = 0;
  return (
    <div style={{ ...style, opacity: 1 - exit, filter: exit ? `blur(${exit * 10}px)` : undefined }}>
      {text.split("\n").map((line, li) => (
        <div key={li} style={{ display: "block", whiteSpace: "pre-wrap" }}>
          {(by === "word" ? line.split(/(\s+)/) : line.split("")).map((token, ti) => {
            if (/^\s+$/.test(token)) return <span key={ti}>{token}</span>;
            const i = index++;
            const p = spring({
              frame: frame - delay - i * stagger,
              fps,
              config: { damping: 200, mass: 0.8 },
              durationInFrames: 26,
            });
            return (
              <span
                key={ti}
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 0.35}em)`,
                  filter: `blur(${(1 - p) * 14}px)`,
                }}
              >
                {token}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
