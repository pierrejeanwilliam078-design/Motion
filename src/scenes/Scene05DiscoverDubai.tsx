import React from 'react';
import {PictoChip, WaterShimmer} from '../components/MotionGraphics';
import {SceneStage} from '../components/SceneStage';
import {useSceneClock} from '../components/useSceneClock';
import {EASE, keyframes, prog, springAt, SPRINGS} from '../motion/presets';
import {CUES, FPS, SCENES} from '../timeline';

/**
 * SCENE 05 — DISCOVER DUBAI (00:19.2 – 00:25.2)
 * Promenade shot: tracking camera with depth separation (soft background,
 * sharp mascot), shimmering water, three floating pictograms.
 */
export const Scene05DiscoverDubai: React.FC = () => {
	const scene = SCENES.s5;
	const {abs, src} = useSceneClock(scene);

	const scale = keyframes(abs, [scene.from, scene.to], [1.05, 1.1], EASE.inOutSine);
	const x = keyframes(abs, [scene.from, scene.to], [-24, 22], EASE.inOut);
	const y = keyframes(abs, [scene.from, scene.to], [4, -8], EASE.inOutSine);

	const exit = prog(abs, 736, 18, EASE.inQuart);
	const chips = [
		{kind: 'compass' as const, label: 'Découverte', at: CUES.s5Phrase1 + 4, pos: {x: 205, y: 520}, phase: 0},
		{kind: 'dunes' as const, label: 'Excursions', at: CUES.s5Phrase2 + 6, pos: {x: 470, y: 300}, phase: 2},
		{kind: 'freedom' as const, label: 'Liberté', at: CUES.s5Phrase2 + 30, pos: {x: 735, y: 470}, phase: 4},
	];

	// Screen-locked pictograms move with a slower parallax than the plate → depth.
	const hud = (
		<div style={{position: 'absolute', inset: 0, transform: `translateX(${x * 0.45}px)`}}>
			{chips.map((c, i) => (
				<PictoChip
					key={i}
					kind={c.kind}
					label={c.label}
					p={springAt(abs, FPS, c.at, SPRINGS.soft)}
					exit={exit}
					float={Math.sin((abs + c.phase * 9) / 20) * 6}
					style={{left: c.pos.x, top: c.pos.y}}
				/>
			))}
		</div>
	);

	const behind = <WaterShimmer frame={abs} area={{x: 640, y: 1010, w: 440, h: 230}} count={18} />;

	return <SceneStage srcFrame={src} camera={{scale, x, y}} bgBlur={1.4} behind={behind} hud={hud} />;
};
