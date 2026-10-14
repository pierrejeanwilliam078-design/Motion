import React from 'react';
import {interpolate} from 'remotion';
import {clamp, easeOut, springAt, tween} from '../lib/anim';
import {quadMatrix3d, Pt} from '../lib/geometry';
import {COLORS, HEIGHT, WIDTH} from '../timeline';
import {FONT} from '../fonts';
import {PinIcon} from './Brand';

// Interface 2D « flat design », exclusivement en français.
const UI_W = 400;
const UI_H = 800;

const Icon = {
	vols: (
		<svg viewBox="0 0 24 24" width={72} height={72} style={{transform: 'rotate(45deg)'}}>
			<path
				fill="#1E88F0"
				d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
			/>
		</svg>
	),
	visa: (
		<svg viewBox="0 0 64 64" width={70} height={70}>
			<rect x={12} y={6} width={40} height={52} rx={6} fill="#12A08A" />
			<circle cx={32} cy={27} r={11} fill="none" stroke="#fff" strokeWidth={2.6} />
			<ellipse cx={32} cy={27} rx={4.8} ry={11} fill="none" stroke="#fff" strokeWidth={2.2} />
			<line x1={21} y1={27} x2={43} y2={27} stroke="#fff" strokeWidth={2.2} />
			<line x1={23} y1={21} x2={41} y2={21} stroke="#fff" strokeWidth={1.8} />
			<line x1={23} y1={33} x2={41} y2={33} stroke="#fff" strokeWidth={1.8} />
			<rect x={22} y={46} width={20} height={3.2} rx={1.6} fill="#fff" />
		</svg>
	),
	hebergement: (
		<svg viewBox="0 0 64 64" width={72} height={72}>
			<rect x={14} y={10} width={26} height={46} rx={3} fill="#F59E0B" />
			<rect x={40} y={24} width={12} height={32} rx={2} fill="#F7B23B" />
			{[0, 1, 2, 3].map((r) =>
				[0, 1, 2].map((c) => (
					<rect key={`${r}-${c}`} x={18 + c * 7} y={15 + r * 8} width={4.4} height={4.4} rx={1} fill="#fff" />
				)),
			)}
			{[0, 1, 2].map((r) => (
				<rect key={r} x={44} y={29 + r * 8} width={4.4} height={4.4} rx={1} fill="#fff" />
			))}
			<rect x={23} y={48} width={8} height={8} rx={1} fill="#fff" />
		</svg>
	),
	dates: (
		<svg viewBox="0 0 64 64" width={70} height={70}>
			<rect x={9} y={12} width={46} height={44} rx={7} fill="none" stroke="#E8436F" strokeWidth={4.5} />
			<path d="M9 19a7 7 0 0 1 7-7h32a7 7 0 0 1 7 7v6H9z" fill="#E8436F" />
			<rect x={19} y={6} width={5} height={12} rx={2.5} fill="#E8436F" />
			<rect x={40} y={6} width={5} height={12} rx={2.5} fill="#E8436F" />
			{[0, 1].map((r) =>
				[0, 1, 2].map((c) => (
					<rect key={`${r}-${c}`} x={18 + c * 10.5} y={32 + r * 10} width={7} height={6} rx={1.5} fill="#E8436F" />
				)),
			)}
		</svg>
	),
};

const CARDS = [
	{key: 'vols', label: 'Vols', bg: '#DDEBFF'},
	{key: 'visa', label: 'Visa', bg: '#D9F3EC'},
	{key: 'hebergement', label: 'Hébergement', bg: '#FFF0D4'},
	{key: 'dates', label: 'Dates', bg: '#FFE3EC'},
] as const;

type Props = {
	frame: number;
	quad: [number, number][]; // coins normalisés de l'écran (TL, TR, BR, BL)
	wake: number; // image d'allumage de l'écran
	cards: number[]; // images d'apparition des 4 cartes
};

export const PhoneUI: React.FC<Props> = ({frame, quad, wake, cards}) => {
	const q = quad.map(([x, y]) => [x * WIDTH, y * HEIGHT] as Pt) as [Pt, Pt, Pt, Pt];
	// léger débord pour recouvrir parfaitement l'écran d'origine
	const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
	const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
	const qq = q.map(([x, y]) => [cx + (x - cx) * 1.004, cy + (y - cy) * 1.004] as Pt) as [Pt, Pt, Pt, Pt];
	const matrix = quadMatrix3d(UI_W, UI_H, qq);

	const on = tween(frame, [wake, wake + 8], [0, 1], easeOut);
	const header = springAt(frame, wake + 4, {damping: 18});
	const title = springAt(frame, wake + 9, {damping: 18});
	const glass = interpolate(frame, [cards[3] + 18, cards[3] + 40], [0, 1], clamp);

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: UI_W,
				height: UI_H,
				transformOrigin: '0 0',
				transform: matrix,
				borderRadius: 40,
				overflow: 'hidden',
				background: '#0A0F1E',
				fontFamily: FONT,
			}}
		>
			<div style={{position: 'absolute', inset: 0, background: '#FFFFFF', opacity: on}}>
				{/* barre d'état */}
				<div style={{position: 'absolute', left: 38, top: 22, fontWeight: 700, fontSize: 19, color: '#111'}}>9:41</div>
				<div style={{position: 'absolute', left: UI_W / 2 - 62, top: 14, width: 124, height: 36, borderRadius: 18, background: '#0A0A0A'}} />
				<div style={{position: 'absolute', right: 30, top: 24, display: 'flex', gap: 6, alignItems: 'flex-end'}}>
					{[6, 9, 12, 15].map((h) => (
						<div key={h} style={{width: 4, height: h, borderRadius: 1, background: '#111'}} />
					))}
					<div style={{width: 26, height: 13, borderRadius: 4, border: '2px solid #111', marginLeft: 6, padding: 1.5}}>
						<div style={{width: '80%', height: '100%', borderRadius: 1.5, background: '#111'}} />
					</div>
				</div>

				{/* en-tête */}
				<div
					style={{
						position: 'absolute',
						left: 34,
						right: 34,
						top: 78,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						opacity: header,
						transform: `translateY(${(1 - header) * -14}px)`,
					}}
				>
					<div style={{display: 'flex', alignItems: 'flex-end', fontWeight: 800, fontSize: 25, color: COLORS.blue, letterSpacing: '0.01em'}}>
						<span>TIAV</span>
						<PinIcon height={24} style={{margin: '0 1px 2px'}} />
						<span>YAGES</span>
					</div>
					<div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
						{[0, 1, 2].map((i) => (
							<div key={i} style={{width: 24, height: 3, borderRadius: 2, background: COLORS.navy}} />
						))}
					</div>
				</div>

				{/* titre */}
				<div
					style={{
						position: 'absolute',
						left: 34,
						top: 140,
						fontWeight: 800,
						fontSize: 50,
						lineHeight: 1.05,
						color: COLORS.navy,
						letterSpacing: '-0.01em',
						opacity: title,
						transform: `translateY(${(1 - title) * 26}px)`,
					}}
				>
					Réserver
					<br />
					mon voyage
				</div>

				{/* cartes */}
				{CARDS.map((c, i) => {
					const col = i % 2;
					const row = Math.floor(i / 2);
					const s = springAt(frame, cards[i], {damping: 11, stiffness: 170, mass: 0.7});
					const iconS = springAt(frame, cards[i] + 3, {damping: 9, stiffness: 160, mass: 0.6});
					return (
						<div
							key={c.key}
							style={{
								position: 'absolute',
								left: 34 + col * 174,
								top: 300 + row * 212,
								width: 158,
								height: 196,
								borderRadius: 26,
								background: c.bg,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 16,
								opacity: Math.min(1, s * 1.6),
								transform: `scale(${s.toFixed(4)})`,
							}}
						>
							<div style={{transform: `scale(${iconS.toFixed(4)}) rotate(${((1 - iconS) * -18).toFixed(2)}deg)`}}>{Icon[c.key]}</div>
							<div style={{fontWeight: 700, fontSize: c.key === 'hebergement' ? 21 : 24, color: COLORS.navy}}>{c.label}</div>
						</div>
					);
				})}

				{/* reflet sur la vitre */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						opacity: Math.sin(glass * Math.PI) * 0.55,
						background: `linear-gradient(120deg, transparent ${glass * 140 - 40}%, rgba(255,255,255,0.9) ${glass * 140 - 25}%, transparent ${glass * 140 - 10}%)`,
						mixBlendMode: 'screen',
					}}
				/>
			</div>
		</div>
	);
};
