import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile} from 'remotion';
import {bell, clamp, easeInOut, easeOut, springAt, tween} from '../lib/anim';
import {idleLife, LAYERS, Scene2D} from '../lib/Scene2D';
import {Glint, MaskedGlow, MaskedSweep} from '../components/Fx';
import {PhoneUI} from '../components/PhoneUI';
import {CUE, HEIGHT, SCENE, WIDTH} from '../timeline';

type SceneProps = {frame: number};

// ---------------------------------------------------------------------------
// SCÈNE 1 — BIENVENUE À DUBAÏ (0:00 – 0:04) — tenue traditionnelle
// ---------------------------------------------------------------------------
export const Scene1: React.FC<SceneProps> = ({frame: f}) => {
	const t = f / 30;
	const camera = {
		zoom: tween(f, [0, 128], [0.965, 1.06], Easing.out(Easing.quad)),
		panX: tween(f, [0, 128], [16, 0], easeInOut),
		panY: tween(f, [0, 128], [0, -18], easeInOut),
		ox: 0.5,
		oy: 0.56,
	};
	// salut de la main : oscillation douce autour de la pose d'origine
	const waveEnv = interpolate(f, [6, 16, 66, 84], [0, 1, 1, 0], clamp);
	const hand = {rotate: 9 * Math.sin(2 * Math.PI * 2.1 * (t - 0.2)) * waveEnv};
	// la valise suit le mouvement avec un léger retard
	const caseT = {rotate: 0.7 * Math.sin(2 * Math.PI * 1.9 * t - 0.9)};
	const life = {...idleLife(f, {walk: true}), x: tween(f, [0, 120], [-8, 8], easeInOut)};
	const flare = 0.22 + 0.06 * Math.sin(t * 2.2);

	return (
		<Scene2D
			layer="s1_dubai"
			camera={camera}
			life={life}
			parts={{hand, case: caseT}}
			bgFx={
				<AbsoluteFill
					style={{
						background: 'radial-gradient(circle at 82% 6%, rgba(255,255,255,0.95) 0%, rgba(210,235,255,0.45) 14%, rgba(255,255,255,0) 38%)',
						mixBlendMode: 'screen',
						opacity: flare,
					}}
				/>
			}
		/>
	);
};

/** Ouverture cinématographique : fente lumineuse qui s'ouvre + exposition qui se stabilise. */
export const OpeningReveal: React.FC<{frame: number; children: React.ReactNode}> = ({frame: f, children}) => {
	const open = tween(f, [0, 13], [0, 1], Easing.out(Easing.exp));
	const bar = (HEIGHT / 2) * (1 - open);
	const expo = tween(f, [0, 20], [1.55, 1], easeOut);
	const blur = tween(f, [0, 14], [10, 0], easeOut);
	const scale = tween(f, [0, 24], [1.08, 1], easeOut);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill
				style={{
					filter: f < 22 ? `brightness(${expo.toFixed(3)}) blur(${blur.toFixed(2)}px)` : undefined,
					transform: `scale(${scale.toFixed(4)})`,
				}}
			>
				{children}
			</AbsoluteFill>
			{bar > 0.5 ? (
				<>
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000'}} />
					<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000'}} />
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: HEIGHT / 2 - 3,
							height: 6,
							background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
							opacity: 1 - open,
							filter: 'blur(2px)',
						}}
					/>
				</>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------
// SCÈNE 2 — VOTRE VOYAGE EN QUELQUES CLICS (0:04 – 0:09)
// ---------------------------------------------------------------------------
export const Scene2: React.FC<SceneProps> = ({frame: f}) => {
	const s0 = SCENE.s2;
	const push = tween(f, [s0 + 6, s0 + 80], [0, 1], easeInOut);
	const drift = tween(f, [s0 + 80, s0 + 160], [0, 1], (x) => x);
	const camera = {
		zoom: 1 + 0.15 * push + 0.03 * drift,
		panX: -150 * push - 10 * drift,
		panY: 10 * push,
		ox: 0.62,
		oy: 0.47,
		rotY: tween(f, [s0 - 6, s0 + 22], [16, 0], easeOut),
	};
	const quad = LAYERS.s2_phone.screen as [number, number][];
	return (
		<Scene2D
			layer="s2_phone"
			camera={camera}
			parallax={0.5}
			life={idleLife(f, {amp: 0.5})}
			bgBlur={tween(f, [s0 + 10, s0 + 80], [0, 3.5], easeInOut)}
			fgFx={<PhoneUI frame={f} quad={quad} wake={s0 + 4} cards={CUE.cards} />}
		/>
	);
};

// ---------------------------------------------------------------------------
// SCÈNE 3 — ORGANISATION ET ACCOMPAGNEMENT (0:09 – 0:14) — aéroport, sans téléphone
// ---------------------------------------------------------------------------
export const Scene3: React.FC<SceneProps> = ({frame: f}) => {
	const s0 = SCENE.s3;
	const t = f / 30;
	const camera = {
		zoom: tween(f, [s0 - 10, s0 + 156], [1.0, 1.13], Easing.out(Easing.quad)),
		panX: tween(f, [s0 - 10, s0 + 156], [-10, 10], easeInOut),
		panY: tween(f, [s0 - 10, s0 + 156], [10, -16], easeInOut),
		ox: 0.5,
		oy: 0.58,
	};
	const P = CUE.passport;
	const pop = springAt(f, P, {damping: 9, stiffness: 180, mass: 0.6});
	const hold = interpolate(f, [P, P + 4, P + 22, P + 32], [0, 1, 1, 0], clamp);
	const pass = {scale: 1 + 0.075 * hold * Math.min(pop, 1.15), rotate: -3 * bell(f, P, P + 30)};
	const glint = interpolate(f, [P + 2, P + 20], [0, 1], clamp);
	const signPulse = 0.18 + 0.12 * (0.5 + 0.5 * Math.sin(t * 3.1));
	const floor = interpolate(f, [s0 - 10, s0 + 160], [0, 1], clamp);

	return (
		<Scene2D
			layer="s3_airport"
			camera={camera}
			life={idleLife(f, {walk: true})}
			parts={{pass}}
			partFx={{
				pass: (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							WebkitMaskImage: `url(${staticFile('images/s3_airport/pass.png')})`,
							WebkitMaskSize: '100% 100%',
							maskImage: `url(${staticFile('images/s3_airport/pass.png')})`,
							maskSize: '100% 100%',
							mixBlendMode: 'screen',
							opacity: bell(f, P + 1, P + 22),
							background: `linear-gradient(115deg, transparent ${glint * 150 - 45}%, rgba(255,255,255,0.95) ${glint * 150 - 30}%, transparent ${glint * 150 - 15}%)`,
						}}
					/>
				),
			}}
			bgFx={
				<>
					{/* panneaux lumineux de l'aéroport */}
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0.09 * HEIGHT,
							width: 0.22 * WIDTH,
							height: 0.2 * HEIGHT,
							background: 'radial-gradient(ellipse at 50% 50%, rgba(170,210,255,0.9), rgba(170,210,255,0) 70%)',
							mixBlendMode: 'screen',
							opacity: signPulse,
						}}
					/>
					{/* reflets qui glissent sur le sol */}
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0.62 * HEIGHT,
							bottom: 0,
							mixBlendMode: 'screen',
							opacity: 0.22,
							background: `linear-gradient(100deg, transparent ${floor * 120 - 30}%, rgba(255,255,255,0.8) ${floor * 120 - 18}%, transparent ${floor * 120 - 6}%)`,
							WebkitMaskImage: 'linear-gradient(transparent, black 30%)',
							maskImage: 'linear-gradient(transparent, black 30%)',
						}}
					/>
				</>
			}
		/>
	);
};

// ---------------------------------------------------------------------------
// SCÈNE 4 — TRANSFERT ET CONFORT (0:14 – 0:19) — voiture, sans téléphone
// ---------------------------------------------------------------------------
export const Scene4: React.FC<SceneProps> = ({frame: f}) => {
	const s0 = SCENE.s4;
	const t = f / 30;
	const camera = {
		zoom: tween(f, [s0 - 8, s0 + 156], [1.0, 1.12], Easing.out(Easing.quad)),
		panX: tween(f, [s0 - 8, s0 + 156], [10, -34], easeInOut),
		panY: tween(f, [s0 - 8, s0 + 156], [0, -10], easeInOut),
		ox: 0.72,
		oy: 0.55,
	};
	// la main présente la voiture : remontée douce jusqu'à la pose d'origine
	const present = springAt(f, s0 + 4, {damping: 13, stiffness: 95});
	const hand = {rotate: 13 * (1 - present) + 1.2 * Math.sin(2 * Math.PI * 0.8 * t) * present};
	const caseT = {rotate: 0.45 * Math.sin(2 * Math.PI * 1.1 * t + 0.5), y: -0.8 * Math.abs(Math.sin(2 * Math.PI * 1.1 * t))};
	return (
		<Scene2D
			layer="s4_car"
			camera={camera}
			parallax={0.6}
			life={idleLife(f, {walk: true, amp: 0.7})}
			parts={{hand, case: caseT}}
			bgFx={
				<>
					<MaskedGlow
						mask="images/s4_car/interior.png"
						color="rgba(255,244,222,1)"
						opacity={tween(f, [s0 + 2, s0 + 40], [0, 0.3], easeOut) + 0.04 * Math.sin(t * 2.5)}
					/>
					<MaskedSweep
						mask="images/s4_car/car_gloss.png"
						progress={tween(f, [s0 + 12, s0 + 70], [0, 1], easeInOut)}
						opacity={0.6}
						angle={112}
						width={9}
					/>
					<MaskedSweep
						mask="images/s4_car/car_gloss.png"
						progress={tween(f, [s0 + 92, s0 + 150], [0, 1], easeInOut)}
						opacity={0.38}
						angle={68}
						width={7}
					/>
				</>
			}
		/>
	);
};

// ---------------------------------------------------------------------------
// SCÈNE 5 — DUBAÏ À VOTRE RYTHME (0:19 – 0:25) — promenade, sans téléphone
// ---------------------------------------------------------------------------
export const scene5Camera = (f: number) => {
	const s0 = SCENE.s5;
	return {
		zoom: tween(f, [s0 - 6, SCENE.s6], [1.02, 1.12], easeInOut),
		panX: tween(f, [s0 - 6, SCENE.s6], [46, -18], (x) => x),
		panY: tween(f, [s0 - 6, SCENE.s6], [0, -12], easeInOut),
		ox: 0.45,
		oy: 0.55,
	};
};

export const scene5Parts = (f: number) => {
	const present = springAt(f, SCENE.s5 + 8, {damping: 12, stiffness: 90});
	const t = f / 30;
	return {
		hand: {rotate: 12 * (1 - present) + 1.5 * Math.sin(2 * Math.PI * 0.7 * t) * present},
		thumb: {rotate: 0},
	};
};

export const Scene5Water: React.FC<{frame: number}> = ({frame: f}) => {
	const t = f / 30;
	const pts = LAYERS.s5_walk.sparkles ?? [];
	return (
		<>
			<MaskedSweep
				mask="images/s5_walk/water.png"
				progress={(t * 0.35) % 1}
				opacity={0.28}
				angle={90}
				width={10}
			/>
			{pts.map(([x, y], i) => {
				const ph = (i * 0.618) % 1;
				const v = Math.max(0, Math.sin(2 * Math.PI * (t * (0.7 + (i % 3) * 0.18) + ph)));
				return <Glint key={i} x={x * WIDTH} y={y * HEIGHT} size={22 + (i % 4) * 7} opacity={Math.pow(v, 6) * 0.9} rotate={i * 17} />;
			})}
		</>
	);
};

export const Scene5: React.FC<SceneProps & {showFg?: boolean}> = ({frame: f, showFg = true}) => {
	return (
		<Scene2D
			layer="s5_walk"
			camera={scene5Camera(f)}
			parallax={0.45}
			life={idleLife(f, {walk: true})}
			parts={scene5Parts(f)}
			showFg={showFg}
			bgFx={<Scene5Water frame={f} />}
		/>
	);
};

