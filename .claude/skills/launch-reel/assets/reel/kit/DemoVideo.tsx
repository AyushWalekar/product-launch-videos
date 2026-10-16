import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { slide } from "@remotion/transitions/slide";
import {
  linearTiming,
  TransitionPresentation,
  TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";

export type Scene = {
  id: string;
  durationInFrames: number;
  component: React.FC;
  /**
   * How this scene comes in: "blur" (soft zoom dissolve, default), "pan" (camera slides across one
   * canvas, the previous scene leaves left) or "cut" (hard cut, no overlap).
   */
  transition?: "blur" | "pan" | "cut";
  transitionFrames?: number;
};

const overlapOf = (s: Scene, fallback: number) => (s.transition === "cut" ? 0 : (s.transitionFrames ?? fallback));

type NoProps = Record<string, never>;

const BlurZoom: React.FC<TransitionPresentationComponentProps<NoProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const entering = presentationDirection === "entering";
  const opacity = entering ? p : 1 - p;
  const scale = entering ? interpolate(p, [0, 1], [1.05, 1]) : interpolate(p, [0, 1], [1, 0.97]);
  const blur = (entering ? 1 - p : p) * 18;
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

/** Soft cross-dissolve with a slight zoom and blur; reads well over a shared backdrop. */
export const blurZoom = (): TransitionPresentation<NoProps> => ({ component: BlurZoom, props: {} });

export const totalDuration = (scenes: Scene[], transitionFrames: number) =>
  scenes.reduce((sum, s, i) => sum + s.durationInFrames - (i ? overlapOf(s, transitionFrames) : 0), 0);

/** Local start frame of each scene in the full video (handy for cue sheets). */
export const sceneStarts = (scenes: Scene[], transitionFrames: number) => {
  let at = 0;
  return scenes.map((s, i) => {
    if (i) at -= overlapOf(s, transitionFrames);
    const start = at;
    at += s.durationInFrames;
    return start;
  });
};

/**
 * Plays `scenes` back to back over one continuous `backdrop`, joined by blur-zoom dissolves.
 */
export const DemoVideo: React.FC<{
  scenes: Scene[];
  transitionFrames: number;
  backdrop: React.ReactNode;
  overlay?: React.ReactNode;
  fontFamily: string;
}> = ({ scenes, transitionFrames, backdrop, overlay, fontFamily }) => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {backdrop}
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const Comp = scene.component;
          const seq = (
            <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.durationInFrames} name={scene.id}>
              <Comp />
            </TransitionSeries.Sequence>
          );
          if (i === 0 || scene.transition === "cut") return [seq];
          const frames = overlapOf(scene, transitionFrames);
          return [
            scene.transition === "pan" ? (
              <TransitionSeries.Transition
                key={`${scene.id}-in`}
                presentation={slide({ direction: "from-right" })}
                timing={linearTiming({ durationInFrames: frames, easing: Easing.bezier(0.76, 0, 0.24, 1) })}
              />
            ) : (
              <TransitionSeries.Transition
                key={`${scene.id}-in`}
                presentation={blurZoom()}
                timing={linearTiming({ durationInFrames: frames })}
              />
            ),
            seq,
          ];
        })}
      </TransitionSeries>
      {overlay}
    </AbsoluteFill>
  );
};
