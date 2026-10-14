import React from 'react';
import {LightSweep, SpeedLines} from '../components/MotionGraphics';
import {SceneStage} from '../components/SceneStage';
import {useSceneClock} from '../components/useSceneClock';
import {EASE, keyframes, prog} from '../motion/presets';
import {CUES, SCENES} from '../timeline';

/** Body of the black car in plate coordinates (used to clip reflections). */
const CAR_CLIP =
	'polygon(470px 1010px, 540px 760px, 640px 650px, 1080px 590px, 1080px 1760px, 600px 1720px, 470px 1520px)';

/**
 * SCENE 04 — PREMIUM CAR TRANSFER (00:14 – 00:19.2)
 * Lateral camera, restrained rack-focus onto the car, specular light sweeps
 * on the black paint (always BEHIND the mascot), blue motion lines.
 */
export const Scene04VIPTransfer: React.FC = () => {
	const scene = SCENES.s4;
	const {abs, src} = useSceneClock(scene);

	const scale = keyframes(abs, [scene.from, scene.to], [1.07, 1.09], EASE.inOutSine);
	const x = keyframes(abs, [scene.from, scene.to], [30, -34], EASE.inOut);
	const y = keyframes(abs, [scene.from, scene.to], [-6, 6], EASE.inOutSine);

	// Depth of field: background soft at the head of the shot, focus pulls onto the car.
	const bgBlur = keyframes(abs, [scene.from, CUES.s4Phrase1 + 20, CUES.s4Phrase3, scene.to], [2.4, 0.4, 0.4, 1.2], EASE.inOut);

	const sweep1 = prog(abs, CUES.s4Phrase1 + 10, 34, EASE.inOutSine);
	const sweep2 = prog(abs, CUES.s4Phrase3 + 4, 30, EASE.inOutSine);
	const doorGlint = prog(abs, CUES.s4Phrase2 + 20, 26, EASE.inOutSine);

	const behind = (
		<>
			<div style={{position: 'absolute', inset: 0, clipPath: CAR_CLIP}}>
				<LightSweep p={sweep1} angle={18} width={240} intensity={0.42} travel={[300, 1250]} />
				<LightSweep p={sweep2} angle={-14} width={180} intensity={0.3} travel={[350, 1200]} />
				<LightSweep p={doorGlint} angle={2} width={70} intensity={0.35} travel={[460, 820]} />
			</div>
			<SpeedLines frame={abs} start={540} count={5} area={{x: 380, y: 1560, w: 700, h: 170}} seed="car-a" />
			<SpeedLines frame={abs} start={556} count={3} area={{x: 520, y: 690, w: 560, h: 110}} seed="car-b" />
		</>
	);

	return <SceneStage srcFrame={src} camera={{scale, x, y}} bgBlur={bgBlur} behind={behind} vignette={0.22} />;
};
