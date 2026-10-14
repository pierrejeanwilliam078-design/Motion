import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT_FAMILY} from '../../components/BrandTypography';
import {SpeedLines} from '../../components/MotionGraphics';
import {EASE, keyframes, prog, springAt, SPRINGS} from '../../motion/presets';
import {CUES, FPS} from '../../timeline';
import {Palm, Sedan, Skyline, Sky, Sun} from '../Illustrations';
import {MascotPuppet} from '../MascotPuppet';

/** V2 · 04 — Private transfer (00:14–00:19.2): flat city road, premium sedan glides in. */
export const V2Scene04Transfer: React.FC<{f: number}> = ({f}) => {
	// Car drive-in with a soft stop and suspension settle.
	const drive = prog(f, 414, 52, EASE.outQuint);
	const carX = -900 + drive * 1170;
	const dist = carX + 900;
	const settle = Math.sin(Math.max(0, f - 462) / 3) * Math.exp(-Math.max(0, f - 462) / 8) * 6;
	const speed = 1 - drive;
	const scroll = drive * 1400; // world scroll while the car moves

	const sheen = prog(f, CUES.s4Phrase2 + 14, 30, EASE.inOutSine);
	const sheen2 = prog(f, CUES.s4Phrase3 + 18, 30, EASE.inOutSine);
	const chip = springAt(f, FPS, CUES.s4Phrase1 + 4, SPRINGS.soft);
	const cam = keyframes(f, [412, 584], [1.0, 1.05], EASE.inOutSine);

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${cam})`}}>
				<Sky top="#93D2FF" bottom="#F2F9FF" />
				<Sun x={860} y={250} r={70} p={1} />
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${-scroll * 0.15}px)`}}>
					<Skyline frame={f} start={-200} ground={1310} fill="#A9C2F2" detail="#FFFFFF" scale={0.85} offsetX={60} />
				</div>
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${-scroll * 0.35}px)`}}>
					{[0, 260, 520, 780, 1040, 1300, 1560].map((x) => (
						<Palm key={x} x={x + 60} ground={1320} h={360} color="#13866F" sway={Math.sin((f + x) / 20) * 2} />
					))}
				</div>
				{/* Road */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 1300, height: 300, background: 'linear-gradient(180deg, #3A4050, #262B37)'}} />
				<div style={{position: 'absolute', left: 0, right: 0, top: 1300, height: 10, background: '#F2F5FA'}} />
				{new Array(9).fill(0).map((_, i) => {
					const x = ((i * 220 - scroll) % 1980 + 1980) % 1980 - 300;
					return <div key={i} style={{position: 'absolute', left: x, top: 1446, width: 120, height: 12, borderRadius: 6, background: '#FFFFFF', opacity: 0.85}} />;
				})}
				{/* Sidewalk */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 1600, bottom: 0, background: 'linear-gradient(180deg, #EEF2FA, #DCE4F2)'}} />
				<div style={{position: 'absolute', left: 0, right: 0, top: 1600, height: 16, background: '#C3CDE0'}} />

				{speed > 0.08 ? <SpeedLines frame={f} start={414} count={6} area={{x: -200, y: 1290, w: 900, h: 250}} color={BRAND.royalBright} seed="v2car" /> : null}
				<div style={{position: 'absolute', left: carX, top: 1268 + settle}}>
					<Sedan w={760} wheel={(dist / (Math.PI * 88)) * 360} sheen={Math.max(sheen, sheen2)} />
				</div>

				<MascotPuppet pose="thumbs" frame={f} x={235} bottom={1890} height={720} enterAt={CUES.s4Phrase2 - 2} enterFrom="scale" blinks={[506, 560]} sway={1.8} />

				{/* Label chip */}
				<div
					style={{
						position: 'absolute',
						left: 540,
						top: 420,
						transform: `translate(-50%, 0) translateY(${(1 - chip) * 60}px) scale(${0.8 + 0.2 * chip})`,
						opacity: chip,
						display: 'flex',
						alignItems: 'center',
						gap: 18,
						padding: '30px 54px',
						borderRadius: 999,
						background: '#fff',
						boxShadow: '0 20px 40px rgba(7,19,55,0.18)',
						fontFamily: FONT_FAMILY,
						whiteSpace: 'nowrap',
					}}
				>
					<div style={{width: 18, height: 18, borderRadius: 9, background: BRAND.yellow, boxShadow: `0 0 0 6px rgba(255,194,26,0.3)`}} />
					<span style={{fontSize: 72, fontWeight: 800, color: BRAND.navy}}>Transfert privé</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
