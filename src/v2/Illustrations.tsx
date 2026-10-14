import React from 'react';
import {interpolate, random} from 'remotion';
import {BRAND} from '../components/BrandTypography';
import {PLANE_PATH} from '../components/MotionGraphics';
import {EASE, prog, springAt, SPRINGS} from '../motion/presets';
import {FPS} from '../timeline';

/* Flat vector illustration kit for the V2 film — everything drawn in code. */

export const Sky: React.FC<{top?: string; bottom?: string}> = ({top = '#8FD0FF', bottom = '#EAF6FF'}) => (
	<div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${top} 0%, ${bottom} 78%)`}} />
);

export const Sun: React.FC<{x: number; y: number; r: number; p: number}> = ({x, y, r, p}) => (
	<div style={{position: 'absolute', left: x - r * 2, top: y - r * 2, width: r * 4, height: r * 4, opacity: p, transform: `scale(${0.6 + 0.4 * p})`}}>
		<div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,214,90,0.55) 0%, rgba(255,214,90,0) 65%)'}} />
		<div style={{position: 'absolute', left: r, top: r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 40% 35%, #FFE68A, ${BRAND.yellow})`}} />
	</div>
);

export const Cloud: React.FC<{x: number; y: number; s: number; opacity?: number}> = ({x, y, s, opacity = 1}) => (
	<svg width={260 * s} height={110 * s} viewBox="0 0 260 110" style={{position: 'absolute', left: x, top: y, opacity, overflow: 'visible'}}>
		<path
			d="M30 100 C5 100 0 70 25 62 C20 35 55 22 75 38 C85 10 135 0 150 30 C170 15 205 25 205 52 C235 50 255 75 240 100 Z"
			fill="#FFFFFF"
		/>
	</svg>
);

/** Drifting cloud layer. speed in px / frame (negative = moving left). */
export const CloudLayer: React.FC<{frame: number; count: number; y: [number, number]; scale: [number, number]; speed: number; opacity?: number; seed: string}> = ({
	frame,
	count,
	y,
	scale,
	speed,
	opacity = 0.95,
	seed,
}) => (
	<>
		{new Array(count).fill(0).map((_, i) => {
			const s = scale[0] + (scale[1] - scale[0]) * random(`${seed}-s-${i}`);
			const span = 1080 + 600;
			const x0 = random(`${seed}-x-${i}`) * span;
			const x = ((((x0 + frame * speed) % span) + span) % span) - 400;
			const yy = y[0] + (y[1] - y[0]) * random(`${seed}-y-${i}`);
			return <Cloud key={i} x={x} y={yy} s={s} opacity={opacity} />;
		})}
	</>
);

/* ------------------------------------------------------------------ */
/* Dubai skyline                                                       */
/* ------------------------------------------------------------------ */

type Building = {x: number; w: number; h: number; kind: 'tower' | 'burj' | 'arab' | 'frame' | 'twist'};

const SKYLINE: Building[] = [
	{x: 40, w: 90, h: 360, kind: 'tower'},
	{x: 150, w: 120, h: 560, kind: 'arab'},
	{x: 290, w: 80, h: 420, kind: 'tower'},
	{x: 380, w: 130, h: 380, kind: 'frame'},
	{x: 525, w: 70, h: 500, kind: 'twist'},
	{x: 610, w: 90, h: 330, kind: 'tower'},
	{x: 700, w: 170, h: 1040, kind: 'burj'},
	{x: 880, w: 80, h: 470, kind: 'tower'},
	{x: 965, w: 100, h: 380, kind: 'tower'},
];

const burjPath = (w: number, h: number) => {
	// Stepped, tapering silhouette + spire.
	const cx = w / 2;
	const tiers = [
		[0.5, 0.0],
		[0.42, 0.18],
		[0.35, 0.34],
		[0.28, 0.48],
		[0.22, 0.6],
		[0.16, 0.7],
		[0.11, 0.78],
		[0.07, 0.84],
	];
	const left: string[] = [];
	const right: string[] = [];
	tiers.forEach(([hw, y0], i) => {
		const y1 = i + 1 < tiers.length ? tiers[i + 1][1] : 0.88;
		const yb = h - y0 * h;
		const yt = h - y1 * h;
		left.push(`L ${cx - hw * w} ${yb} L ${cx - hw * w} ${yt}`);
		right.unshift(`L ${cx + hw * w} ${yt} L ${cx + hw * w} ${yb}`);
	});
	return `M ${cx - 0.5 * w} ${h} ${left.join(' ')} L ${cx - 0.02 * w} ${h * 0.12} L ${cx} 0 L ${cx + 0.02 * w} ${h * 0.12} ${right.join(' ')} Z`;
};

const BuildingShape: React.FC<{b: Building; fill: string; detail: string}> = ({b, fill, detail}) => {
	const {w, h, kind} = b;
	if (kind === 'burj') {
		return (
			<>
				<path d={burjPath(w, h)} fill={fill} />
				<path d={`M ${w / 2} ${h * 0.14} L ${w / 2} ${h}`} stroke={detail} strokeWidth={3} opacity={0.5} />
			</>
		);
	}
	if (kind === 'arab') {
		return (
			<>
				<path d={`M ${w * 0.12} ${h} L ${w * 0.12} ${h * 0.08} Q ${w * 1.05} ${h * 0.2} ${w * 0.95} ${h} Z`} fill={fill} />
				<path d={`M ${w * 0.12} ${h * 0.08} L ${w * 0.12} 0`} stroke={fill} strokeWidth={6} />
				{[0.3, 0.45, 0.6, 0.75].map((r) => (
					<path key={r} d={`M ${w * 0.14} ${h * r} Q ${w * 0.6} ${h * (r + 0.03)} ${w * (0.82 + r * 0.1)} ${h * (r + 0.06)}`} stroke={detail} strokeWidth={3} fill="none" opacity={0.5} />
				))}
			</>
		);
	}
	if (kind === 'frame') {
		return <path d={`M 0 ${h} L 0 0 L ${w} 0 L ${w} ${h} L ${w - 26} ${h} L ${w - 26} 30 L 26 30 L 26 ${h} Z`} fill={fill} />;
	}
	if (kind === 'twist') {
		return (
			<>
				<path d={`M 0 ${h} C ${w * 0.1} ${h * 0.6}, ${-w * 0.05} ${h * 0.3}, ${w * 0.2} 0 L ${w * 0.8} 0 C ${w * 1.05} ${h * 0.3}, ${w * 0.9} ${h * 0.6}, ${w} ${h} Z`} fill={fill} />
			</>
		);
	}
	return (
		<>
			<rect x={0} y={0} width={w} height={h} rx={6} fill={fill} />
			{new Array(Math.floor(h / 46)).fill(0).map((_, i) => (
				<rect key={i} x={w * 0.18} y={24 + i * 46} width={w * 0.64} height={6} rx={3} fill={detail} opacity={0.45} />
			))}
		</>
	);
};

/** Dubai skyline whose buildings grow from the ground with a staggered spring. */
export const Skyline: React.FC<{
	frame: number;
	start: number;
	ground: number;
	fill: string;
	detail: string;
	scale?: number;
	offsetX?: number;
	order?: 'center' | 'left';
}> = ({frame, start, ground, fill, detail, scale = 1, offsetX = 0, order = 'center'}) => (
	<>
		{SKYLINE.map((b, i) => {
			const delay = order === 'center' ? Math.round(Math.abs(b.x + b.w / 2 - 760) / 60) : i * 2;
			const g = springAt(frame, FPS, start + delay, SPRINGS.soft);
			const w = b.w * scale;
			const h = b.h * scale;
			return (
				<svg
					key={i}
					width={w}
					height={h}
					viewBox={`0 0 ${b.w} ${b.h}`}
					style={{
						position: 'absolute',
						left: offsetX + b.x * scale,
						top: ground - h,
						overflow: 'visible',
						transform: `scaleY(${g})`,
						transformOrigin: '50% 100%',
					}}
				>
					<BuildingShape b={b} fill={fill} detail={detail} />
				</svg>
			);
		})}
	</>
);

export const Palm: React.FC<{x: number; ground: number; h: number; color?: string; sway?: number}> = ({x, ground, h, color = '#0F7A6A', sway = 0}) => (
	<svg width={h * 0.9} height={h} viewBox="0 0 90 100" style={{position: 'absolute', left: x - h * 0.45, top: ground - h, overflow: 'visible'}}>
		<path d="M46 100 C44 70 48 45 45 26" stroke="#8A5A2B" strokeWidth={5} fill="none" strokeLinecap="round" />
		<g transform={`rotate(${sway} 45 26)`}>
			{[-150, -115, -70, -30, 10].map((a, i) => (
				<path key={i} d="M45 26 C55 18 72 18 84 28 C70 24 58 26 45 30 Z" fill={color} transform={`rotate(${a + 90} 45 26)`} />
			))}
		</g>
	</svg>
);

/** Sea band with animated sparkles. */
export const Sea: React.FC<{y: number; h: number; frame: number}> = ({y, h, frame}) => (
	<div style={{position: 'absolute', left: 0, right: 0, top: y, height: h, background: `linear-gradient(180deg, #4FD3E0 0%, ${BRAND.turquoise} 45%, #1AA6BE 100%)`, overflow: 'hidden'}}>
		{new Array(14).fill(0).map((_, i) => {
			const lx = ((random(`sea-x-${i}`) * 1300 + frame * (1 + random(`sea-v-${i}`))) % 1300) - 100;
			const ly = random(`sea-y-${i}`) * (h - 10);
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: lx,
						top: ly,
						width: 40 + random(`sea-w-${i}`) * 80,
						height: 5,
						borderRadius: 3,
						background: 'rgba(255,255,255,0.7)',
						opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + i * 9) / 14)),
					}}
				/>
			);
		})}
	</div>
);

/* ------------------------------------------------------------------ */
/* Vehicles                                                            */
/* ------------------------------------------------------------------ */

/** Side-view airliner (flat). Faces right. */
export const Airliner: React.FC<{w: number; style?: React.CSSProperties}> = ({w, style}) => (
	<svg width={w} height={w * 0.42} viewBox="0 0 500 210" style={{overflow: 'visible', ...style}}>
		<path d="M150 120 L250 120 L180 205 L140 205 Z" fill="#D9E4F7" />
		<path d="M30 95 C30 80 60 72 110 72 L420 72 C470 72 498 90 498 105 C498 120 470 132 420 132 L80 132 C50 132 30 115 30 95 Z" fill="#FFFFFF" />
		<path d="M420 72 C470 72 498 90 498 105 L440 105 C440 90 432 78 420 72 Z" fill="#E8EEF9" />
		<path d="M30 95 L0 20 L45 20 L110 72 Z" fill={BRAND.royal} />
		<path d="M60 128 L20 160 L55 160 L110 128 Z" fill={BRAND.royal} />
		<path d="M150 108 L280 108 L190 30 L160 30 Z" fill="#D9E4F7" />
		<path d="M110 132 L420 132 C450 132 470 125 485 115 L110 115 Z" fill={BRAND.royal} opacity={0.9} />
		{new Array(12).fill(0).map((_, i) => (
			<rect key={i} x={150 + i * 21} y={88} width={11} height={13} rx={4} fill={BRAND.navy} opacity={0.75} />
		))}
		<path d="M455 86 L478 86 C486 90 490 95 491 100 L458 100 Z" fill={BRAND.navy} opacity={0.85} />
		<circle cx="18" cy="50" r="7" fill={BRAND.yellow} />
	</svg>
);

/** Side-view premium black sedan. Faces right. Wheels spin with `wheel` (deg). */
export const Sedan: React.FC<{w: number; wheel: number; sheen: number}> = ({w, wheel, sheen}) => (
	<svg width={w} height={w * 0.36} viewBox="0 0 600 216" style={{overflow: 'visible'}}>
		<defs>
			<linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#3A4152" />
				<stop offset="0.35" stopColor="#141821" />
				<stop offset="1" stopColor="#05070B" />
			</linearGradient>
			<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#6E8BB8" />
				<stop offset="1" stopColor="#1C2A44" />
			</linearGradient>
			<linearGradient id="sheen" x1="0" x2="1">
				<stop offset="0" stopColor="#fff" stopOpacity="0" />
				<stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
				<stop offset="1" stopColor="#fff" stopOpacity="0" />
			</linearGradient>
			<clipPath id="body-clip">
				<path d="M20 150 C18 120 40 104 90 98 L170 92 C200 60 240 40 300 38 L390 38 C430 40 465 62 495 92 L555 100 C585 106 595 126 592 150 L590 168 L22 168 Z" />
			</clipPath>
		</defs>
		<ellipse cx="300" cy="200" rx="290" ry="14" fill="rgba(7,19,55,0.28)" />
		<path d="M20 150 C18 120 40 104 90 98 L170 92 C200 60 240 40 300 38 L390 38 C430 40 465 62 495 92 L555 100 C585 106 595 126 592 150 L590 168 L22 168 Z" fill="url(#paint)" />
		<path d="M188 92 C212 66 245 52 298 50 L330 50 L330 92 Z" fill="url(#glass)" />
		<path d="M342 50 L388 50 C420 52 448 68 472 92 L342 92 Z" fill="url(#glass)" />
		<path d="M60 118 L560 118" stroke="#C9D2E3" strokeWidth={2} opacity={0.5} />
		<rect x="560" y="112" width="26" height="10" rx="4" fill="#E8F0FF" />
		<rect x="24" y="116" width="18" height="10" rx="4" fill="#E0464E" />
		<g clipPath="url(#body-clip)">
			<rect x={-200 + sheen * 900} y="0" width="140" height="216" fill="url(#sheen)" transform="skewX(-20)" />
		</g>
		{[140, 470].map((cx) => (
			<g key={cx} transform={`translate(${cx} 168)`}>
				<circle r="44" fill="#0B0D12" />
				<circle r="30" fill="#AEB8C8" />
				<g transform={`rotate(${wheel})`}>
					{[0, 72, 144, 216, 288].map((a) => (
						<rect key={a} x="-4" y="-28" width="8" height="24" rx="3" fill="#E9EEF6" transform={`rotate(${a})`} />
					))}
				</g>
				<circle r="7" fill="#5B6577" />
			</g>
		))}
	</svg>
);

/* ------------------------------------------------------------------ */
/* Postcard illustrations (scene 5)                                    */
/* ------------------------------------------------------------------ */

export const PostcardArt: React.FC<{kind: 'city' | 'desert' | 'sea'; frame: number}> = ({kind, frame}) => {
	if (kind === 'city') {
		return (
			<svg width="100%" height="100%" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
				<rect width="400" height="520" fill="#9FD8FF" />
				<circle cx="300" cy="120" r="46" fill={BRAND.yellow} />
				<path d={burjPath(110, 430)} fill={BRAND.royal} transform="translate(145 40)" />
				<rect x="40" y="250" width="60" height="220" rx="5" fill="#5C86E6" />
				<rect x="280" y="230" width="70" height="240" rx="5" fill="#5C86E6" />
				<rect x="105" y="320" width="45" height="150" rx="5" fill="#7FA3E8" />
				<rect x="0" y="470" width="400" height="50" fill={BRAND.turquoise} />
			</svg>
		);
	}
	if (kind === 'desert') {
		const sun = 150 + Math.sin(frame / 30) * 6;
		return (
			<svg width="100%" height="100%" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
				<rect width="400" height="520" fill="#FFE7B0" />
				<circle cx="270" cy={sun} r="56" fill="#FFC21A" />
				<path d="M0 360 C90 290 180 300 260 350 C320 310 370 300 400 320 L400 520 L0 520 Z" fill="#F4B35A" />
				<path d="M0 420 C110 370 210 380 300 430 C340 410 380 405 400 410 L400 520 L0 520 Z" fill="#E8973A" />
				<path d="M0 480 C120 450 260 455 400 480 L400 520 L0 520 Z" fill="#D9822C" />
				<g transform="translate(150 372)">
					<path d="M0 0 C10 -18 22 -18 30 -6 C36 -20 50 -22 58 -8 L66 -12 L70 -2 L62 4 L60 30 L54 30 L52 8 L14 8 L12 30 L6 30 L4 8 Z" fill="#7A4A1E" />
				</g>
			</svg>
		);
	}
	const boat = Math.sin(frame / 12) * 3;
	return (
		<svg width="100%" height="100%" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
			<rect width="400" height="520" fill="#BDEBFF" />
			<circle cx="90" cy="110" r="40" fill="#FFD95A" />
			<rect x="0" y="300" width="400" height="220" fill={BRAND.turquoise} />
			{[330, 380, 430, 480].map((y, i) => (
				<path key={y} d={`M ${20 + i * 30} ${y} q 30 -10 60 0 t 60 0`} stroke="#fff" strokeWidth="5" fill="none" opacity="0.7" strokeLinecap="round" />
			))}
			<g transform={`translate(120 ${235 + boat})`}>
				<path d="M0 60 L180 60 L160 92 L20 92 Z" fill="#8A5A2B" />
				<path d="M90 60 L90 -40" stroke="#5B3A1A" strokeWidth="6" />
				<path d="M96 -36 L170 50 L96 50 Z" fill="#FFFFFF" />
				<path d="M84 -20 L30 50 L84 50 Z" fill="#FFF3D6" />
			</g>
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* UI pieces                                                           */
/* ------------------------------------------------------------------ */

export const TileIcon: React.FC<{kind: 'vols' | 'visa' | 'hotel' | 'dates'; size: number; p: number}> = ({kind, size, p}) => {
	if (kind === 'vols') {
		return (
			<svg width={size} height={size} viewBox="0 0 24 24" style={{transform: `translate(${(1 - p) * -10}px, ${(1 - p) * 10}px) rotate(45deg)`}}>
				<path d={PLANE_PATH} fill="#2F80ED" />
			</svg>
		);
	}
	if (kind === 'visa') {
		return (
			<svg width={size} height={size} viewBox="0 0 48 48" style={{transform: `scale(${interpolate(p, [0, 0.6, 1], [0.5, 1.12, 1])})`}}>
				<rect x="10" y="4" width="28" height="40" rx="5" fill="#16A085" />
				<circle cx="24" cy="20" r="8" fill="none" stroke="#fff" strokeWidth="2.2" />
				<ellipse cx="24" cy="20" rx="3.4" ry="8" fill="none" stroke="#fff" strokeWidth="1.8" />
				<path d="M16 20 H32" stroke="#fff" strokeWidth="1.8" />
				<rect x="17" y="34" width="14" height="3" rx="1.5" fill="#fff" />
			</svg>
		);
	}
	if (kind === 'hotel') {
		return (
			<svg width={size} height={size} viewBox="0 0 48 48">
				<rect x="8" y="6" width="22" height="38" rx="2" fill="#F2A52B" />
				<rect x="29" y="18" width="12" height="26" rx="2" fill="#F7B955" />
				{new Array(9).fill(0).map((_, i) => (
					<rect key={i} x={12 + (i % 3) * 5.5} y={11 + Math.floor(i / 3) * 7} width="3.5" height="4" rx="0.8" fill="#FFF6DF" opacity={prog(p, i / 12, 0.2, EASE.outQuint) * 0.8 + 0.2} />
				))}
				<rect x="16" y="35" width="6" height="9" rx="1" fill="#FFF1D2" />
			</svg>
		);
	}
	return (
		<svg width={size} height={size} viewBox="0 0 48 48">
			<rect x="6" y="9" width="36" height="34" rx="6" fill="#fff" stroke="#E3517B" strokeWidth="3.5" />
			<path d="M6 16 a7 7 0 0 1 7 -7 h22 a7 7 0 0 1 7 7 v4 H6 Z" fill="#E3517B" />
			<rect x="14" y="4" width="4" height="9" rx="2" fill="#E3517B" />
			<rect x="30" y="4" width="4" height="9" rx="2" fill="#E3517B" />
			<path d="M16 31 L21.5 36 L32 25" fill="none" stroke={BRAND.success} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
		</svg>
	);
};
