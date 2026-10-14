import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, tween} from './lib/anim';
import {halfPlaneClip} from './lib/geometry';
import {DirBlur} from './components/Fx';
import {PlaneGlyph} from './components/Brand';
import {OpeningReveal, Scene1, Scene2, Scene3, Scene4} from './scenes/Scenes';
import {Finale} from './scenes/Finale';
import {FPS, HEIGHT, SCENE, SFX, VOICE, WIDTH} from './timeline';

// Fenêtres de transition (images) — 0,4 à 0,5 s, centrées sur les coupes musicales
const T1: [number, number] = [SCENE.s2 - 7, SCENE.s2 + 7]; // panoramique latéral
const T2: [number, number] = [SCENE.s3 - 8, SCENE.s3 + 8]; // passage d'avion
const T3: [number, number] = [SCENE.s4 - 7, SCENE.s4 + 7]; // zoom traversant
const T4: [number, number] = [SCENE.s5 - 7, SCENE.s5 + 7]; // panoramique vertical

const progress = (f: number, [a, b]: [number, number]) => tween(f, [a, b], [0, 1], easeInOut);

export const TiavoyagesAd: React.FC = () => {
	const f = useCurrentFrame();

	// ---- T1 : mouvement latéral de caméra (scène 1 → 2)
	const p1 = progress(f, T1);
	const blur1 = Math.sin(Math.PI * p1) * 34;

	// ---- T2 : avion stylisé + volet diagonal (scène 2 → 3)
	const p2 = interpolate(f, T2, [0, 1], {...clamp, easing: (x) => x});
	const start: [number, number] = [-260, HEIGHT + 260];
	const end: [number, number] = [WIDTH + 260, -260];
	const dir: [number, number] = [end[0] - start[0], end[1] - start[1]];
	const len = Math.hypot(dir[0], dir[1]);
	const u: [number, number] = [dir[0] / len, dir[1] / len];
	const planePos: [number, number] = [start[0] + dir[0] * p2, start[1] + dir[1] * p2];
	const angle = (Math.atan2(u[1], u[0]) * 180) / Math.PI;

	// ---- T3 : zoom traversant (scène 3 → 4)
	const p3 = progress(f, T3);

	// ---- T4 : mouvement vertical (scène 4 → 5)
	const p4 = progress(f, T4);
	const blur4 = Math.sin(Math.PI * p4) * 34;

	return (
		<AbsoluteFill style={{background: '#000'}}>
			{/* SCÈNE 1 */}
			{f < T1[1] ? (
				<AbsoluteFill style={{transform: `translateX(${(-p1 * WIDTH).toFixed(1)}px)`}}>
					<DirBlur id="b1a" x={blur1} y={0}>
						<OpeningReveal frame={f}>
							<Scene1 frame={f} />
						</OpeningReveal>
					</DirBlur>
				</AbsoluteFill>
			) : null}

			{/* SCÈNE 2 */}
			{f >= T1[0] && f < T2[1] ? (
				<AbsoluteFill
					style={{
						transform: `translateX(${((1 - p1) * WIDTH).toFixed(1)}px) scale(${(1 + 0.05 * tween(f, T2, [0, 1])).toFixed(4)})`,
					}}
				>
					<DirBlur id="b1b" x={blur1} y={0}>
						<Scene2 frame={f} />
					</DirBlur>
				</AbsoluteFill>
			) : null}

			{/* SCÈNE 3 (révélée derrière l'avion) */}
			{f >= T2[0] && f < T3[1] ? (
				<AbsoluteFill
					style={{
						clipPath: f < T2[1] ? halfPlaneClip(WIDTH, HEIGHT, planePos, u) : undefined,
					}}
				>
					<AbsoluteFill
						style={{
							transform: `scale(${(1.08 - 0.08 * tween(f, T2, [0, 1]) + 0.32 * p3).toFixed(4)})`,
							transformOrigin: '50% 52%',
							opacity: 1 - interpolate(f, [T3[0] + 3, T3[1] - 2], [0, 1], clamp),
							filter: p3 > 0.02 ? `blur(${(p3 * 14).toFixed(2)}px)` : undefined,
						}}
					>
						<Scene3 frame={f} />
					</AbsoluteFill>
				</AbsoluteFill>
			) : null}

			{/* avion + traînée de condensation */}
			{f >= T2[0] && f < T2[1] ? (
				<AbsoluteFill style={{pointerEvents: 'none'}}>
					<div
						style={{
							position: 'absolute',
							left: planePos[0] - 1400,
							top: planePos[1] - 70,
							width: 1400,
							height: 140,
							transformOrigin: '1400px 70px',
							transform: `rotate(${angle}deg)`,
							background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 70%, rgba(255,255,255,0.9) 100%)',
							filter: 'blur(14px)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							left: planePos[0] - 90,
							top: planePos[1] - 90,
							width: 180,
							height: 180,
							transform: `rotate(${angle + 90}deg)`,
							filter: 'drop-shadow(0 10px 18px rgba(11,36,99,0.35))',
						}}
					>
						<PlaneGlyph size={180} />
					</div>
				</AbsoluteFill>
			) : null}

			{/* SCÈNE 4 */}
			{f >= T3[0] && f < T4[1] ? (
				<AbsoluteFill
					style={{
						opacity: interpolate(f, [T3[0] + 3, T3[1] - 2], [0, 1], clamp),
						transform: `translateY(${(-p4 * HEIGHT).toFixed(1)}px) scale(${(0.86 + 0.14 * p3).toFixed(4)})`,
						filter: p3 < 0.98 ? `blur(${((1 - p3) * 10).toFixed(2)}px)` : undefined,
					}}
				>
					<DirBlur id="b4a" x={0} y={blur4}>
						<Scene4 frame={f} />
					</DirBlur>
				</AbsoluteFill>
			) : null}

			{/* SCÈNES 5 et 6 */}
			{f >= T4[0] ? (
				<AbsoluteFill style={{transform: `translateY(${((1 - p4) * HEIGHT).toFixed(1)}px)`}}>
					<DirBlur id="b4b" x={0} y={blur4}>
						<Finale frame={f} />
					</DirBlur>
				</AbsoluteFill>
			) : null}

			{/* éclair blanc très léger au cœur du zoom traversant */}
			<AbsoluteFill style={{background: '#fff', opacity: Math.sin(Math.PI * p3) * 0.18, pointerEvents: 'none'}} />

			<Soundtrack />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------
// BANDE-SON : musique (ducking sous la voix), voix off, effets
// ---------------------------------------------------------------------------
const MUSIC_BASE = 0.45;
const MUSIC_DUCK = 0.2;

const musicVolume = (frame: number) => {
	const t = frame / FPS;
	let duck = 0;
	for (const v of VOICE) {
		const [a, b] = v.speech;
		duck = Math.max(duck, interpolate(t, [a - 0.18, a, b, b + 0.3], [0, 1, 1, 0], clamp));
	}
	const fadeIn = interpolate(t, [0, 0.4], [0.6, 1], clamp);
	return (MUSIC_BASE - (MUSIC_BASE - MUSIC_DUCK) * duck) * fadeIn;
};

const Soundtrack: React.FC = () => (
	<>
		<Audio src={staticFile('audio/music/tiavoyages_theme.wav')} volume={musicVolume} />
		{VOICE.map((v) => (
			<Sequence key={v.file} from={Math.round(v.start * FPS)} layout="none">
				<Audio src={staticFile(v.file)} volume={1} />
			</Sequence>
		))}
		{SFX.map((s, i) => (
			<Sequence key={`${s.file}-${i}`} from={Math.max(0, s.at)} layout="none">
				<Audio src={staticFile(s.file)} volume={s.volume} />
			</Sequence>
		))}
	</>
);
