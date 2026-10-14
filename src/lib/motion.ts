import {Easing} from 'remotion';

/** Courbes de Bézier personnalisées (langage de mouvement GSN). */
export const EASE = {
  /** sortie expo : arrivées nettes, longue décélération */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** entrée expo : accélérations franches */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  /** in-out quint : transitions de caméra */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** in-out très tendu : masques, morphs */
  snap: Easing.bezier(0.85, 0, 0.15, 1),
  /** dépassement contrôlé */
  overshoot: Easing.bezier(0.34, 1.45, 0.64, 1),
  /** doux */
  soft: Easing.bezier(0.45, 0, 0.55, 1),
  /** anticipation (léger recul avant départ) */
  anticipate: Easing.bezier(0.6, -0.28, 0.74, 0.05),
  linear: (t: number) => t,
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progression 0→1 entre deux frames, avec courbe. */
export const prog = (f: number, start: number, end: number, ease: (t: number) => number = EASE.inOut) =>
  ease(clamp01((f - start) / (end - start)));

/** Vitesse instantanée (dérivée numérique) d'une progression, en unités/frame. */
export const velocity = (fn: (f: number) => number, f: number) => fn(f + 0.5) - fn(f - 0.5);

/** Interpolation multi-clés avec courbe par segment. */
export const keys = (
  f: number,
  frames: number[],
  values: number[],
  ease: (t: number) => number = EASE.inOut,
) => {
  if (f <= frames[0]) return values[0];
  for (let i = 0; i < frames.length - 1; i++) {
    if (f <= frames[i + 1]) {
      return lerp(values[i], values[i + 1], ease((f - frames[i]) / (frames[i + 1] - frames[i])));
    }
  }
  return values[values.length - 1];
};

/** Bruit déterministe (pseudo-aléatoire stable par graine). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Polygone (liste de points) -> clip-path CSS. */
export const polygonClip = (pts: [number, number][], unit = 'px') =>
  `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}${unit} ${y.toFixed(2)}${unit}`).join(', ')})`;

/** Hexagone (pointe en haut) de centre (cx, cy) et rayon r, rotation en degrés. */
export const hexPoints = (cx: number, cy: number, r: number, rot = 0): [number, number][] =>
  Array.from({length: 6}, (_, i) => {
    const a = ((60 * i - 90 + rot) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });

/** Rectangle exprimé en 6 points (compatible morph avec l'hexagone). */
export const rect6 = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x + w / 2, y],
  [x + w, y],
  [x + w, y + h],
  [x + w / 2, y + h],
  [x, y + h],
  [x, y],
];

export const morphPts = (a: [number, number][], b: [number, number][], t: number) =>
  a.map(([x, y], i) => [lerp(x, b[i][0], t), lerp(y, b[i][1], t)] as [number, number]);
