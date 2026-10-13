import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../lib/theme";

/** Mask-based scene entrances. Each scene uses a different one. */
export type TransitionKind =
  | { type: "iris"; progress: number; x?: number; y?: number; ring?: string } // circle from a point
  | { type: "wipeUp"; progress: number; curve?: number } // vertical, curved edge
  | { type: "wipeLeft"; progress: number } // horizontal whip
  | { type: "rect"; progress: number; from: { x: number; y: number; w: number; h: number; r: number } } // card -> fullscreen
  | { type: "diagonal"; progress: number };

const DIAG = Math.hypot(1080, 1920);

export const BeatTransition: React.FC<{ t: TransitionKind; children: React.ReactNode; zIndex?: number }> = ({
  t,
  children,
  zIndex,
}) => {
  const p = Math.max(0, Math.min(1, t.progress));
  if (p <= 0) return null;
  if (p >= 1) return <AbsoluteFill style={{ zIndex }}>{children}</AbsoluteFill>;

  let clipPath = "none";
  let ring: React.ReactNode = null;
  switch (t.type) {
    case "iris": {
      const x = t.x ?? 540;
      const y = t.y ?? 960;
      const r = p * DIAG;
      clipPath = `circle(${r}px at ${x}px ${y}px)`;
      ring = (
        <div
          style={{
            position: "absolute",
            left: x - r,
            top: y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            boxShadow: `0 0 0 6px ${t.ring ?? C.cyan}, 0 0 80px 20px ${t.ring ?? C.cyan}`,
            opacity: 1 - p,
          }}
        />
      );
      break;
    }
    case "wipeUp": {
      const top = (1 - p) * 2200 - 140;
      const c = t.curve ?? 160;
      clipPath = `path('M 0 ${top + c} Q 540 ${top - c} 1080 ${top + c} L 1080 2000 L 0 2000 Z')`;
      break;
    }
    case "wipeLeft": {
      clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`;
      break;
    }
    case "diagonal": {
      // a slanted edge sweeping left -> right
      const k = p * 2200;
      clipPath = `polygon(0 0, ${k}px 0, ${k - 1100}px 1920px, 0 1920px)`;
      break;
    }
    case "rect": {
      const f = t.from;
      const l = f.x * (1 - p);
      const tp = f.y * (1 - p);
      const right = (1080 - f.x - f.w) * (1 - p);
      const bottom = (1920 - f.y - f.h) * (1 - p);
      clipPath = `inset(${tp}px ${right}px ${bottom}px ${l}px round ${f.r * (1 - p)}px)`;
      break;
    }
  }
  return (
    <AbsoluteFill style={{ zIndex }}>
      <AbsoluteFill style={{ clipPath, WebkitClipPath: clipPath }}>{children}</AbsoluteFill>
      {ring}
    </AbsoluteFill>
  );
};
