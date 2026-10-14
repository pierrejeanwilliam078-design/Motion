import {MADAGASCAR} from '../data/madagascar';
import {EASE, clamp01, lerp, prog} from '../lib/motion';

/**
 * Caméra cartographique partagée (Scène 02 → Scène 03) :
 * zoom serré sur le trajet Antananarivo → Toamasina, puis recul jusqu'à l'île entière.
 */
export const T = MADAGASCAR.cities.antananarivo;
export const M = MADAGASCAR.cities.toamasina;

const ANCHOR: [number, number] = [960, 560];
const S0 = 4.2;
const C0: [number, number] = [(T[0] + M[0]) / 2, (T[1] + M[1]) / 2];
const S1 = 0.92;
// l'île (centre ≈ 253, 500) se place à droite de l'écran (1380, 540)
const C1: [number, number] = [253 - (1380 - ANCHOR[0]) / S1, 500 - (540 - ANCHOR[1]) / S1];

export const PULLBACK: [number, number] = [196, 238];

export const mapCam = (f: number) => {
  const t = prog(f, PULLBACK[0], PULLBACK[1], EASE.inOut);
  const s = Math.exp(lerp(Math.log(S0), Math.log(S1), t));
  // interpolation du centre proportionnelle à la largeur de vue : mouvement visuellement uniforme
  const u = clamp01((1 / s - 1 / S0) / (1 / S1 - 1 / S0));
  const drift = prog(f, PULLBACK[1], 320, EASE.soft);
  const s2 = s * (1 - 0.05 * drift);
  const cx = lerp(C0[0], C1[0], u) - 18 * drift;
  const cy = lerp(C0[1], C1[1], u);
  return {s: s2, cx, cy};
};

export const toScreen = (f: number, p: [number, number]): [number, number] => {
  const {s, cx, cy} = mapCam(f);
  return [ANCHOR[0] + (p[0] - cx) * s, ANCHOR[1] + (p[1] - cy) * s];
};

export const mapTransform = (f: number) => {
  const {s, cx, cy} = mapCam(f);
  return `translate(${(ANCHOR[0] - cx * s).toFixed(3)} ${(ANCHOR[1] - cy * s).toFixed(3)}) scale(${s.toFixed(5)})`;
};

/** Trajet (Bézier cubique en unités carte). */
export const ROUTE: [number, number][] = [T, [T[0] + 28, T[1] - 52], [M[0] - 52, M[1] - 34], M];

export const bezier = (pts: [number, number][], t: number): [number, number] => {
  const [a, b, c, d] = pts;
  const mt = 1 - t;
  return [
    mt ** 3 * a[0] + 3 * mt * mt * t * b[0] + 3 * mt * t * t * c[0] + t ** 3 * d[0],
    mt ** 3 * a[1] + 3 * mt * mt * t * b[1] + 3 * mt * t * t * c[1] + t ** 3 * d[1],
  ];
};
