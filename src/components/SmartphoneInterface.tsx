import React from 'react';
import {interpolate} from 'remotion';
import track from '../data/phoneScreenTrack.json';
import {BRAND, FONT_FAMILY} from './BrandTypography';
import {BrandPin, CheckBadge, LightSweep, PLANE_PATH, Sparkle} from './MotionGraphics';
import {EASE, prog} from '../motion/presets';

/**
 * Animated flat-2D interface composited onto the phone held by the mascot.
 *
 * The phone screen was planar-tracked (SIFT + RANSAC homography, sub-pixel
 * residual) on every frame of the original shot. Everything below is drawn in
 * a flat 390×844 "iPhone points" space and projected onto the real screen
 * with a CSS matrix3d, so it sticks to the glass through the camera move.
 *
 * All timings are SOURCE frames of the original video, so the overlay stays
 * locked to the original card reveals and to the voice-over.
 */

type Homography = number[];
const FRAMES = (track as {frames: Record<string, Homography>}).frames;
const SCREEN = (track as {screen: {width: number; height: number}}).screen;

const toMatrix3d = (h: Homography) => {
	const [a, b, c, d, e, f, g, hh, i] = h;
	return `matrix3d(${a}, ${d}, 0, ${g}, ${b}, ${e}, 0, ${hh}, 0, 0, 1, 0, ${c}, ${f}, 0, ${i})`;
};

/** Original UI geometry measured on the rectified screen (flat units). */
const CARD = {
	vols: {x: 34, y: 318, w: 153, h: 205, bg: '#DBE9FE', land: 166},
	visa: {x: 203, y: 318, w: 153, h: 205, bg: '#D8F1EC', land: 177},
	heb: {x: 34, y: 541, w: 153, h: 207, bg: '#FFEED2', land: 189},
	dates: {x: 203, y: 541, w: 153, h: 207, bg: '#FDE2EC', land: 201},
} as const;

const fadeIn = (f: number, start: number) => prog(f, start, 3, EASE.inOutSine);

/** Patch hiding the baked-in icon, re-drawn by a live animated vector icon. */
const IconSlot: React.FC<{x: number; y: number; w: number; h: number; bg: string; opacity: number; children: React.ReactNode}> = ({
	x,
	y,
	w,
	h,
	bg,
	opacity,
	children,
}) =>
	opacity <= 0 ? null : (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity}}>
			<div style={{position: 'absolute', inset: 0, background: bg, borderRadius: 10}} />
			{children}
		</div>
	);

const LandRing: React.FC<{x: number; y: number; w: number; h: number; p: number}> = ({x, y, w, h, p}) => {
	if (p <= 0 || p >= 1) {
		return null;
	}
	const s = 1 + 0.07 * EASE.outQuint(p);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: 22,
				border: `2.5px solid ${BRAND.royalBright}`,
				boxShadow: `0 0 16px rgba(46,107,240,0.55)`,
				transform: `scale(${s})`,
				opacity: (1 - p) * 0.95,
			}}
		/>
	);
};

export const SmartphoneInterface: React.FC<{srcFrame: number}> = ({srcFrame}) => {
	const key = String(Math.round(srcFrame));
	const h = FRAMES[key];
	if (!h || srcFrame < 140) {
		return null;
	}
	const f = srcFrame;

	// --- Vols: plane glides forward with a dotted contrail, then hovers.
	const vOn = fadeIn(f, 168);
	const glide = prog(f, 172, 22, EASE.inOut);
	const hover = Math.sin((f - 172) / 9) * 1.2 * glide;
	const planeShift = interpolate(glide, [0, 0.5, 1], [0, 7, 0]) + hover;
	const trail = interpolate(glide, [0, 0.4, 1], [0, 1, 0]);

	// --- Visa: clean pop + sparkle burst.
	const viOn = fadeIn(f, 180);
	const pop = interpolate(f, [182, 188, 196], [1, 1.16, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOutSine});
	const burst = prog(f, 184, 16, EASE.outQuint);

	// --- Hébergement: building rises subtly, windows light up one by one.
	const hOn = fadeIn(f, 191);
	const rise = interpolate(f, [192, 204], [5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint});

	// --- Dates: gentle check.
	const dOn = fadeIn(f, 203);
	const check = prog(f, 205, 14, EASE.outQuint);
	const dayPick = prog(f, 205, 8, EASE.outQuint);

	// --- Location chip popping out of the screen.
	const chip = prog(f, 146, 16, EASE.backOut);
	const chipFloat = Math.sin((f - 146) / 14) * 3;

	// --- CTA button.
	const cta = prog(f, 218, 14, EASE.outQuint);
	const tap = prog(f, 236, 14, EASE.outQuint);
	const press = interpolate(f, [234, 237, 242], [1, 0.96, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const done = prog(f, 242, 10, EASE.outQuint);

	// --- Glass sheen, matched to the original UI sweep.
	const sheen = prog(f, 209, 12, EASE.inOutSine);

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: SCREEN.width,
				height: SCREEN.height,
				transformOrigin: '0 0',
				transform: toMatrix3d(h),
				fontFamily: FONT_FAMILY,
			}}
		>
			{/* Card landing accents */}
			{Object.values(CARD).map((c, i) => (
				<LandRing key={i} x={c.x} y={c.y} w={c.w} h={c.h} p={prog(f, c.land - 2, 16, EASE.inOutSine)} />
			))}

			{/* VOLS */}
			<IconSlot x={74} y={362} w={66} h={70} bg={CARD.vols.bg} opacity={vOn}>
				<svg width={66} height={70} viewBox="0 0 66 70" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					{[0, 1, 2].map((i) => (
						<circle
							key={i}
							cx={33 - 10 - i * 7 + planeShift * 0.7}
							cy={35 + 10 + i * 7 - planeShift * 0.7}
							r={2.2 - i * 0.5}
							fill="#328CE9"
							opacity={trail * (0.8 - i * 0.22)}
						/>
					))}
					<g transform={`translate(${33 + planeShift * 0.7} ${35 - planeShift * 0.7}) rotate(45) scale(2.45) translate(-12 -12)`}>
						<path d={PLANE_PATH} fill="#328CE9" />
					</g>
				</svg>
			</IconSlot>

			{/* VISA */}
			<IconSlot x={250} y={358} w={60} h={76} bg={CARD.visa.bg} opacity={viOn}>
				<div style={{position: 'absolute', left: 8, top: 7, width: 43, height: 61, transform: `scale(${pop})`}}>
					<svg width={43} height={61} viewBox="0 0 43 61">
						<rect x="0" y="0" width="43" height="61" rx="6" fill="#169C83" />
						<circle cx="21.5" cy="24" r="11" fill="none" stroke="#fff" strokeWidth="2.4" />
						<ellipse cx="21.5" cy="24" rx="4.6" ry="11" fill="none" stroke="#fff" strokeWidth="2" />
						<path d="M10.5 24 H32.5 M12.5 18 H30.5 M12.5 30 H30.5" stroke="#fff" strokeWidth="1.8" />
						<rect x="13" y="45" width="17" height="3.2" rx="1.6" fill="#fff" />
					</svg>
				</div>
				{[0, 1, 2, 3].map((i) => {
					const a = (i * Math.PI) / 2 + Math.PI / 4;
					const d = 26 + 14 * burst;
					return (
						<Sparkle
							key={i}
							size={10}
							color={BRAND.yellow}
							opacity={burst > 0 && burst < 1 ? Math.sin(Math.PI * burst) : 0}
							style={{position: 'absolute', left: 30 + Math.cos(a) * d - 5, top: 38 + Math.sin(a) * d - 5}}
						/>
					);
				})}
			</IconSlot>

			{/* HÉBERGEMENT */}
			<IconSlot x={84} y={588} w={56} h={68} bg={CARD.heb.bg} opacity={hOn}>
				<svg width={56} height={68} viewBox="0 0 56 68" style={{position: 'absolute', inset: 0, transform: `translateY(${rise}px)`}}>
					<rect x="7" y="7" width="28" height="55" rx="2" fill="#F2A52B" />
					<rect x="34" y="24" width="15" height="38" rx="2" fill="#F7B955" />
					{new Array(12).fill(0).map((_, i) => {
						const col = i % 3;
						const row = Math.floor(i / 3);
						const lit = prog(f, 194 + i * 0.9, 5, EASE.outQuint);
						return (
							<rect
								key={i}
								x={11 + col * 7.5}
								y={12 + row * 9}
								width="5"
								height="5.5"
								rx="1"
								fill={interpolate(lit, [0, 1], [0, 1]) > 0.5 ? '#FFF6DF' : '#FFE2A8'}
								opacity={0.75 + 0.25 * lit}
							/>
						);
					})}
					{[0, 1, 2].map((r) => (
						<rect key={r} x="39" y={29 + r * 9} width="5" height="5" rx="1" fill="#FFF1D2" />
					))}
					<rect x="17.5" y="51" width="7" height="11" rx="1" fill="#FFF1D2" />
				</svg>
			</IconSlot>

			{/* DATES */}
			<IconSlot x={244} y={581} w={70} h={77} bg={CARD.dates.bg} opacity={dOn}>
				<svg width={70} height={77} viewBox="0 0 70 77" style={{position: 'absolute', inset: 0}}>
					<rect x="8" y="12" width="54" height="56" rx="9" fill="#fff" stroke="#E3517B" strokeWidth="5" />
					<path d="M8 21 a9 9 0 0 1 9 -9 h36 a9 9 0 0 1 9 9 v7 H8 Z" fill="#E3517B" />
					<rect x="20" y="6" width="5.5" height="12" rx="2.75" fill="#E3517B" />
					<rect x="44.5" y="6" width="5.5" height="12" rx="2.75" fill="#E3517B" />
					{new Array(6).fill(0).map((_, i) => {
						const col = i % 3;
						const row = Math.floor(i / 3);
						const isPick = i === 4;
						return (
							<rect
								key={i}
								x={17 + col * 13}
								y={36 + row * 13}
								width="9"
								height="8"
								rx="2"
								fill={isPick ? interpolate(dayPick, [0, 1], [0, 1]) > 0.5 ? BRAND.royalBright : '#E3517B' : '#E3517B'}
								transform={isPick ? `translate(${17 + col * 13 + 4.5} ${36 + row * 13 + 4}) scale(${1 + 0.35 * Math.sin(Math.PI * dayPick)}) translate(${-(17 + col * 13 + 4.5)} ${-(36 + row * 13 + 4)})` : undefined}
							/>
						);
					})}
				</svg>
				<div style={{position: 'absolute', left: 46, top: 50}}>
					<CheckBadge size={26} p={check} />
				</div>
			</IconSlot>

			{/* Glass sheen */}
			<div style={{position: 'absolute', left: 0, top: 0, width: 374, height: SCREEN.height, overflow: 'hidden', borderRadius: 40}}>
				<LightSweep p={sheen} angle={22} width={150} intensity={0.55} travel={[-260, 520]} blend="normal" />
			</div>

			{/* CTA button */}
			{cta > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: 34,
						top: 764,
						width: 322,
						height: 52,
						borderRadius: 26,
						background: `linear-gradient(90deg, ${BRAND.royal}, ${BRAND.royalBright})`,
						boxShadow: '0 10px 22px rgba(31,79,209,0.35)',
						opacity: cta,
						transform: `translateY(${(1 - cta) * 26}px) scale(${press})`,
						overflow: 'hidden',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 10,
						color: '#fff',
						fontWeight: 700,
						fontSize: 17,
						letterSpacing: '0.01em',
					}}
				>
					{tap > 0 && tap < 1 ? (
						<div
							style={{
								position: 'absolute',
								left: 250 - 170 * tap,
								top: 26 - 170 * tap,
								width: 340 * tap,
								height: 340 * tap,
								borderRadius: '50%',
								background: 'rgba(255,255,255,0.28)',
								opacity: 1 - tap,
							}}
						/>
					) : null}
					<span style={{position: 'relative'}}>Confirmer mon voyage</span>
					<span style={{position: 'relative', width: 22, height: 22, display: 'inline-block'}}>
						<svg width="22" height="22" viewBox="0 0 24 24" style={{position: 'absolute', inset: 0, opacity: 1 - done}}>
							<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						<div style={{position: 'absolute', inset: -2, opacity: done > 0 ? 1 : 0}}>
							<CheckBadge size={26} p={done} color={BRAND.success} />
						</div>
					</span>
				</div>
			) : null}

			{/* Location chip (pin taken from the official wordmark) */}
			{chip > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: 195,
						top: -54 + chipFloat,
						transform: `translate(-50%, -50%) translateY(${(1 - chip) * 30}px) scale(${0.6 + 0.4 * chip})`,
						opacity: Math.min(1, chip * 1.5),
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						padding: '8px 16px 8px 12px',
						background: 'rgba(255,255,255,0.96)',
						borderRadius: 999,
						boxShadow: '0 10px 24px rgba(7,19,55,0.25)',
						whiteSpace: 'nowrap',
					}}
				>
					<BrandPin height={26} />
					<span style={{fontWeight: 800, fontSize: 18, color: BRAND.navy, letterSpacing: '0.02em'}}>Dubaï</span>
				</div>
			) : null}
		</div>
	);
};
