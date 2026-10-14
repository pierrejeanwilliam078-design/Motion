import React from 'react';
import {SceneStage} from '../components/SceneStage';
import {SmartphoneInterface} from '../components/SmartphoneInterface';
import {useSceneClock} from '../components/useSceneClock';
import {EASE, keyframes} from '../motion/presets';
import {SCENES} from '../timeline';

/**
 * SCENE 02 — DIGITAL TRAVEL PLANNING (00:04 – 00:09)
 * Original blue outfit. The ONLY smartphone of the film.
 * Tracked flat-2D UI micro-interactions on the real phone screen.
 */
export const Scene02Booking: React.FC = () => {
	const scene = SCENES.s2;
	const {abs, src} = useSceneClock(scene);

	const scale = keyframes(abs, [scene.from, scene.to], [1.03, 1.07], EASE.inOutSine);
	const x = keyframes(abs, [scene.from, scene.to], [10, -14], EASE.inOutSine);
	const y = keyframes(abs, [scene.from, scene.to], [8, -10], EASE.inOutSine);

	return (
		<SceneStage
			srcFrame={src}
			camera={{scale, x, y}}
			useMatte={false}
			vignette={0.16}
			front={<SmartphoneInterface srcFrame={src} />}
		/>
	);
};
