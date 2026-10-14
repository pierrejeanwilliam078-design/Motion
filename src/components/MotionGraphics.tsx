import React from 'react';
import {Img, interpolate, random, staticFile} from 'remotion';
import {BRAND, FONT_FAMILY} from './BrandTypography';
import {bezierPath, bezierPoint, EASE, prog, Pt} from '../motion/presets';

/* ------------------------------------------------------------------ */
/* Icons (flat 2D, drawn in code)                                      */
/* ------------------------------------------------------------------ */

/** Top-view airliner, nose pointing UP in a 24×24 box (Material "flight" geometry). */
export const PLANE_PATH =
	'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z';

export const PlaneIcon: React.FC<{size: number; color?: string; angle?: number; style?: React.CSSProperties; shadow?: boolean}> = ({
	size,
	color = BRAND.white,
	angle = 0,
	style,
	shadow = true,
}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		style={{
			overflow: 'visible',
			transform: `rotate(${angle}deg)`,
			filter: shadow ? 'drop-shadow(0 6px 10px rgba(7,19,55,0.28))' : undefined,
			...style,
		}}
	>
		<path d={PLANE_PATH} fill={color} />
	</svg>
);

/** The official pin, cut out of the supplied TIAVOYAGES wordmark. */
export const BrandPin: React.FC<{height: number; style?: React.CSSProperties}> = ({height, style}) => (
	<Img src={staticFile('brand/wordmark-pin.png')} style={{height, width: 'auto', display: 'block', ...style}} />
);

export const CheckBadge: React.FC<{size: number; p: number; color?: string; style?: React.CSSProperties}> = ({
	size,
	p,
	color = BRAND.success,
	style,
}) => {
	const scale = interpolate(p, [0, 0.6, 1], [0.2, 1.12, 1], {extrapolateRight: 'clamp'});
	const draw = prog(p, 0.35, 0.65, EASE.outQuint);
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 40 40"
			style={{
				overflow: 'visible',
				transform: `scale(${scale})`,
				opacity: Math.min(1, p * 3),
				filter: 'drop-shadow(0 4px 8px rgba(7,19,55,0.25))',
				...style,
			}}
		>
			<circle cx="20" cy="20" r="18" fill={color} stroke="#fff" strokeWidth="3" />
			<path
				d="M12 20.5 L17.5 26 L28.5 14.5"
				fill="none"
				stroke="#fff"
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - draw}
			/>
		</svg>
	);
};

/** Four-point sparkle star. */
export const Sparkle: React.FC<{size: number; color?: string; opacity?: number; rotate?: number; style?: React.CSSProperties}> = ({
	size,
	color = '#fff',
	opacity = 1,
	rotate = 0,
	style,
}) => (
	<svg width={size} height={size} viewBox="-10 -10 20 20" style={{opacity, transform: `rotate(${rotate}deg)`, overflow: 'visible', ...style}}>
		<path d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10 Z" fill={color} />
	</svg>
);

/* ------------------------------------------------------------------ */
/* Route line with travelling airplane                                 */
/* ------------------------------------------------------------------ */

export const RouteLine: React.FC<{
	p0: Pt;
	p1: Pt;
	p2: Pt;
	p3: Pt;
	/** 0→1 head position along the curve. */
	head: number;
	/** 0→1 tail position (line erases behind the plane when > 0). */
	tail?: number;
	opacity?: number;
	planeSize?: number;
	color?: string;
	dashed?: boolean;
	width?: number;
	showPlane?: boolean;
}> = ({p0, p1, p2, p3, head, tail = 0, opacity = 1, planeSize = 54, color = '#fff', dashed = true, width = 5, showPlane = true}) => {
	const d = bezierPath(p0, p1, p2, p3);
	const pt = bezierPoint(p0, p1, p2, p3, Math.max(0.001, Math.min(1, head)));
	const visible = Math.max(0, head - tail);
	return (
		<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity}}>
			<defs>
				<linearGradient id="route-glow" x1="0" x2="1">
					<stop offset="0" stopColor={color} stopOpacity="0.15" />
					<stop offset="1" stopColor={color} stopOpacity="1" />
				</linearGradient>
				<mask id={`route-mask-${Math.round(p0.x)}-${Math.round(p3.y)}`}>
					<path
						d={d}
						fill="none"
						stroke="#fff"
						strokeWidth={width * 4}
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray={`${visible} 2`}
						strokeDashoffset={-tail}
					/>
				</mask>
			</defs>
			<g mask={`url(#route-mask-${Math.round(p0.x)}-${Math.round(p3.y)})`}>
				<path
					d={d}
					fill="none"
					stroke={color}
					strokeOpacity={0.35}
					strokeWidth={width * 2.6}
					strokeLinecap="round"
					style={{filter: 'blur(6px)'}}
				/>
				<path
					d={d}
					fill="none"
					stroke={color}
					strokeWidth={width}
					strokeLinecap="round"
					strokeDasharray={dashed ? `${width * 0.1} ${width * 3.2}` : undefined}
				/>
			</g>
			{showPlane && head > 0.001 && head < 1.2 ? (
				<g transform={`translate(${pt.x} ${pt.y}) rotate(${pt.angle + 90}) scale(${planeSize / 24})`}>
					<path d={PLANE_PATH} fill={BRAND.white} transform="translate(-12 -12)" style={{filter: 'drop-shadow(0 1px 1.5px rgba(7,19,55,0.35))'}} />
				</g>
			) : null}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* Light & glow                                                        */
/* ------------------------------------------------------------------ */

/** Specular light band crossing an area (use inside a clipped container). */
export const LightSweep: React.FC<{
	p: number;
	angle?: number;
	width?: number;
	intensity?: number;
	travel?: [number, number];
	blend?: React.CSSProperties['mixBlendMode'];
}> = ({p, angle = 20, width = 260, intensity = 0.5, travel = [-700, 1500], blend = 'screen'}) => {
	if (p <= 0 || p >= 1) {
		return null;
	}
	const x = interpolate(p, [0, 1], travel);
	const fade = Math.sin(Math.PI * p);
	return (
		<div
			style={{
				position: 'absolute',
				top: -600,
				left: x,
				width,
				height: 3200,
				transform: `rotate(${angle}deg)`,
				transformOrigin: 'center',
				background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${0.55 * intensity * fade}) 42%, rgba(255,255,255,${intensity * fade}) 50%, rgba(255,255,255,${0.55 * intensity * fade}) 58%, rgba(255,255,255,0) 100%)`,
				mixBlendMode: blend,
				filter: 'blur(6px)',
			}}
		/>
	);
};

export const SoftGlow: React.FC<{x: number; y: number; r: number; color?: string; opacity: number}> = ({
	x,
	y,
	r,
	color = '255,255,255',
	opacity,
}) => (
	<div
		style={{
			position: 'absolute',
			left: x - r,
			top: y - r,
			width: r * 2,
			height: r * 2,
			borderRadius: '50%',
			background: `radial-gradient(circle, rgba(${color},${0.85 * opacity}) 0%, rgba(${color},${0.35 * opacity}) 38%, rgba(${color},0) 70%)`,
		}}
	/>
);

/** Expanding ring (ripple). */
export const Ripple: React.FC<{x: number; y: number; p: number; radius: number; color?: string; width?: number; ellipse?: number}> = ({
	x,
	y,
	p,
	radius,
	color = BRAND.white,
	width = 3,
	ellipse = 1,
}) => {
	if (p <= 0 || p >= 1) {
		return null;
	}
	const r = radius * EASE.outQuint(p);
	return (
		<div
			style={{
				position: 'absolute',
				left: x - r,
				top: y - r * ellipse,
				width: r * 2,
				height: r * 2 * ellipse,
				borderRadius: '50%',
				border: `${width}px solid ${color}`,
				opacity: (1 - p) * 0.9,
			}}
		/>
	);
};

/** Horizontal speed lines (transport). */
export const SpeedLines: React.FC<{frame: number; start: number; count?: number; area: {x: number; y: number; w: number; h: number}; color?: string; seed?: string}> = ({
	frame,
	start,
	count = 5,
	area,
	color = BRAND.royalBright,
	seed = 'speed',
}) => (
	<>
		{new Array(count).fill(0).map((_, i) => {
			const delay = Math.round(random(`${seed}-d-${i}`) * 14);
			const len = 160 + random(`${seed}-l-${i}`) * 220;
			const y = area.y + (area.h * (i + 0.5)) / count + (random(`${seed}-y-${i}`) - 0.5) * 18;
			const p = prog(frame, start + delay, 26, EASE.inOutSine);
			if (p <= 0 || p >= 1) {
				return null;
			}
			const x = area.x - len + (area.w + len * 2) * p;
			const thick = 3 + random(`${seed}-t-${i}`) * 3;
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: x,
						top: y,
						width: len,
						height: thick,
						borderRadius: thick,
						background: `linear-gradient(90deg, rgba(255,255,255,0), ${color} 70%, #ffffff)`,
						opacity: Math.sin(Math.PI * p) * 0.85,
						boxShadow: `0 0 12px ${color}`,
					}}
				/>
			);
		})}
	</>
);

/** Twinkling highlights on water. */
export const WaterShimmer: React.FC<{frame: number; area: {x: number; y: number; w: number; h: number}; count?: number; seed?: string}> = ({
	frame,
	area,
	count = 16,
	seed = 'water',
}) => (
	<>
		{new Array(count).fill(0).map((_, i) => {
			const period = 34 + Math.round(random(`${seed}-p-${i}`) * 30);
			const phase = Math.round(random(`${seed}-o-${i}`) * period);
			const t = ((frame + phase) % period) / period;
			const a = Math.pow(Math.sin(Math.PI * t), 3);
			const x = area.x + random(`${seed}-x-${i}`) * area.w;
			const y = area.y + random(`${seed}-y-${i}`) * area.h;
			const s = 10 + random(`${seed}-s-${i}`) * 16;
			return <Sparkle key={i} size={s} opacity={a * 0.85} rotate={random(`${seed}-r-${i}`) * 30} style={{position: 'absolute', left: x - s / 2, top: y - s / 2}} />;
		})}
	</>
);

/* ------------------------------------------------------------------ */
/* Floating pictograms (scene 5)                                       */
/* ------------------------------------------------------------------ */

const PictoIcon: React.FC<{kind: 'compass' | 'dunes' | 'freedom'}> = ({kind}) => {
	const stroke = {fill: 'none', stroke: BRAND.royal, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	if (kind === 'compass') {
		return (
			<svg width="46" height="46" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="9" {...stroke} />
				<path d="M15.6 8.4 L13.4 13.4 L8.4 15.6 L10.6 10.6 Z" fill={BRAND.yellow} stroke={BRAND.royal} strokeWidth={1.6} strokeLinejoin="round" />
			</svg>
		);
	}
	if (kind === 'dunes') {
		return (
			<svg width="46" height="46" viewBox="0 0 24 24">
				<circle cx="16.5" cy="7.5" r="2.6" fill={BRAND.yellow} stroke="none" />
				<path d="M2.5 18.5 C6 12.5 9 12 12.5 15.5 C14.5 13.5 17.5 13 21.5 18.5 Z" {...stroke} />
			</svg>
		);
	}
	return (
		<svg width="46" height="46" viewBox="0 0 24 24">
			<path d="M3 11.5 L20.5 4 L15.5 20 L11.5 13.5 Z" {...stroke} />
			<path d="M11.5 13.5 L20.5 4" {...stroke} />
			<path d="M3.5 19 C5.5 18.5 7 17.5 8.5 16" {...stroke} stroke={BRAND.yellow} />
		</svg>
	);
};

export const PictoChip: React.FC<{
	kind: 'compass' | 'dunes' | 'freedom';
	label: string;
	p: number;
	exit: number;
	float: number;
	style?: React.CSSProperties;
}> = ({kind, label, p, exit, float, style}) => {
	const appear = p * (1 - exit);
	if (appear <= 0.001) {
		return null;
	}
	return (
		<div
			style={{
				position: 'absolute',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 10,
				transform: `translate(-50%, -50%) translateY(${(1 - p) * 26 - exit * 20 + float}px) scale(${0.72 + 0.28 * p})`,
				opacity: appear,
				...style,
			}}
		>
			<div
				style={{
					width: 96,
					height: 96,
					borderRadius: 48,
					background: 'rgba(255,255,255,0.92)',
					boxShadow: '0 14px 30px rgba(7,19,55,0.22), inset 0 0 0 1.5px rgba(255,255,255,0.9)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<PictoIcon kind={kind} />
			</div>
			<div
				style={{
					fontFamily: FONT_FAMILY,
					fontWeight: 700,
					fontSize: 25,
					letterSpacing: '0.02em',
					color: BRAND.navy,
					background: 'rgba(255,255,255,0.92)',
					padding: '7px 16px',
					borderRadius: 999,
					boxShadow: '0 8px 18px rgba(7,19,55,0.16)',
					whiteSpace: 'nowrap',
				}}
			>
				{label}
			</div>
		</div>
	);
};
