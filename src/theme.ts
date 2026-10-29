import { Easing, interpolate } from "remotion";
import timeline from "./data/timeline.json";

export const C = {
  bg: "#0E171F",
  bg2: "#172833",
  bgDeep: "#0A1219",
  teal: "#2DC6BE",
  /** Turquoise exact de l'interface (boutons, barre de progression). */
  tealUi: "#35C9BD",
  white: "#F8FAFC",
  muted: "#94A9B8",
  line: "rgba(148, 169, 184, 0.16)",
  card: "#172833",
} as const;

export const FONT = {
  sans: '"Inter Variable", Inter, Manrope, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
} as const;

export const FPS = timeline.fps;
export const DURATION = timeline.durationInFrames;

/** Secondes → frames. */
export const sec = (s: number) => Math.round(s * FPS);

/** Bornes d'une scène (en frames absolues) à partir de son id. */
export const sceneFrames = (id: string) => {
  const s = timeline.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Scène inconnue : ${id}`);
  return { from: sec(s.start), to: sec(s.end), duration: sec(s.end) - sec(s.start) };
};

/** Instant de la voix off (secondes dans le fichier) → frame absolue de la vidéo. */
export const vo = (s: number) => sec(s + timeline.voiceover.offsetSeconds);

export const EASE = {
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
} as const;

/** Interpolation bornée avec easing (raccourci). */
export const tween = (
  frame: number,
  from: number,
  to: number,
  out: [number, number] = [0, 1],
  easing: (t: number) => number = EASE.out,
) =>
  interpolate(frame, [from, to], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Interpolation multi-clés bornée, easing appliqué à chaque segment. */
export const keys = (
  frame: number,
  frames: number[],
  values: number[],
  easing: (t: number) => number = EASE.inOut,
) =>
  interpolate(frame, frames, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Bruit pseudo-aléatoire déterministe (stable d'un rendu à l'autre). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
