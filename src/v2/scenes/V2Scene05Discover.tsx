import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT_FAMILY} from '../../components/BrandTypography';
import {EASE, keyframes, prog, springAt, SPRINGS} from '../../motion/presets';
import {CUES, FPS} from '../../timeline';
import {PostcardArt} from '../Illustrations';
import {MascotPuppet} from '../MascotPuppet';

const CARDS = [
	{kind: 'city' as const, label: 'Découverte', at: CUES.s5Phrase1 + 2, x: 250, y: 610, rot: -9},
	{kind: 'desert' as const, label: 'Excursions', at: CUES.s5Phrase2 + 4, x: 540, y: 540, rot: 0},
	{kind: 'sea' as const, label: 'Liberté', at: CUES.s5Phrase2 + 28, x: 830, y: 610, rot: 9},
];

/** V2 · 05 — Discover Dubai (00:19.2–00:25.2): three illustrated postcards flip in. */
export const V2Scene05Discover: React.FC<{f: number}> = ({f}) => {
	const cam = keyframes(f, [568, 768], [1.0, 1.05], EASE.inOutSine);
	const fan = prog(f, CUES.s5Phrase3, 30, EASE.inOut);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #D7F5F8 0%, #F6FCFF 60%, #FFF6E2 100%)', overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 540 - 620, top: 580 - 620, width: 1240, height: 1240, borderRadius: '50%', border: '3px dashed rgba(31,79,209,0.18)', transform: `rotate(${f * 0.25}deg)`}} />
			<AbsoluteFill style={{transform: `scale(${cam})`}}>
				{CARDS.map((c, i) => {
					const s = springAt(f, FPS, c.at, SPRINGS.soft);
					if (s <= 0.001) {
						return null;
					}
					const spread = (i - 1) * 26 * fan;
					const float = Math.sin((f + i * 20) / 18) * 6;
					return (
						<div
							key={c.kind}
							style={{
								position: 'absolute',
								left: c.x - 200 + spread,
								top: c.y - 260 + float,
								width: 400,
								height: 520,
								transform: `perspective(1600px) rotateY(${(1 - s) * 90}deg) rotate(${c.rot * (1 + fan * 0.3)}deg) scale(${0.8 + 0.2 * s})`,
								zIndex: i === 1 ? 2 : 1,
							}}
						>
							<div style={{position: 'absolute', inset: 0, borderRadius: 34, background: '#fff', padding: 14, boxShadow: '0 30px 60px rgba(7,19,55,0.22)', boxSizing: 'border-box'}}>
								<div style={{width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden'}}>
									<PostcardArt kind={c.kind} frame={f} />
								</div>
							</div>
							<div
								style={{
									position: 'absolute',
									left: '50%',
									bottom: -34,
									transform: `translateX(-50%) scale(${prog(f, c.at + 8, 12, EASE.backOut)})`,
									padding: '12px 28px',
									borderRadius: 999,
									background: i === 1 ? BRAND.yellow : BRAND.royal,
									color: i === 1 ? BRAND.navy : '#fff',
									fontFamily: FONT_FAMILY,
									fontWeight: 800,
									fontSize: 34,
									whiteSpace: 'nowrap',
									boxShadow: '0 12px 24px rgba(7,19,55,0.22)',
								}}
							>
								{c.label}
							</div>
						</div>
					);
				})}
				<MascotPuppet pose="hero" frame={f} x={540} bottom={1880} height={860} enterAt={576} walk blinks={[640, 712]} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
