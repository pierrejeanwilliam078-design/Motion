import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {BRAND, FONT_FAMILY} from '../../components/BrandTypography';
import {CheckBadge, LightSweep} from '../../components/MotionGraphics';
import {EASE, keyframes, prog, springAt, SPRINGS} from '../../motion/presets';
import {CUES, FPS} from '../../timeline';
import {TileIcon} from '../Illustrations';
import {MaskWords} from '../KineticType';
import {MascotPuppet} from '../MascotPuppet';

const TILES = [
	{kind: 'vols' as const, label: 'Vols', chip: '#E3EEFF', at: CUES.s2Phrase1, x: 115, y: 330},
	{kind: 'visa' as const, label: 'Visa', chip: '#DDF4EE', at: CUES.s2Phrase2, x: 555, y: 330},
	{kind: 'hotel' as const, label: 'Hébergement', chip: '#FFF0D6', at: CUES.s2Phrase3, x: 115, y: 660},
	{kind: 'dates' as const, label: 'Dates', chip: '#FDE5EE', at: CUES.s2Phrase4, x: 555, y: 660},
];

/** V2 · 02 — Booking (00:04–00:09). Tiles fly in on each phrase of the voice-over. */
export const V2Scene02Booking: React.FC<{f: number}> = ({f}) => {
	const cam = keyframes(f, [112, 278], [1.0, 1.04], EASE.inOutSine);
	const sweep = prog(f, 232, 22, EASE.inOutSine);
	return (
		<AbsoluteFill style={{background: `linear-gradient(160deg, ${BRAND.royalBright} 0%, ${BRAND.royal} 45%, ${BRAND.navy} 100%)`, overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 2px, transparent 2.5px)',
					backgroundSize: '44px 44px',
					backgroundPosition: `${f * 0.4}px ${-f * 0.8}px`,
				}}
			/>
			<div style={{position: 'absolute', left: -260, top: 1100, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,194,26,0.22), rgba(255,194,26,0) 70%)'}} />
			<AbsoluteFill style={{transform: `scale(${cam})`}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 160}}>
					<MaskWords
						words={['Réserver', 'mon', 'voyage']}
						frame={f}
						start={122}
						stagger={3}
						style={{fontSize: 80, fontWeight: 800, color: '#fff', letterSpacing: '0.005em'}}
						wordStyle={(i) => (i === 2 ? {color: BRAND.yellow} : {})}
					/>
				</div>
				{TILES.map((t, i) => {
					const s = springAt(f, FPS, t.at, SPRINGS.soft);
					const check = prog(f, t.at + 10, 14, EASE.outQuint);
					const icon = prog(f, t.at + 4, 16, EASE.outQuint);
					const lift = Math.sin((f - t.at) / 16 + i) * 4 * s;
					if (s <= 0.001) {
						return null;
					}
					return (
						<div
							key={t.kind}
							style={{
								position: 'absolute',
								left: t.x,
								top: t.y,
								width: 410,
								height: 300,
								borderRadius: 40,
								background: '#FFFFFF',
								boxShadow: '0 30px 60px rgba(7,19,55,0.35)',
								transform: `perspective(1400px) translateY(${(1 - s) * 140 + lift}px) rotateX(${(1 - s) * 35}deg) rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg) scale(${0.7 + 0.3 * s})`,
								opacity: Math.min(1, s * 1.8),
								fontFamily: FONT_FAMILY,
								overflow: 'hidden',
							}}
						>
							<div style={{position: 'absolute', left: 40, top: 40, width: 120, height: 120, borderRadius: 34, background: t.chip, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<TileIcon kind={t.kind} size={78} p={icon} />
							</div>
							<div style={{position: 'absolute', left: 40, bottom: 38, fontSize: t.label.length > 8 ? 40 : 50, fontWeight: 800, color: BRAND.navy}}>{t.label}</div>
							<div style={{position: 'absolute', right: 30, top: 30}}>
								<CheckBadge size={52} p={check} />
							</div>
							<LightSweep p={sweep} angle={20} width={140} intensity={0.6} travel={[-300, 600]} blend="normal" />
						</div>
					);
				})}
				<MascotPuppet pose="phone" frame={f} x={540} bottom={1890} height={880} enterAt={120} blinks={[168, 226]} sway={1.4} />
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 990,
						display: 'flex',
						justifyContent: 'center',
						gap: 14,
						opacity: interpolate(f, [CUES.s2Phrase1, CUES.s2Phrase1 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					}}
				>
					{TILES.map((t) => (
						<div key={t.kind} style={{width: 46, height: 10, borderRadius: 5, background: f >= t.at + 10 ? BRAND.yellow : 'rgba(255,255,255,0.3)'}} />
					))}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
