/**
 * V4 — Géométrie de l'île (silhouette exacte Natural Earth 1:50m).
 * Rééchantillonnage, morphing de formes à nombre de points égal, grille de points
 * intérieure (test point-dans-polygone), contour lissé pour le texte sur chemin.
 */
import {MADAGASCAR} from '../data/madagascar';
import {hash} from '../lib/motion';

export type Pt = [number, number];

/** Polygone brut de l'île (unités carte : 506 × 1000). */
export const ISLAND_RAW: Pt[] = MADAGASCAR.path
  .replace(/^M/, '')
  .replace(/Z$/, '')
  .split('L')
  .map((s) => s.trim().split(/\s+/).map(Number) as Pt);

export const BBOX_C: Pt = [MADAGASCAR.width / 2, MADAGASCAR.height / 2];
export const TANA = MADAGASCAR.cities.antananarivo as Pt;
export const TOAM = MADAGASCAR.cities.toamasina as Pt;

const signedArea = (p: Pt[]) => p.reduce((a, [x, y], i) => {
  const [x2, y2] = p[(i + 1) % p.length];
  return a + x * y2 - x2 * y;
}, 0) / 2;
export const CLOCKWISE = signedArea(ISLAND_RAW) > 0; // repère écran (y vers le bas)

/** Rééchantillonne un polygone fermé en N points équidistants. */
export const resample = (pts: Pt[], n: number): Pt[] => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const l = Math.hypot(x2 - x1, y2 - y1);
    seg.push(l);
    total += l;
  }
  const out: Pt[] = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const d = (k / n) * total;
    while (acc + seg[i] < d) {
      acc += seg[i];
      i = (i + 1) % pts.length;
    }
    const t = seg[i] ? (d - acc) / seg[i] : 0;
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return out;
};

export const N_MORPH = 240;
export const ISLAND_N = resample(ISLAND_RAW, N_MORPH);

/** Lissage (moyenne glissante circulaire). */
export const smooth = (pts: Pt[], passes = 3, k = 2): Pt[] => {
  let p = pts;
  for (let s = 0; s < passes; s++) {
    p = p.map((_, i) => {
      let x = 0;
      let y = 0;
      for (let j = -k; j <= k; j++) {
        const q = p[(i + j + p.length) % p.length];
        x += q[0];
        y += q[1];
      }
      return [x / (2 * k + 1), y / (2 * k + 1)] as Pt;
    });
  }
  return p;
};
export const ISLAND_SMOOTH = smooth(resample(ISLAND_RAW, 160), 4, 2);

// ------------------------------------------------------------------ transformations
export type View = {s: number; cx: number; cy: number}; // échelle + position écran du centre de la bbox
export const toScreen = (p: Pt, v: View): Pt => [v.cx + (p[0] - BBOX_C[0]) * v.s, v.cy + (p[1] - BBOX_C[1]) * v.s];
export const mapPts = (pts: Pt[], v: View) => pts.map((p) => toScreen(p, v));
export const scaleAbout = (pts: Pt[], c: Pt, k: number) => pts.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k] as Pt);
export const toPath = (pts: Pt[]) => `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')} Z`;
export const islandPath = (v: View) => toPath(mapPts(ISLAND_N, v));

// ------------------------------------------------------------------ formes cibles (N points)
const orient = (pts: Pt[]) => (CLOCKWISE ? pts : [...pts].reverse());
export const circlePts = (c: Pt, r: number, n = N_MORPH): Pt[] =>
  orient(Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as Pt;
  }));
export const hexPts = (c: Pt, r: number, n = N_MORPH): Pt[] => {
  const corners: Pt[] = Array.from({length: 6}, (_, i) => {
    const a = ((60 * i - 90) * Math.PI) / 180;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  });
  return orient(resample(corners, n));
};

/** Décale l'indice de départ de B pour minimiser la distance à A (morph sans torsion). */
export const align = (a: Pt[], b: Pt[]) => {
  let best = 0;
  let bestD = Infinity;
  for (let k = 0; k < b.length; k += 2) {
    let d = 0;
    for (let i = 0; i < a.length; i += 4) {
      const q = b[(i + k) % b.length];
      d += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
    }
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return b.map((_, i) => b[(i + best) % b.length]);
};
export const morph = (a: Pt[], b: Pt[], t: number) => a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t] as Pt);

// ------------------------------------------------------------------ grille de points
const inside = (p: Pt, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

export type Dot = {p: Pt; r1: number; r2: number; r3: number; r4: number; dTana: number; dToam: number};
const SPACING = 14;
export const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  let k = 0;
  for (let y = SPACING / 2; y < MADAGASCAR.height; y += SPACING) {
    for (let x = SPACING / 2 + ((Math.round(y / SPACING) % 2) * SPACING) / 2; x < MADAGASCAR.width; x += SPACING) {
      if (!inside([x, y], ISLAND_RAW)) continue;
      out.push({
        p: [x, y],
        r1: hash(k * 1.13 + 1),
        r2: hash(k * 2.71 + 7),
        r3: hash(k * 0.37 + 13),
        r4: hash(k * 5.19 + 29),
        dTana: Math.hypot(x - TANA[0], y - TANA[1]),
        dToam: Math.hypot(x - TOAM[0], y - TOAM[1]),
      });
      k++;
    }
  }
  return out;
})();
export const DOT_STEP = SPACING;

/** Tracé lissé (Catmull-Rom → Bézier) pour les gros plans. */
export const smoothPathD = (pts: Pt[]) => {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
};

/** Interpolation de vue (échelle logarithmique, point focal qui glisse uniformément). */
export const viewLerp = (a: View, b: View, focus: Pt, t: number): View => {
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
  const fa = toScreen(focus, a);
  const fb = toScreen(focus, b);
  const u = a.s === b.s ? t : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s);
  const fx = fa[0] + (fb[0] - fa[0]) * u;
  const fy = fa[1] + (fb[1] - fa[1]) * u;
  return {s, cx: fx - (focus[0] - BBOX_C[0]) * s, cy: fy - (focus[1] - BBOX_C[1]) * s};
};
