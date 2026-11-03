import React from "react";
import { Composition, Folder, type CalculateMetadataFunction } from "remotion";
import { StatBars, barsTiming, type StatBarsProps } from "./Bars";
import { StatLine, lineTiming, type StatLineProps } from "./Line";
import { StatReceipt, receiptTiming, type StatReceiptProps } from "./Receipt";
import { StatScatter, scatterTiming, type StatScatterProps } from "./Scatter";
import { ASPECTS } from "./theme";
import margin from "./examples/margin.json";
import split from "./examples/split.json";
import trend from "./examples/trend.json";
import frontier from "./examples/frontier.json";
import receipt from "./examples/receipt.json";

// Stat clips for X posts. Render with --props=<file.json>; duration and size follow the props.
// examples/*.json are real snapshots (Artificial Analysis and OpenCode, Nov 3 2026) and double as reference props.

const FPS = 30;

function meta<P extends { aspect: keyof typeof ASPECTS }>(timing: (p: P, fps: number) => { duration: number }): CalculateMetadataFunction<P> {
  return ({ props }) => ({ durationInFrames: timing(props, FPS).duration, ...ASPECTS[props.aspect] });
}

const base = { fps: FPS, durationInFrames: 300, ...ASPECTS.square };

export const StatRoot: React.FC = () => (
  <Folder name="Stat">
    <Composition id="StatBars" component={StatBars} {...base} defaultProps={margin as StatBarsProps} calculateMetadata={meta(barsTiming)} />
    <Composition id="StatSplit" component={StatBars} {...base} defaultProps={split as StatBarsProps} calculateMetadata={meta(barsTiming)} />
    <Composition id="StatLine" component={StatLine} {...base} defaultProps={trend as StatLineProps} calculateMetadata={meta(lineTiming)} />
    <Composition id="StatScatter" component={StatScatter} {...base} defaultProps={frontier as StatScatterProps} calculateMetadata={meta(scatterTiming)} />
    <Composition id="StatReceipt" component={StatReceipt} {...base} defaultProps={receipt as StatReceiptProps} calculateMetadata={meta(receiptTiming)} />
  </Folder>
);
