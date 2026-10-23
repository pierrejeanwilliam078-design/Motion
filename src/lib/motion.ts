// Primitives d'animation déterministes : tout est une fonction pure du temps (secondes).
// Le même code pilote l'aperçu navigateur et le rendu image par image de Remotion.

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Progression linéaire 0→1 entre deux instants. */
export const progress = (t: number, start: number, end: number) =>
  end === start ? (t >= end ? 1 : 0) : clamp((t - start) / (end - start));

/** Courbe de Bézier cubique CSS (x1, y1, x2, y2). */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(u) - x;
      const d = dx(u);
      if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    return sy(clamp(u));
  };
}

export const ease = {
  linear: (x: number) => x,
  out: bezier(0.16, 1, 0.3, 1), // expo-out, entrées
  inOut: bezier(0.65, 0, 0.35, 1), // déplacements
  in: bezier(0.7, 0, 0.84, 0), // sorties
  emphasized: bezier(0.2, 0, 0, 1), // Material 3 « emphasized decelerate »
  soft: bezier(0.33, 1, 0.68, 1),
};

/** Interpolation temporelle avec easing : valeur de `from` à `to` entre start et start+dur. */
export const tween = (
  t: number,
  start: number,
  dur: number,
  from = 0,
  to = 1,
  easing: (x: number) => number = ease.out,
) => lerp(from, to, easing(progress(t, start, start + dur)));

export type SpringConfig = { stiffness?: number; damping?: number; mass?: number };

/** Ressort amorti analytique (vitesse initiale nulle), 0 → 1, t en secondes depuis le départ. */
export function spring(t: number, { stiffness = 170, damping = 22, mass = 1 }: SpringConfig = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

/** Ressort déclenché à `start`, mappé de `from` à `to`. */
export const springAt = (t: number, start: number, from = 0, to = 1, cfg?: SpringConfig) =>
  lerp(from, to, spring(t - start, cfg));

/** Fenêtre d'opacité : apparition puis disparition. */
export const fadeWindow = (t: number, inStart: number, inDur: number, outStart: number, outDur: number) =>
  Math.min(tween(t, inStart, inDur, 0, 1, ease.soft), 1 - tween(t, outStart, outDur, 0, 1, ease.in));

/** Pseudo-aléatoire reproductible (hash entier → [0, 1[). */
export function rand(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Interpolation multi-points (comme interpolate() de Remotion), avec extrapolation bornée. */
export function interp(t: number, input: number[], output: number[], easing: (x: number) => number = ease.inOut) {
  if (t <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (t <= input[i]) return lerp(output[i - 1], output[i], easing(progress(t, input[i - 1], input[i])));
  }
  return output[output.length - 1];
}
