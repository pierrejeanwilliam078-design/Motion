// Musical grid: 128 BPM, 64 beats = exactly 30 s. Everything is placed on beats.
export const FPS = 60;
export const BPM = 128;
export const BEAT_S = 60 / BPM; // 0.46875 s
export const TOTAL_BEATS = 64;
export const DURATION = Math.round(TOTAL_BEATS * BEAT_S * FPS); // 1800 frames
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Frame of a (possibly fractional) beat. */
export const B = (beat: number) => Math.round(beat * BEAT_S * FPS);
/** Frame of a time in seconds. */
export const S = (seconds: number) => Math.round(seconds * FPS);

// Scene boundaries in beats (see scripts/generate_audio.py for the matching arrangement).
export const SCENES = {
  hook: { from: 0, to: 6 },
  reveal: { from: 6, to: 11 },
  products: { from: 11, to: 22 },
  oneClick: { from: 22, to: 30 },
  payment: { from: 30, to: 41 },
  trust: { from: 41, to: 49 },
  proof: { from: 49, to: 53 },
  final: { from: 53, to: 64 },
} as const;

// Product hits (beats) — each lands on the matching voice word.
export const PRODUCT_BEATS = [11, 13, 15, 17, 19] as const;
