import React from "react";
import { AbsoluteFill } from "remotion";
import { Material, type MaterialName, Scaled } from "../kit";

const NAMES: MaterialName[] = ["agate", "ocean", "dunes", "canopy", "sky", "dusk"];

// Dev-only contact sheet of the montage materials.
export const MaterialTest: React.FC = () => (
  <AbsoluteFill style={{ flexDirection: "row", flexWrap: "wrap", background: "#000" }}>
    {NAMES.map((n) => (
      <Scaled key={n} w={1920} h={1080} scale={1 / 3}>
        <Material name={n} />
        <div style={{ position: "absolute", left: 30, top: 30, color: "#ff0", font: "60px monospace" }}>{n}</div>
      </Scaled>
    ))}
  </AbsoluteFill>
);
