import React from "react";
import { WordReveal } from "./WordReveal";

/** Several headline lines revealed word by word in sequence (each line starts when the previous ends). */
export const HeadlineLines: React.FC<{
  lines: string[];
  at: number;
  size: number;
  fontFamily: string;
  every?: number;
  color?: string;
  weight?: number;
  sound?: boolean;
}> = ({ lines, at, size, fontFamily, every = 4, color = "#111113", weight = 600, sound = true }) => {
  let t = at;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: size * 0.08 }}>
      {lines.map((l, i) => {
        const start = t;
        t += l.split(" ").length * every + 2;
        return (
          <WordReveal
            key={i}
            text={l}
            at={start}
            every={every}
            fontFamily={fontFamily}
            fontSize={size}
            fontWeight={weight}
            letterSpacing={-0.035}
            color={color}
            sound={sound ? "pop2" : null}
          />
        );
      })}
    </div>
  );
};
