import React from "react";
import { Composition, Folder } from "remotion";
import { MaterialTest } from "./dev/MaterialTest";

// Generic compositions only. Register product reels (from the launch-reel skill) in a
// git-ignored LocalRoot.tsx + local.ts entry, or in your own Root:
//   const reel = makeReel(cfg as unknown as ReelConfig);   // import { makeReel } from "../reel"
//   <Composition id="MyProductReel" component={reel.Reel} durationInFrames={reel.durationInFrames} fps={30} width={1920} height={1080} />
export const DemoRoot: React.FC = () => (
  <Folder name="Dev">
    <Composition id="MaterialTest" component={MaterialTest} durationInFrames={15} fps={30} width={1920} height={1080} />
  </Folder>
);
