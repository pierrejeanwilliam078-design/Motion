import {useCurrentFrame} from 'remotion';
import {mapSourceFrame, SceneTiming} from '../timeline';

/**
 * Clock of a scene rendered inside <Sequence from={scene.from}>.
 * - abs: absolute frame of the master timeline (= original video timeline)
 * - local: frame since the scene became visible
 * - src: frame of the original video to display (speed-ramped at the edges)
 */
export const useSceneClock = (scene: SceneTiming) => {
	const local = useCurrentFrame();
	const abs = local + scene.from;
	const src = mapSourceFrame(abs, scene);
	return {abs, local, src};
};
