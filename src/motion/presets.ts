import {Easing, interpolate, spring, SpringConfig} from 'remotion';

/** Premium easing curves (cubic-bezier). */
export const EASE = {
	/** Fast start, long silky settle — default for entrances. */
	outQuint: Easing.bezier(0.22, 1, 0.36, 1),
	/** Very fast start — UI micro-interactions, wipes. */
	outExpo: Easing.bezier(0.16, 1, 0.3, 1),
	/** Symmetric, cinematic camera moves. */
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
	/** Gentle symmetric drift. */
	inOutSine: Easing.bezier(0.37, 0, 0.63, 1),
	/** Accelerating exits. */
	inQuart: Easing.bezier(0.5, 0, 0.75, 0),
	/** Small controlled overshoot. */
	backOut: Easing.bezier(0.34, 1.4, 0.64, 1),
} as const;

/** Controlled springs — never bouncy. */
export const SPRINGS: Record<'soft' | 'pop' | 'settle' | 'snappy', Partial<SpringConfig>> = {
	soft: {damping: 20, stiffness: 120, mass: 0.9},
	pop: {damping: 13, stiffness: 190, mass: 0.6},
	settle: {damping: 22, stiffness: 80, mass: 1.1},
	snappy: {damping: 26, stiffness: 260, mass: 0.7},
};

/** 0 → 1 progress between `start` and `start + duration`, clamped and eased. */
export const prog = (
	frame: number,
	start: number,
	duration: number,
	easing: (t: number) => number = EASE.outQuint,
) =>
	interpolate(frame, [start, start + duration], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing,
	});

/** Spring starting at `start`. */
export const springAt = (
	frame: number,
	fps: number,
	start: number,
	config: Partial<SpringConfig> = SPRINGS.soft,
) => spring({frame: frame - start, fps, config});

/** Linear interpolation helper. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Keyframed value: frames[] → values[] with an easing, clamped. */
export const keyframes = (
	frame: number,
	frames: number[],
	values: number[],
	easing: (t: number) => number = EASE.inOut,
) =>
	interpolate(frame, frames, values, {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing,
	});

/** Point and tangent angle on a cubic Bézier curve. */
export type Pt = {x: number; y: number};
export const bezierPoint = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number) => {
	const u = 1 - t;
	const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
	const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
	const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
	const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
	return {x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI};
};

export const bezierPath = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) =>
	`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
