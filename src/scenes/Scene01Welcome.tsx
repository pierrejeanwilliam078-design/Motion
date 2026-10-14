import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {BRAND, FONT_FAMILY} from '../components/BrandTypography';
import {SceneStage} from '../components/SceneStage';
import {useSceneClock} from '../components/useSceneClock';
import {EASE, keyframes, prog} from '../motion/presets';
import {CUES, SCENES} from '../timeline';

/**
 * SCENE 01 — DUBAI WELCOME (00:00 – 00:04)
 * Emirati outfit (kandura / ghutra / agal) — original shot.
 * Cinematic aperture opening, crane-down from the Burj Khalifa onto the mascot,
 * giant "DUBAÏ" title placed BETWEEN the skyline and the mascot.
 */
export const Scene01Welcome: React.FC = () => {
	const scene = SCENES.s1;
	const {abs, src} = useSceneClock(scene);

	// Camera: starts high and tight on the skyline, cranes down onto the mascot,
	// then a slow push-in until the transition.
	const scale = keyframes(abs, [0, 46, 128], [1.16, 1.07, 1.1], EASE.inOut);
	const y = keyframes(abs, [0, 46, 128], [150, 10, -6], EASE.inOut);
	const x = keyframes(abs, [0, 128], [-30, 12], EASE.inOutSine);
	const bgBlur = keyframes(abs, [0, 30, 60], [3, 1.6, 1.2], EASE.inOut);

	// Aperture opening (echoes the light-line opening of the original video).
	const lineGrow = prog(abs, 0, 8, EASE.outExpo);
	const open = prog(abs, 5, 18, EASE.outQuint);
	const insetPct = (1 - open) * 50;

	// "DUBAÏ" title — letters rise one after another on « Dubaï ».
	const letters = 'DUBAÏ'.split('');
	const titleOut = prog(abs, 100, 16, EASE.inQuart);

	const title = (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 190,
				display: 'flex',
				justifyContent: 'center',
				fontFamily: FONT_FAMILY,
				fontWeight: 800,
				fontSize: 188,
				letterSpacing: '0.06em',
				lineHeight: 1,
				color: BRAND.white,
				opacity: 1 - titleOut,
				transform: `translateY(${-titleOut * 40}px)`,
			}}
		>
			{letters.map((l, i) => {
				const p = prog(abs, CUES.s1Dubai + 2 + i * 3, 22, EASE.outQuint);
				return (
					<span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0 2px'}}>
						<span
							style={{
								display: 'inline-block',
								transform: `translateY(${(1 - p) * 105}%)`,
								color: '#FFFFFF',
								textShadow: '0 6px 18px rgba(11,31,92,0.35), 0 18px 48px rgba(11,31,92,0.25)',
							}}
						>
							{l}
						</span>
					</span>
				);
			})}
		</div>
	);

	// Thin yellow accent under the title, drawn on « …mais à votre façon ! »
	const accent = prog(abs, CUES.s1Facon, 20, EASE.outQuint);
	const accentEl = (
		<div
			style={{
				position: 'absolute',
				left: 540 - 90 * accent,
				top: 404,
				width: 180 * accent,
				height: 8,
				borderRadius: 4,
				background: BRAND.yellow,
				opacity: (1 - titleOut) * Math.min(1, accent * 2),
				boxShadow: '0 4px 14px rgba(255,194,26,0.45)',
			}}
		/>
	);

	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<AbsoluteFill style={{clipPath: `inset(${insetPct}% 0 ${insetPct}% 0)`}}>
				<SceneStage
					srcFrame={src}
					camera={{scale, x, y}}
					bgBlur={bgBlur}
					behind={
						<>
							{title}
							{accentEl}
						</>
					}
				/>
			</AbsoluteFill>
			{/* Light line at the aperture edge */}
			{open < 1 ? (
				<>
					{[-1, 1].map((dir) => (
						<div
							key={dir}
							style={{
								position: 'absolute',
								left: 540 - 540 * lineGrow,
								width: 1080 * lineGrow,
								top: 960 + dir * (960 - (insetPct / 50) * 960) - 2,
								height: 4,
								background: 'linear-gradient(90deg, rgba(255,255,255,0), #ffffff 30%, #ffffff 70%, rgba(255,255,255,0))',
								boxShadow: '0 0 24px 6px rgba(160,200,255,0.8)',
								opacity: interpolate(open, [0, 0.85, 1], [1, 0.6, 0]),
							}}
						/>
					))}
				</>
			) : null}
		</AbsoluteFill>
	);
};
