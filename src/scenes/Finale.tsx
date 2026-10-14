import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {clamp, dampedWave, easeOut, springAt, tween} from '../lib/anim';
import {BASE_SCALE, Camera, idleLife, LAYERS, Scene2D} from '../lib/Scene2D';
import {Wordmark} from '../components/Brand';
import {FONT} from '../fonts';
import {COLORS, CUE, HEIGHT, SCENE, WIDTH} from '../timeline';
import {Scene5, scene5Camera, scene5Parts} from './Scenes';

// Position finale de la mascotte sur l'écran de signature
const END_CENTER: [number, number] = [WIDTH / 2, 715];
const END_SCALE = 0.78;

/** Caméra exprimée sous la forme p' = s·p + T (origine 0,0) pour interpoler proprement. */
const toAffine = (c: Camera) => {
	const s = BASE_SCALE * c.zoom;
	const O = [c.ox * WIDTH, c.oy * HEIGHT];
	return {s, tx: O[0] * (1 - s) + c.panX, ty: O[1] * (1 - s) + c.panY};
};

// ---------------------------------------------------------------------------
// SCÈNE 5 → 6 : la mascotte quitte la promenade et rejoint l'écran de marque
// SCÈNE 6 — SIGNATURE DE MARQUE (0:25 – 0:30)
// ---------------------------------------------------------------------------
export const Finale: React.FC<{frame: number}> = ({frame: f}) => {
	const T0 = SCENE.s6 - 6; // début de la transition (pas de temps : 24,8 s)
	const box = LAYERS.s5_walk.box;
	const mc = [((box[0] + box[2]) / 2) * WIDTH, ((box[1] + box[3]) / 2) * HEIGHT];

	// --- mascotte : caméra interpolée entre le cadrage de la scène 5 et la position finale
	const a = toAffine(scene5Camera(Math.min(f, T0)));
	const endS = END_SCALE;
	const b = {s: endS, tx: END_CENTER[0] - endS * mc[0], ty: END_CENTER[1] - endS * mc[1]};
	const k = f < T0 + 5 ? 0 : springAt(f, T0 + 5, {damping: 17, stiffness: 85, mass: 0.9});
	const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * k);
	const cam: Camera = {
		zoom: s / BASE_SCALE,
		panX: a.tx + (b.tx - a.tx) * k,
		panY: a.ty + (b.ty - a.ty) * k,
		ox: 0,
		oy: 0,
	};
	const walk = idleLife(f, {walk: true});
	const idle = idleLife(f, {amp: 1.2});
	const w = Math.min(1, Math.max(0, k));
	const life = {
		sx: (walk.sx ?? 1) * (1 - w) + (idle.sx ?? 1) * w,
		sy: (walk.sy ?? 1) * (1 - w) + (idle.sy ?? 1) * w,
		rotate: (walk.rotate ?? 0) * (1 - w) + (idle.rotate ?? 0) * w,
		y: (walk.y ?? 0) * (1 - w) + Math.sin((f / 30) * 2 * Math.PI * 0.6) * 6 * w,
	};
	const parts = scene5Parts(f);
	// petit signe de la main (pouce levé) une fois le logo affiché
	const wave = dampedWave(f, CUE.logo + 30, 2.3, 2.0);
	parts.thumb = {rotate: -11 * wave};

	// --- fond de marque : révélation circulaire à partir de la mascotte
	const mascotNow = [cam.panX + s * mc[0], cam.panY + s * mc[1]];
	const reveal = tween(f, [T0, T0 + 16], [0, 1], Easing.out(Easing.quad));
	const radius = reveal * 1500;

	// --- éléments graphiques
	const ring1 = springAt(f, SCENE.s6 - 1, {damping: 20, stiffness: 70});
	const ring2 = springAt(f, SCENE.s6 + 5, {damping: 20, stiffness: 70});
	const logoK = springAt(f, CUE.logo, {damping: 12, stiffness: 120, mass: 0.9});
	const pinK = springAt(f, CUE.logo + 6, {damping: 9, stiffness: 150, mass: 0.7});
	const slogan = springAt(f, CUE.logo + 16, {damping: 18, stiffness: 110});
	const sub = springAt(f, CUE.logo + 28, {damping: 18, stiffness: 110});
	const bar = tween(f, [CUE.logo + 20, CUE.logo + 40], [0, 1], easeOut);
	const shadow = interpolate(f, [T0 + 8, T0 + 26], [0, 1], clamp);

	return (
		<AbsoluteFill>
			{f < T0 + 18 ? <Scene5 frame={f} showFg={false} /> : null}

			{/* environnement minimaliste blanc et bleu */}
			<AbsoluteFill
				style={{
					clipPath: radius >= 1499 ? undefined : `circle(${radius.toFixed(1)}px at ${mascotNow[0].toFixed(1)}px ${mascotNow[1].toFixed(1)}px)`,
					background: `radial-gradient(circle at 50% 33%, #FFFFFF 0%, #F4F8FF 38%, ${COLORS.sky} 62%, #D3E3FF 100%)`,
				}}
			>
				{[ring1, ring2].map((r, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: END_CENTER[0] - 430 - i * 90,
							top: END_CENTER[1] - 430 - i * 90,
							width: 860 + i * 180,
							height: 860 + i * 180,
							borderRadius: '50%',
							border: `${i === 0 ? 3 : 2}px solid ${COLORS.blue}`,
							opacity: (i === 0 ? 0.14 : 0.08) * Math.min(1, r),
							transform: `scale(${(0.6 + 0.4 * r).toFixed(4)})`,
						}}
					/>
				))}
				<div
					style={{
						position: 'absolute',
						left: END_CENTER[0] - 360,
						top: END_CENTER[1] - 340,
						width: 720,
						height: 720,
						borderRadius: '50%',
						background: 'radial-gradient(circle, rgba(29,79,196,0.16) 0%, rgba(29,79,196,0) 70%)',
						opacity: ring1,
					}}
				/>
				{/* ombre portée douce sous la mascotte */}
				<div
					style={{
						position: 'absolute',
						left: END_CENTER[0] - 230,
						top: END_CENTER[1] + 390,
						width: 460,
						height: 60,
						borderRadius: '50%',
						background: 'radial-gradient(ellipse, rgba(11,36,99,0.28) 0%, rgba(11,36,99,0) 70%)',
						opacity: shadow,
					}}
				/>
			</AbsoluteFill>

			{/* mascotte (mêmes calques que la scène 5 : visage et proportions identiques) */}
			<Scene2D layer="s5_walk" camera={cam} showBg={false} life={life} parts={parts} />

			{/* logotype + slogan */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1190,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						opacity: Math.min(1, logoK * 1.4),
						transform: `scale(${(0.72 + 0.28 * logoK).toFixed(4)})`,
						filter: logoK < 0.9 ? `blur(${((1 - Math.min(1, logoK)) * 10).toFixed(2)}px)` : undefined,
					}}
				>
					<Wordmark size={108} pinDrop={(1 - pinK) * -70} pinScale={0.6 + 0.4 * pinK} />
				</div>
				<div
					style={{
						marginTop: 44,
						fontFamily: FONT,
						fontWeight: 800,
						fontSize: 60,
						letterSpacing: '0.02em',
						color: COLORS.navy,
						opacity: Math.min(1, slogan * 1.2),
						transform: `translateY(${((1 - slogan) * 34).toFixed(2)}px)`,
					}}
				>
					DUBAÏ À VOTRE FAÇON.
				</div>
				<div
					style={{
						marginTop: 18,
						width: 150 * bar,
						height: 8,
						borderRadius: 4,
						background: COLORS.yellow,
					}}
				/>
				<div
					style={{
						marginTop: 30,
						fontFamily: FONT,
						fontWeight: 600,
						fontSize: 38,
						color: COLORS.navy,
						opacity: Math.min(1, sub) * 0.82,
						transform: `translateY(${((1 - sub) * 26).toFixed(2)}px)`,
					}}
				>
					Organisez votre voyage avec nous.
				</div>
			</div>
		</AbsoluteFill>
	);
};
