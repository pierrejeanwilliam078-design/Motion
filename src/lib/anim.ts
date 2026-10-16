import {Easing, interpolate, spring, SpringConfig, useCurrentFrame, useVideoConfig} from 'remotion';

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/** Interpolation bornée entre t0 et t1 (secondes). */
export const tw = (
  t: number,
  t0: number,
  t1: number,
  from: number,
  to: number,
  easing: (n: number) => number = EASE_OUT,
) =>
  interpolate(t, [t0, t1], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Ressort qui démarre à `start` (secondes). */
export const sp = (
  t: number,
  start: number,
  fps: number,
  config: Partial<SpringConfig> = {damping: 14, mass: 0.8, stiffness: 140},
) => spring({frame: Math.max(0, (t - start) * fps), fps, config});

/**
 * Temps absolu (secondes sur la timeline finale) à l'intérieur d'une scène
 * placée dans une <Sequence from={sceneStart}>.
 */
export const useSceneTime = (sceneStart: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: frame / fps + sceneStart, fps, frame};
};

/** Pseudo-aléatoire déterministe (rendu identique image par image). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
