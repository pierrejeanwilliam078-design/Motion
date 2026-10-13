import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./timing";

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-like out
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  outBack: Easing.bezier(0.34, 1.32, 0.64, 1), // very subtle overshoot
  speedRamp: Easing.bezier(0.9, 0, 0.1, 1), // slow-fast-slow
};

/** Clamped interpolation between two frames with an easing. */
export const tween = (
  frame: number,
  from: number,
  to: number,
  out: [number, number] = [0, 1],
  easing: (t: number) => number = E.inOut,
) =>
  interpolate(frame, [from, to], out, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Multi-stop clamped interpolation. */
export const keys = (frame: number, input: number[], output: number[], easing: (t: number) => number = E.inOut) =>
  interpolate(frame, input, output, { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Spring starting at `start` (0 before). */
export const springAt = (
  frame: number,
  start: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
  durationInFrames?: number,
) =>
  spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 16, stiffness: 140, mass: 0.9, ...config },
    durationInFrames,
  });

/** Gentle deterministic float (product floating animation). */
export const float = (frame: number, amp = 10, period = 140, phase = 0) =>
  Math.sin(((frame + phase) / period) * Math.PI * 2) * amp;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
