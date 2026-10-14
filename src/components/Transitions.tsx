import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND} from './BrandTypography';
import {PLANE_PATH} from './MotionGraphics';
import {EASE, prog} from '../motion/presets';
import {HEIGHT, WIDTH} from '../timeline';

/**
 * Brand wipe system: layered navy / royal-blue / white bands travelling in a
 * direction, revealing the incoming shot behind the white hairline.
 * One visual language for every cut, with a different direction / accent each time.
 */

export type WipeKind = 'route' | 'up' | 'takeoff' | 'drive';

type Vec = {x: number; y: number};
const norm = (v: Vec): Vec => {
	const l = Math.hypot(v.x, v.y);
	return {x: v.x / l, y: v.y / l};
};

export const WIPES: Record<WipeKind, {dir: Vec; icon: boolean; route: boolean; streaks: boolean}> = {
	route: {dir: {x: -1, y: 0}, icon: true, route: true, streaks: false},
	up: {dir: {x: 0, y: -1}, icon: false, route: false, streaks: false},
	takeoff: {dir: norm({x: 1, y: -0.55}), icon: true, route: false, streaks: false},
	drive: {dir: {x: 1, y: 0}, icon: false, route: false, streaks: true},
};

const BANDS = [
	{w: 12, color: '#FFFFFF'},
	{w: 120, color: BRAND.royal},
	{w: 210, color: BRAND.navy},
];
const BANDS_TOTAL = BANDS.reduce((a, b) => a + b.w, 0);
const C = {x: WIDTH / 2, y: HEIGHT / 2};

const extent = (d: Vec) => (WIDTH / 2) * Math.abs(d.x) + (HEIGHT / 2) * Math.abs(d.y);

/** Signed distance of the trailing edge from the frame centre, along `dir`. */
export const wipeEdge = (kind: WipeKind, p: number) => {
	const e = extent(WIPES[kind].dir);
	return -e - BANDS_TOTAL + (2 * e + BANDS_TOTAL) * p;
};

/** Polygon of the frame where proj(point − C)·d < s (Sutherland–Hodgman, one plane). */
const halfPlanePolygon = (d: Vec, s: number) => {
	const rect: Vec[] = [
		{x: 0, y: 0},
		{x: WIDTH, y: 0},
		{x: WIDTH, y: HEIGHT},
		{x: 0, y: HEIGHT},
	];
	const val = (p: Vec) => s - ((p.x - C.x) * d.x + (p.y - C.y) * d.y);
	const out: Vec[] = [];
	for (let i = 0; i < rect.length; i++) {
		const a = rect[i];
		const b = rect[(i + 1) % rect.length];
		const va = val(a);
		const vb = val(b);
		if (va >= 0) out.push(a);
		if (va >= 0 !== vb >= 0) {
			const t = va / (va - vb);
			out.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
		}
	}
	if (out.length < 3) {
		return 'polygon(0 0, 0 0, 0 0)';
	}
	return `polygon(${out.map((q) => `${q.x.toFixed(1)}px ${q.y.toFixed(1)}px`).join(', ')})`;
};

export const wipeProgress = (frame: number, at: number, half: number) => prog(frame, at - half, half * 2, EASE.inOut);

/** Clip + settle applied to the incoming shot. */
export const WipeIn: React.FC<{kind: WipeKind; frame: number; at: number; half: number; children: React.ReactNode}> = ({
	kind,
	frame,
	at,
	half,
	children,
}) => {
	const p = wipeProgress(frame, at, half);
	if (p >= 1) {
		return <AbsoluteFill>{children}</AbsoluteFill>;
	}
	const {dir} = WIPES[kind];
	const s = wipeEdge(kind, p);
	const settle = 70 * (1 - EASE.outQuint(p));
	return (
		<AbsoluteFill style={{clipPath: halfPlanePolygon(dir, s)}}>
			<AbsoluteFill style={{transform: `translate(${-dir.x * settle}px, ${-dir.y * settle}px) scale(${1 + 0.04 * (1 - p)})`}}>
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Push applied to the outgoing shot. */
export const WipeOut: React.FC<{kind: WipeKind; frame: number; at: number; half: number; children: React.ReactNode}> = ({
	kind,
	frame,
	at,
	half,
	children,
}) => {
	const p = wipeProgress(frame, at, half);
	if (p <= 0) {
		return <AbsoluteFill>{children}</AbsoluteFill>;
	}
	const {dir} = WIPES[kind];
	const push = 60 * EASE.inQuart(p);
	return (
		<AbsoluteFill style={{transform: `translate(${dir.x * push}px, ${dir.y * push}px) scale(${1 + 0.06 * p})`}}>{children}</AbsoluteFill>
	);
};

/** The bands and accents themselves (drawn above both shots). */
export const WipeBands: React.FC<{kind: WipeKind; frame: number; at: number; half: number}> = ({kind, frame, at, half}) => {
	const p = wipeProgress(frame, at, half);
	if (p <= 0 || p >= 1) {
		return null;
	}
	const {dir, icon, route, streaks} = WIPES[kind];
	const s = wipeEdge(kind, p);
	const angle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
	const span = 2600;
	let offset = 0;
	const bands = BANDS.map((b, i) => {
		const mid = s + offset + b.w / 2;
		offset += b.w;
		return (
			<div
				key={i}
				style={{
					position: 'absolute',
					left: C.x + dir.x * mid - b.w / 2,
					top: C.y + dir.y * mid - span / 2,
					width: b.w,
					height: span,
					background: b.color,
					transform: `rotate(${angle}deg)`,
					boxShadow: i === 2 ? '0 0 60px rgba(7,19,55,0.45)' : undefined,
				}}
			/>
		);
	});
	const lead = s + BANDS_TOTAL;
	const headPos = {x: C.x + dir.x * lead, y: C.y + dir.y * lead};
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{bands}
			{streaks
				? [-260, -120, 40, 190, 330].map((o, i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: C.x + dir.x * (s + 40 + (i % 3) * 30) - 160,
								top: C.y + o - 2,
								width: 320,
								height: 4,
								borderRadius: 2,
								background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75))',
							}}
						/>
					))
				: null}
			{route ? (
				<div
					style={{
						position: 'absolute',
						left: headPos.x,
						top: 905,
						width: Math.max(0, WIDTH - headPos.x + 40),
						height: 0,
						borderTop: '5px dotted rgba(255,255,255,0.9)',
					}}
				/>
			) : null}
			{icon ? (
				<svg
					width={130}
					height={130}
					viewBox="0 0 24 24"
					style={{
						position: 'absolute',
						left: headPos.x - 65 + dir.x * 40,
						top: (route ? 905 : headPos.y) - 65 + dir.y * 40,
						transform: `rotate(${angle + 90}deg)`,
						filter: 'drop-shadow(0 10px 18px rgba(7,19,55,0.45))',
						overflow: 'visible',
					}}
				>
					<path d={PLANE_PATH} fill="#FFFFFF" />
				</svg>
			) : null}
		</AbsoluteFill>
	);
};

/** Circular iris from the mascot to the brand end card. */
export const IrisIn: React.FC<{frame: number; at: number; half: number; cx: number; cy: number; children: React.ReactNode}> = ({
	frame,
	at,
	half,
	cx,
	cy,
	children,
}) => {
	const p = prog(frame, at - half, half * 2, EASE.inOut);
	if (p >= 1) {
		return <AbsoluteFill>{children}</AbsoluteFill>;
	}
	const r = 1250 * p;
	return (
		<>
			<AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`}}>{children}</AbsoluteFill>
			{p > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: cx - r - 6,
						top: cy - r - 6,
						width: 2 * r + 12,
						height: 2 * r + 12,
						borderRadius: '50%',
						border: `12px solid ${BRAND.royal}`,
						boxShadow: `0 0 0 5px #ffffff, 0 0 50px rgba(31,79,209,0.5)`,
						opacity: Math.min(1, p / 0.18) * (1 - p * 0.4),
					}}
				/>
			) : null}
		</>
	);
};

export const IrisOut: React.FC<{frame: number; at: number; half: number; children: React.ReactNode}> = ({frame, at, half, children}) => {
	const p = prog(frame, at - half, half * 2, EASE.inOut);
	if (p <= 0) {
		return <AbsoluteFill>{children}</AbsoluteFill>;
	}
	return <AbsoluteFill style={{transform: `scale(${1 + 0.1 * p})`, filter: `blur(${5 * p}px)`}}>{children}</AbsoluteFill>;
};
