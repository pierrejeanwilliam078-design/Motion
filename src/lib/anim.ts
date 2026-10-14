import {Easing, interpolate, spring} from 'remotion';
import {FPS} from '../timeline';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Interpolation bornée avec easing (par défaut ease-in-out). */
export const tween = (
	frame: number,
	[f0, f1]: [number, number],
	[v0, v1]: [number, number],
	easing: (t: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(frame, [f0, f1], [v0, v1], {...clamp, easing});

/** Ressort maîtrisé (léger dépassement, sans rebond excessif). */
export const springAt = (frame: number, start: number, config: {damping?: number; stiffness?: number; mass?: number} = {}) =>
	spring({
		frame: frame - start,
		fps: FPS,
		config: {damping: 14, stiffness: 140, mass: 0.8, ...config},
	});

/** Cloche 0 → 1 → 0 sur [f0, f1]. */
export const bell = (frame: number, f0: number, f1: number) => {
	const t = interpolate(frame, [f0, f1], [0, 1], clamp);
	return Math.sin(Math.PI * t);
};

/** Oscillation amortie (salut de la main, petit « coucou »). */
export const dampedWave = (frame: number, start: number, freqHz: number, decay: number) => {
	if (frame < start) return 0;
	const t = (frame - start) / FPS;
	return Math.sin(2 * Math.PI * freqHz * t) * Math.exp(-decay * t);
};

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOutBack = Easing.out(Easing.back(1.4));
