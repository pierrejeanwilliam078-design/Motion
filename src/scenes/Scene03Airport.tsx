import React from 'react';
import passportTrack from '../data/passportTrack.json';
import {BrandPin, CheckBadge, LightSweep, Ripple, RouteLine, SoftGlow, Sparkle} from '../components/MotionGraphics';
import {SceneStage} from '../components/SceneStage';
import {useSceneClock} from '../components/useSceneClock';
import {EASE, keyframes, prog} from '../motion/presets';
import {CUES, SCENES} from '../timeline';

const PASSPORT = passportTrack as unknown as Record<string, [number, number, number]>;

/**
 * SCENE 03 — AIRPORT & TRAVEL (00:09 – 00:14)
 * Original airport shot, no smartphone.
 * Forward dolly, flight path drawn behind the mascot, passport & boarding pass
 * emphasised with a halo (behind the hand) and a check badge (in front).
 */
export const Scene03Airport: React.FC = () => {
	const scene = SCENES.s3;
	const {abs, src} = useSceneClock(scene);

	const scale = keyframes(abs, [scene.from, scene.to], [1.03, 1.11], EASE.inOut);
	const y = keyframes(abs, [scene.from, scene.to], [0, 18], EASE.inOut);
	const x = keyframes(abs, [scene.from, scene.to], [-8, 10], EASE.inOutSine);

	// Flight path, drawn on the first sentence.
	const head = prog(abs, CUES.s3Phrase1 - 4, 62, EASE.inOut);
	const routeOut = prog(abs, 392, 20, EASE.inOutSine);
	const pinPop = prog(abs, CUES.s3Phrase1 + 54, 14, EASE.backOut);
	const pinRipple = prog(abs, CUES.s3Phrase1 + 60, 26, EASE.outQuint);
	const P0 = {x: 1010, y: 790};
	const P1 = {x: 900, y: 520};
	const P2 = {x: 640, y: 300};
	const P3 = {x: 250, y: 205};

	// Passport emphasis.
	const key = String(Math.round(Math.min(415, Math.max(277, src))));
	const [px, py, ps] = PASSPORT[key] ?? [830, 1080, 1];
	const halo = prog(abs, 298, 18, EASE.inOutSine) * (1 - prog(abs, 396, 18, EASE.inOutSine));
	const haloPulse = 0.75 + 0.25 * Math.sin((abs - 298) / 7);
	const badge = prog(abs, 312, 16, EASE.outQuint);
	const spark = prog(abs, 314, 22, EASE.outQuint);

	// Window light streak (depth on glass and lights).
	const streak = prog(abs, 296, 70, EASE.inOutSine);

	const behind = (
		<>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 780, overflow: 'hidden'}}>
				<LightSweep p={streak} angle={28} width={320} intensity={0.32} travel={[-500, 1400]} />
			</div>
			<RouteLine p0={P0} p1={P1} p2={P2} p3={P3} head={head} opacity={1 - routeOut} planeSize={58} />
			<div style={{position: 'absolute', left: P3.x, top: P3.y, opacity: 1 - routeOut}}>
				<Ripple x={0} y={6} p={pinRipple} radius={70} ellipse={0.4} width={3} />
				<div style={{position: 'absolute', left: -18, top: -48, transform: `scale(${pinPop})`, transformOrigin: '50% 100%'}}>
					<BrandPin height={52} style={{filter: 'drop-shadow(0 6px 10px rgba(7,19,55,0.35))'}} />
				</div>
			</div>
			<SoftGlow x={px} y={py - 40 * ps} r={210 * ps} opacity={halo * haloPulse * 0.8} />
		</>
	);

	const front = (
		<>
			<div style={{position: 'absolute', left: px + 92 * ps - 23, top: py - 100 * ps - 23}}>
				<CheckBadge size={46} p={badge} />
			</div>
			{[
				{dx: -150, dy: -150, s: 22, d: 0},
				{dx: 165, dy: 40, s: 16, d: 4},
				{dx: -120, dy: 110, s: 14, d: 8},
			].map((sp, i) => {
				const t = prog(abs, 314 + sp.d, 22, EASE.outQuint);
				return (
					<Sparkle
						key={i}
						size={sp.s * ps}
						color="#FFD95A"
						opacity={spark > 0 ? Math.sin(Math.PI * t) : 0}
						rotate={t * 45}
						style={{position: 'absolute', left: px + sp.dx * ps - sp.s / 2, top: py + sp.dy * ps - sp.s / 2, transform: `scale(${0.5 + t})`}}
					/>
				);
			})}
		</>
	);

	return <SceneStage srcFrame={src} camera={{scale, x, y}} bgBlur={1.3} behind={behind} front={front} />;
};
