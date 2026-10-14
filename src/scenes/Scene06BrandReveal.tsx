import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {BRAND, FONT_FAMILY, RiseText} from '../components/BrandTypography';
import {Ripple, RouteLine, Sparkle} from '../components/MotionGraphics';
import {MascotLayer} from '../components/SceneStage';
import {useSceneClock} from '../components/useSceneClock';
import {EASE, keyframes, prog, springAt, SPRINGS} from '../motion/presets';
import {CUES, FPS, SCENES} from '../timeline';

/** Pieces of the ORIGINAL wordmark (extracted from the supplied end card). */
const LOGO = {
	width: 752,
	height: 104,
	tiav: {src: 'brand/wordmark-tiav.png', x: 0, w: 279},
	pin: {src: 'brand/wordmark-pin.png', x: 279, w: 86},
	yages: {src: 'brand/wordmark-yages.png', x: 365, w: 387},
};
const LOGO_LEFT = 540 - LOGO.width / 2;
const LOGO_TOP = 1182;

/**
 * SCENE 06 — FINAL BRAND REVEAL (00:25.2 – 00:30)
 * Minimal premium background, mascot hero pose (original end-card mascot,
 * cut out), original logo assembled piece by piece, refined typography.
 */
export const Scene06BrandReveal: React.FC = () => {
	const scene = SCENES.s6;
	const {abs, src} = useSceneClock(scene);

	// Final camera settle.
	const camScale = keyframes(abs, [scene.from, scene.to], [1.06, 1], EASE.outQuint);

	// Mascot hero pose.
	const hero = springAt(abs, FPS, scene.from + 2, SPRINGS.settle);
	const heroScale = interpolate(hero, [0, 1], [0.94, 1.12]);
	const heroY = interpolate(hero, [0, 1], [90, 0]) + Math.sin((abs - scene.from) / 22) * 5 * hero;

	// Background accents.
	const rings = prog(abs, scene.from, 60, EASE.outQuint);
	const arc = prog(abs, scene.from + 8, 40, EASE.inOut);

	// Logo assembly on the first sentence of the outro.
	const L = CUES.s6Phrase1 - 6;
	const tiav = prog(abs, L, 20, EASE.outQuint);
	const yages = prog(abs, L + 4, 20, EASE.outQuint);
	const pinDrop = springAt(abs, FPS, L + 10, SPRINGS.pop);
	const pinRipple = prog(abs, L + 16, 26, EASE.outQuint);
	const pinRipple2 = prog(abs, CUES.s6Phrase4, 28, EASE.outQuint);
	const glint = prog(abs, CUES.s6Phrase4 - 6, 24, EASE.inOutSine);

	const underline = prog(abs, CUES.s6Phrase2 + 12, 18, EASE.outQuint);
	const sparkle = prog(abs, CUES.s6Phrase1 + 6, 26, EASE.outQuint);

	return (
		<AbsoluteFill style={{overflow: 'hidden', backgroundColor: BRAND.mist}}>
			<AbsoluteFill style={{transform: `scale(${camScale})`}}>
				{/* Background */}
				<AbsoluteFill
					style={{
						background: `radial-gradient(circle at 50% 36%, #FFFFFF 0%, #F6F9FF 34%, ${BRAND.mist} 58%, ${BRAND.mistDeep} 100%)`,
					}}
				/>
				{[340, 450, 580].map((r, i) => (
					<div
						key={r}
						style={{
							position: 'absolute',
							left: 525 - r * (0.85 + 0.15 * rings),
							top: 700 - r * (0.85 + 0.15 * rings),
							width: 2 * r * (0.85 + 0.15 * rings),
							height: 2 * r * (0.85 + 0.15 * rings),
							borderRadius: '50%',
							border: `2px solid rgba(31,79,209,${0.09 - i * 0.025})`,
							background: i === 0 ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)' : undefined,
							opacity: rings,
						}}
					/>
				))}
				<div
					style={{
						position: 'absolute',
						left: 120,
						top: 330,
						width: 420,
						height: 420,
						borderRadius: '50%',
						background: 'radial-gradient(circle, rgba(255,194,26,0.16) 0%, rgba(255,194,26,0) 70%)',
						opacity: rings,
					}}
				/>
				<RouteLine
					p0={{x: 70, y: 300}}
					p1={{x: 300, y: 120}}
					p2={{x: 760, y: 120}}
					p3={{x: 1010, y: 290}}
					head={arc}
					color={BRAND.royal}
					width={4}
					opacity={0.32}
					showPlane={false}
				/>

				{/* Contact shadow */}
				<div
					style={{
						position: 'absolute',
						left: 525 - 210 * heroScale,
						top: 1098,
						width: 420 * heroScale,
						height: 52,
						borderRadius: '50%',
						background: 'radial-gradient(ellipse, rgba(11,31,92,0.22) 0%, rgba(11,31,92,0) 70%)',
						opacity: hero,
						transform: `scaleX(${1 - (heroY / 400)})`,
					}}
				/>

				{/* Mascot — hero pose */}
				<AbsoluteFill
					style={{
						transform: `translate(15px, ${-28 + heroY}px) scale(${heroScale})`,
						transformOrigin: '525px 1110px',
						opacity: Math.min(1, hero * 2.5),
					}}
				>
					{/* The matte of the original end card also contains its old text: keep the character only. */}
					<AbsoluteFill style={{clipPath: 'inset(230px 150px 798px 140px)'}}>
						<MascotLayer srcFrame={src} />
					</AbsoluteFill>
				</AbsoluteFill>

				{[
					{x: 215, y: 470, s: 30, d: 0},
					{x: 850, y: 380, s: 22, d: 5},
					{x: 905, y: 820, s: 18, d: 10},
				].map((sp, i) => {
					const t = prog(abs, CUES.s6Phrase1 + 6 + sp.d, 26, EASE.outQuint);
					return (
						<Sparkle
							key={i}
							size={sp.s}
							color={BRAND.yellow}
							opacity={sparkle > 0 ? Math.sin(Math.PI * t) : 0}
							style={{position: 'absolute', left: sp.x, top: sp.y, transform: `scale(${0.4 + t}) rotate(${t * 40}deg)`}}
						/>
					);
				})}

				{/* Original wordmark, assembled */}
				<div style={{position: 'absolute', left: LOGO_LEFT, top: LOGO_TOP, width: LOGO.width, height: LOGO.height}}>
					<div style={{position: 'absolute', left: LOGO.tiav.x, top: 0, width: LOGO.tiav.w, height: LOGO.height, overflow: 'hidden'}}>
						<Img
							src={staticFile(LOGO.tiav.src)}
							style={{height: LOGO.height, transform: `translateX(${(1 - tiav) * 70}px) translateY(${(1 - tiav) * 30}px)`, opacity: tiav}}
						/>
					</div>
					<div style={{position: 'absolute', left: LOGO.yages.x, top: 0, width: LOGO.yages.w, height: LOGO.height, overflow: 'hidden'}}>
						<Img
							src={staticFile(LOGO.yages.src)}
							style={{height: LOGO.height, transform: `translateX(${-(1 - yages) * 70}px) translateY(${(1 - yages) * 30}px)`, opacity: yages}}
						/>
					</div>
					<Ripple x={LOGO.pin.x + LOGO.pin.w / 2} y={LOGO.height - 4} p={pinRipple} radius={78} ellipse={0.3} color={BRAND.yellow} width={4} />
					<Ripple x={LOGO.pin.x + LOGO.pin.w / 2} y={LOGO.height - 4} p={pinRipple2} radius={64} ellipse={0.3} color={BRAND.royal} width={3} />
					<Img
						src={staticFile(LOGO.pin.src)}
						style={{
							position: 'absolute',
							left: LOGO.pin.x,
							top: 0,
							height: LOGO.height,
							transform: `translateY(${(1 - pinDrop) * -190}px) scaleY(${interpolate(pinDrop, [0.85, 1, 1.1], [1.06, 1, 0.95], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`,
							transformOrigin: '50% 100%',
							opacity: Math.min(1, pinDrop * 3),
						}}
					/>
					{/* Light glint travelling through the letters */}
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
							<div
								style={{
									position: 'absolute',
									top: -40,
									left: -200 + 1150 * glint,
									width: 120,
									height: 200,
									transform: 'skewX(-20deg)',
									background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))',
								}}
							/>
						) : null}
					</div>
				</div>

				{/* Tagline */}
				<RiseText
					text="DUBAÏ À VOTRE FAÇON."
					frame={abs}
					start={CUES.s6Phrase2 - 4}
					stagger={3}
					duration={20}
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 1336,
						fontWeight: 800,
						fontSize: 62,
						letterSpacing: '0.01em',
						color: BRAND.navy,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						left: 540 - 70 * underline,
						top: 1428,
						width: 140 * underline,
						height: 7,
						borderRadius: 4,
						background: BRAND.yellow,
					}}
				/>
				<RiseText
					text="Votre voyage, sur mesure."
					frame={abs}
					start={CUES.s6Phrase3 - 4}
					stagger={2}
					duration={20}
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 1462,
						fontWeight: 600,
						fontSize: 42,
						color: BRAND.royal,
					}}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
