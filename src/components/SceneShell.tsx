import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE, tween } from "../theme";

/** Durée (frames) du chevauchement entre deux scènes. */
export const OVERLAP = 12;

/**
 * Enveloppe commune : entrée (zoom + mise au point) et sortie (recul + flou)
 * pendant le chevauchement avec la scène suivante.
 */
export const SceneShell: React.FC<{
  duration: number;
  enter?: "zoom" | "rise" | "none";
  exit?: "recede" | "zoomThrough" | "none";
  children: React.ReactNode;
}> = ({ duration, enter = "zoom", exit = "recede", children }) => {
  const frame = useCurrentFrame();
  const e = enter === "none" ? 1 : tween(frame, 0, OVERLAP, [0, 1], EASE.out);
  const x = exit === "none" ? 0 : tween(frame, duration - 2, duration + OVERLAP - 2, [0, 1], EASE.in);

  let scale = 1;
  let ty = 0;
  if (enter === "zoom") scale *= 1.06 - 0.06 * e;
  if (enter === "rise") ty += (1 - e) * 50;
  if (exit === "recede") scale *= 1 - 0.05 * x;
  if (exit === "zoomThrough") scale *= 1 + 0.6 * x;

  const blur = (1 - e) * 10 + x * 10;
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(e, 1 - x),
        transform: `translateY(${ty}px) scale(${scale})`,
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
