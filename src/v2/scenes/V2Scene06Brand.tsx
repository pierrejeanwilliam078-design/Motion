import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile} from 'remotion';
import {BRAND, RiseText} from '../../components/BrandTypography';
import {Ripple, Sparkle} from '../../components/MotionGraphics';
import {EASE, keyframes, prog, springAt, SPRINGS} from '../../motion/presets';
import {CUES, FPS} from '../../timeline';
import {MascotPuppet} from '../MascotPuppet';

const LOGO_W = 752;
const LOGO_H = 104;

/** V2 · 06 — Brand finale on royal blue (00:25.2–00:30). Original wordmark on a white ticket card. */
export const V2Scene06Brand: React.FC<{f: number}> = ({f}) => {
	const cam = keyframes(f, [744, 900], [1.05, 1.0], EASE.outQuint);
	const card = springAt(f, FPS, 762, SPRINGS.soft);
	const L = CUES.s6Phrase1 - 4;
	const tiav = prog(f, L, 18, EASE.outQuint);
	const yages = prog(f, L + 4, 18, EASE.outQuint);
	const pin = springAt(f, FPS, L + 10, SPRINGS.pop);
	const ripple = prog(f, L + 16, 24, EASE.outQuint);
	const ripple2 = prog(f, CUES.s6Phrase4, 26, EASE.outQuint);
	const glint = prog(f, CUES.s6Phrase4 - 4, 22, EASE.inOutSine);
	const bar = prog(f, CUES.s6Phrase3 - 8, 16, EASE.outQuint);
	const logoScale = 0.94;
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, ${BRAND.royalBright} 0%, ${BRAND.royal} 45%, ${BRAND.navy} 100%)`, overflow: 'hidden'}}>
			{/* Drifting pin pattern */}
			{new Array(18).fill(0).map((_, i) => {
				const x = random(`pp-x-${i}`) * 1080;
				const y = ((random(`pp-y-${i}`) * 2100 - (f - 744) * (1 + random(`pp-v-${i}`))) % 2100 + 2100) % 2100 - 100;
				const s = 26 + random(`pp-s-${i}`) * 30;
				return (
					<svg key={i} width={s} height={s * 1.3} viewBox="0 0 100 130" style={{position: 'absolute', left: x, top: y, opacity: 0.12}}>
						<path d="M50 128 C50 128 4 76 4 46 A46 46 0 0 1 96 46 C96 76 50 128 50 128 Z" fill="#fff" />
					</svg>
				);
			})}
			<AbsoluteFill style={{transform: `scale(${cam})`}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 180}}>
					<RiseText
						text="DUBAÏ À VOTRE FAÇON."
						frame={f}
						start={CUES.s6Phrase2 - 4}
						stagger={3}
						duration={20}
						style={{fontWeight: 800, fontSize: 70, color: '#fff', letterSpacing: '0.01em'}}
					/>
				</div>

				{/* White ticket card */}
				<div
					style={{
						position: 'absolute',
						left: 90,
						top: 1130,
						width: 900,
						height: 400,
						borderRadius: 48,
						background: '#fff',
						boxShadow: '0 40px 80px rgba(7,19,55,0.45)',
						transform: `translateY(${(1 - card) * 700}px) rotate(${(1 - card) * 6}deg)`,
					}}
				>
					<div style={{position: 'absolute', left: (900 - LOGO_W * logoScale) / 2, top: 92, width: LOGO_W * logoScale, height: LOGO_H * logoScale}}>
						<div style={{position: 'absolute', left: 0, top: 0, width: 279 * logoScale, height: LOGO_H * logoScale, overflow: 'hidden'}}>
							<Img src={staticFile('brand/wordmark-tiav.png')} style={{height: LOGO_H * logoScale, transform: `translateY(${(1 - tiav) * 110}%)`}} />
						</div>
						<div style={{position: 'absolute', left: 365 * logoScale, top: 0, width: 387 * logoScale, height: LOGO_H * logoScale, overflow: 'hidden'}}>
							<Img src={staticFile('brand/wordmark-yages.png')} style={{height: LOGO_H * logoScale, transform: `translateY(${(1 - yages) * 110}%)`}} />
						</div>
						<Ripple x={322 * logoScale} y={LOGO_H * logoScale - 4} p={ripple} radius={80} ellipse={0.3} color={BRAND.yellow} width={4} />
						<Ripple x={322 * logoScale} y={LOGO_H * logoScale - 4} p={ripple2} radius={66} ellipse={0.3} color={BRAND.royal} width={3} />
						<Img
							src={staticFile('brand/wordmark-pin.png')}
							style={{
								position: 'absolute',
								left: 279 * logoScale,
								top: 0,
								height: LOGO_H * logoScale,
								transform: `translateY(${(1 - pin) * -260}px)`,
								opacity: Math.min(1, pin * 3),
							}}
						/>
						<div
							style={{
								position: 'absolute',
								inset: 0,
								WebkitMaskImage: `url(${staticFile('brand/tiavoyages-wordmark.png')})`,
								WebkitMaskSize: '100% 100%',
								maskImage: `url(${staticFile('brand/tiavoyages-wordmark.png')})`,
								maskSize: '100% 100%',
								overflow: 'hidden',
							}}
						>
							{glint > 0 && glint < 1 ? (
								<div style={{position: 'absolute', top: -40, left: -200 + 1100 * glint, width: 110, height: 200, transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))'}} />
							) : null}
						</div>
					</div>
					<div style={{position: 'absolute', left: 450 - 80 * bar, top: 228, width: 160 * bar, height: 8, borderRadius: 4, background: BRAND.yellow}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 262}}>
						<RiseText text="Votre voyage, sur mesure." frame={f} start={CUES.s6Phrase3 - 4} stagger={2} duration={18} style={{fontWeight: 600, fontSize: 46, color: BRAND.royal}} />
					</div>
				</div>

				<MascotPuppet pose="thumbs" frame={f} x={540} bottom={1180} height={820} enterAt={752} enterFrom="below" blinks={[812, 870]} sway={1.4} shadow={false} />

				{[
					{x: 170, y: 520, s: 40, d: 0},
					{x: 880, y: 430, s: 30, d: 6},
					{x: 905, y: 900, s: 24, d: 12},
					{x: 150, y: 960, s: 22, d: 9},
				].map((sp, i) => {
					const t = prog(f, CUES.s6Phrase1 + sp.d, 26, EASE.outQuint);
					return (
						<Sparkle
							key={i}
							size={sp.s}
							color={BRAND.yellow}
							opacity={t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0}
							style={{position: 'absolute', left: sp.x, top: sp.y, transform: `scale(${interpolate(t, [0, 1], [0.4, 1.4])}) rotate(${t * 45}deg)`}}
						/>
					);
				})}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
