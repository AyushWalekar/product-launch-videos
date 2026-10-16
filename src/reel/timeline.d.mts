export declare const FPS: number;
export declare const BPM: number;
export declare const BEAT: number;
export declare const PAN: number;
export declare const SHOT: number;
export declare const ASSEMBLE: number;
export type TimelineScene = { id: string; from: number; duration: number; transition: "cut" | "pan" };
export declare function timeline(config: {
  montage: unknown[];
  beats: { id: string; seconds?: number }[];
  end?: { seconds?: number };
}): {
  scenes: TimelineScene[];
  total: number;
  drop: number;
  transitions: number[];
  stinger: number;
  ramp: [number, number][];
  montage: number;
  headline: number;
};
