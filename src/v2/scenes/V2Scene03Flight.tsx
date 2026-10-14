import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {BRAND, FONT_FAMILY} from '../../components/BrandTypography';
import {BrandPin, PLANE_PATH} from '../../components/MotionGraphics';
import {EASE, prog, springAt, SPRINGS} from '../../motion/presets';
import {CUES, FPS} from '../../timeline';
import {Airliner, CloudLayer, Sky} from '../Illustrations';
import {MascotPuppet} from '../MascotPuppet';

/** V2 · 03 — In the sky (00:09–00:14): airliner, boarding pass, visa stamp. */
export const V2Scene03Flight: React.FC<{f: number}> = ({f}) => {
	// Airliner path: enters from the left, cruises, then accelerates away.
	const enter = prog(f, 262, 44, EASE.outQuint);
	const leave = prog(f, 392, 30, EASE.inQuart);
	const planeX = -760 + enter * 960 + leave * 1100;
	const planeY = 520 - enter * 90 - leave * 160 + Math.sin(f / 16) * 6;
	const planeRot = -4 - leave * 6 + Math.sin(f / 20) * 1.2;

	// Boarding pass.
	const card = springAt(f, FPS, CUES.s3Phrase1 - 2, SPRINGS.soft);
	const cardFloat = Math.sin(f / 18) * 5;
	const stamp = prog(f, CUES.s3Phrase2, 8, EASE.outExpo);
	const stampScale = interpolate(stamp, [0, 1], [1.8, 1]);

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Sky top="#6DBCFF" bottom="#EAF6FF" />
			<CloudLayer frame={f} count={4} y={[120, 900]} scale={[0.6, 0.9]} speed={-1.5} opacity={0.7} seed="s3a" />
			<CloudLayer frame={f} count={3} y={[300, 1300]} scale={[1.1, 1.5]} speed={-3.2} seed="s3b" />

			{/* Contrail */}
			<div
				style={{
					position: 'absolute',
					left: -40,
					top: planeY + 110,
					width: Math.max(0, planeX + 120),
					height: 0,
					borderTop: '8px dotted rgba(255,255,255,0.95)',
					transform: `rotate(${planeRot * 0.5}deg)`,
					transformOrigin: '100% 50%',
				}}
			/>
			<div style={{position: 'absolute', left: planeX, top: planeY, transform: `rotate(${planeRot}deg)`, filter: 'drop-shadow(0 24px 30px rgba(7,19,55,0.22))'}}>
				<Airliner w={640} />
			</div>

			{/* Boarding pass */}
			<div
				style={{
					position: 'absolute',
					left: 130,
					top: 770,
					width: 820,
					height: 340,
					transform: `perspective(1600px) translateY(${(1 - card) * 500 + cardFloat}px) rotateX(${(1 - card) * 50}deg) rotate(${-3 + (1 - card) * -10}deg)`,
					opacity: Math.min(1, card * 2),
					fontFamily: FONT_FAMILY,
				}}
			>
				<div style={{position: 'absolute', inset: 0, borderRadius: 34, background: '#fff', boxShadow: '0 34px 70px rgba(7,19,55,0.3)'}} />
				<div style={{position: 'absolute', left: 0, top: 0, width: 590, height: 70, borderRadius: '34px 0 0 0', background: BRAND.royal}} />
				<div style={{position: 'absolute', left: 590, top: 0, width: 230, height: 70, borderRadius: '0 34px 0 0', background: BRAND.navy}} />
				<div style={{position: 'absolute', left: 34, top: 18, fontSize: 26, fontWeight: 800, letterSpacing: '0.12em', color: '#fff'}}>CARTE D’EMBARQUEMENT</div>
				<div style={{position: 'absolute', left: 34, top: 100, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: '#8A97B8'}}>PASSAGER</div>
				<div style={{position: 'absolute', left: 34, top: 126, fontSize: 40, fontWeight: 800, color: BRAND.navy}}>VOUS</div>
				<div style={{position: 'absolute', left: 34, top: 196, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: '#8A97B8'}}>DESTINATION</div>
				<div style={{position: 'absolute', left: 30, top: 216, fontSize: 92, fontWeight: 800, color: BRAND.navy, lineHeight: 1}}>DXB</div>
				<div style={{position: 'absolute', left: 250, top: 248, display: 'flex', alignItems: 'center', gap: 10}}>
					<BrandPin height={40} />
					<span style={{fontSize: 38, fontWeight: 700, color: BRAND.royal}}>Dubaï</span>
				</div>
				<svg width="70" height="70" viewBox="0 0 24 24" style={{position: 'absolute', left: 470, top: 120, transform: 'rotate(90deg)'}}>
					<path d={PLANE_PATH} fill={BRAND.yellow} />
				</svg>
				{/* perforation */}
				<div style={{position: 'absolute', left: 588, top: 80, bottom: 18, borderLeft: '4px dashed #D5DDEE'}} />
				{new Array(16).fill(0).map((_, i) => (
					<div key={i} style={{position: 'absolute', left: 625 + i * 10, top: 250, width: i % 3 === 0 ? 6 : 3, height: 62, background: BRAND.navy}} />
				))}
				<div style={{position: 'absolute', left: 618, top: 112, width: 180, fontSize: 34, fontWeight: 800, lineHeight: 1.1, color: BRAND.navy}}>Bon voyage !</div>
				{/* Visa stamp */}
				{stamp > 0 ? (
					<div
						style={{
							position: 'absolute',
							left: 400,
							top: 150,
							width: 190,
							height: 190,
							borderRadius: '50%',
							border: `8px solid ${BRAND.success}`,
							boxShadow: `inset 0 0 0 5px #fff, inset 0 0 0 9px ${BRAND.success}`,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							color: BRAND.success,
							fontWeight: 800,
							transform: `rotate(-14deg) scale(${stampScale})`,
							opacity: Math.min(1, stamp * 2) * 0.92,
						}}
					>
						<div style={{fontSize: 46, letterSpacing: '0.08em'}}>VISA</div>
						<div style={{fontSize: 42, marginTop: -4}}>✓</div>
					</div>
				) : null}
			</div>

			<MascotPuppet pose="passport" frame={f} x={330} bottom={1890} height={700} enterAt={CUES.s3Phrase1 + 6} enterFrom="left" walk blinks={[330, 384]} />
			<CloudLayer frame={f} count={2} y={[1500, 1800]} scale={[1.6, 2.0]} speed={-6} seed="s3c" />
		</AbsoluteFill>
	);
};
