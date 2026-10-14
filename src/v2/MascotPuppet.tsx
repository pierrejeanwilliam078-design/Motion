import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';
import data from '../data/v2Mascots.json';
import {EASE, prog, springAt, SPRINGS} from '../motion/presets';
import {FPS} from '../timeline';

export type Pose = 'emirati' | 'phone' | 'passport' | 'thumbs' | 'hero';
type Eye = {x: number; y: number; w: number; h: number; face: string};
const POSES = data as Record<Pose, {width: number; height: number; eyes: Eye[]}>;

/** Blink curve: 0 open → 1 closed → 0 open (7 frames). */
const blinkAmount = (frame: number, blinks: number[]) => {
	for (const b of blinks) {
		const t = frame - b;
		if (t >= 0 && t <= 6) {
			return interpolate(t, [0, 2, 4, 6], [0, 1, 1, 0], {easing: EASE.inOutSine});
		}
	}
	return 0;
};

/**
 * The TIAVOYAGES mascot as a 2.5D puppet: cut-out of the supplied artwork,
 * animated with a spring entrance (anticipation + settle), idle breathing,
 * gentle sway, step bob, and real eyelid blinks drawn over its eyes.
 * The face and proportions are never deformed beyond ±2 %.
 */
export const MascotPuppet: React.FC<{
	pose: Pose;
	frame: number;
	/** Horizontal centre of the character (px). */
	x: number;
	/** Ground line under the character's feet (px). */
	bottom: number;
	/** Displayed height (px). */
	height: number;
	enterAt: number;
	enterFrom?: 'below' | 'left' | 'right' | 'scale';
	exitAt?: number;
	blinks?: number[];
	sway?: number;
	walk?: boolean;
	flip?: boolean;
	shadow?: boolean;
	style?: React.CSSProperties;
}> = ({pose, frame, x, bottom, height, enterAt, enterFrom = 'below', exitAt, blinks = [], sway = 1.6, walk = false, flip = false, shadow = true, style}) => {
	const p = POSES[pose];
	const k = height / p.height;
	const width = p.width * k;

	const enter = springAt(frame, FPS, enterAt, SPRINGS.soft);
	const exit = exitAt === undefined ? 0 : prog(frame, exitAt, 12, EASE.inQuart);
	const t = frame - enterAt;

	// Entrance: a small anticipation squash, then a controlled settle.
	let tx = 0;
	let ty = 0;
	let sc = 1;
	if (enterFrom === 'below') ty = (1 - enter) * height * 0.75;
	if (enterFrom === 'left') tx = -(1 - enter) * 900;
	if (enterFrom === 'right') tx = (1 - enter) * 900;
	if (enterFrom === 'scale') sc = 0.6 + 0.4 * enter;
	const land = interpolate(t, [6, 10, 16], [1, 0.975, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	// Idle life.
	const breathe = 1 + 0.012 * Math.sin(t / 11);
	const rot = Math.sin(t / 19) * sway;
	const bob = walk ? -Math.abs(Math.sin(t / 5.5)) * 14 : Math.sin(t / 13) * 5;
	const stepTilt = walk ? Math.sin(t / 5.5) * 1.6 : 0;

	const blink = blinkAmount(frame, blinks);
	const opacity = Math.min(1, Math.max(0, (frame - enterAt + 2) / 4)) * (1 - exit);
	if (opacity <= 0) {
		return null;
	}
	return (
		<div
			style={{
				position: 'absolute',
				left: x - width / 2,
				top: bottom - height,
				width,
				height,
				opacity,
				transform: `translate(${tx}px, ${ty + exit * 60}px) scale(${sc})`,
				transformOrigin: '50% 100%',
				...style,
			}}
		>
			{shadow ? (
				<div
					style={{
						position: 'absolute',
						left: width * 0.12,
						width: width * 0.76,
						top: height - 26,
						height: 48,
						borderRadius: '50%',
						background: 'radial-gradient(ellipse, rgba(7,19,55,0.28) 0%, rgba(7,19,55,0) 70%)',
						transform: `scaleX(${1 + bob / 120})`,
					}}
				/>
			) : null}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateY(${bob}px) rotate(${rot + stepTilt}deg) scale(${(flip ? -1 : 1) * breathe * (2 - land)}, ${breathe * land})`,
					transformOrigin: '50% 92%',
				}}
			>
				<Img src={staticFile(`v2/mascot-${pose}.png`)} style={{width, height, display: 'block'}} />
				{blink > 0
					? p.eyes.map((e, i) => {
							const pad = 7;
							const ex = (e.x - pad) * k;
							const ey = (e.y - pad) * k;
							const ew = (e.w + pad * 2) * k;
							const eh = (e.h + pad * 2) * k;
							return (
								<div key={i} style={{position: 'absolute', left: ex, top: ey, width: ew, height: eh}}>
									<div
										style={{
											position: 'absolute',
											inset: 0,
											borderRadius: '50%',
											background: e.face,
											transform: `scaleY(${blink})`,
											transformOrigin: '50% 0%',
										}}
									/>
									{blink > 0.75 ? (
										<svg width={ew} height={eh} viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0}}>
											<path d="M14 52 Q50 74 86 52" fill="none" stroke="#3B2216" strokeWidth={7} strokeLinecap="round" />
										</svg>
									) : null}
								</div>
							);
						})
					: null}
			</div>
		</div>
	);
};
