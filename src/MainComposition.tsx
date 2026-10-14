import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {loadBrandFonts} from './components/BrandTypography';
import {OriginalAudio} from './components/OriginalAudio';
import {IrisIn, IrisOut, WipeBands, WipeIn, WipeKind, WipeOut} from './components/Transitions';
import {Scene01Welcome} from './scenes/Scene01Welcome';
import {Scene02Booking} from './scenes/Scene02Booking';
import {Scene03Airport} from './scenes/Scene03Airport';
import {Scene04VIPTransfer} from './scenes/Scene04VIPTransfer';
import {Scene05DiscoverDubai} from './scenes/Scene05DiscoverDubai';
import {Scene06BrandReveal} from './scenes/Scene06BrandReveal';
import {CUTS, IRIS_HALF, SCENES, SceneTiming, TRANSITION_HALF} from './timeline';

loadBrandFonts();

const H = TRANSITION_HALF;

type Cut = {at: number; kind: WipeKind} | null;

/** One shot in the edit, with its incoming and outgoing transitions. */
const Shot: React.FC<{scene: SceneTiming; inCut: Cut; outCut: Cut; children: React.ReactNode}> = ({scene, inCut, outCut, children}) => {
	const frame = useCurrentFrame();
	let content = <>{children}</>;
	if (outCut) {
		content = (
			<WipeOut kind={outCut.kind} frame={frame} at={outCut.at} half={H}>
				{content}
			</WipeOut>
		);
	}
	if (inCut) {
		content = (
			<WipeIn kind={inCut.kind} frame={frame} at={inCut.at} half={H}>
				{content}
			</WipeIn>
		);
	}
	return (
		<Sequence from={scene.from} durationInFrames={scene.to - scene.from} layout="none">
			{content}
		</Sequence>
	);
};

const CUT_PLAN: {at: number; kind: WipeKind}[] = [
	{at: CUTS.s1s2, kind: 'route'}, // travel-route line + airplane, into the phone scene
	{at: CUTS.s2s3, kind: 'up'}, // fast vertical camera move
	{at: CUTS.s3s4, kind: 'takeoff'}, // airplane-inspired diagonal wipe
	{at: CUTS.s4s5, kind: 'drive'}, // directional wipe following the car
];

export const MainComposition: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<Shot scene={SCENES.s1} inCut={null} outCut={CUT_PLAN[0]}>
				<Scene01Welcome />
			</Shot>
			<Shot scene={SCENES.s2} inCut={CUT_PLAN[0]} outCut={CUT_PLAN[1]}>
				<Scene02Booking />
			</Shot>
			<Shot scene={SCENES.s3} inCut={CUT_PLAN[1]} outCut={CUT_PLAN[2]}>
				<Scene03Airport />
			</Shot>
			<Shot scene={SCENES.s4} inCut={CUT_PLAN[2]} outCut={CUT_PLAN[3]}>
				<Scene04VIPTransfer />
			</Shot>
			<Sequence from={SCENES.s5.from} durationInFrames={SCENES.s5.to - SCENES.s5.from} layout="none">
				<WipeIn kind="drive" frame={frame} at={CUTS.s4s5} half={H}>
					<IrisOut frame={frame} at={CUTS.s5s6} half={IRIS_HALF}>
						<Scene05DiscoverDubai />
					</IrisOut>
				</WipeIn>
			</Sequence>
			<Sequence from={SCENES.s6.from} durationInFrames={SCENES.s6.to - SCENES.s6.from} layout="none">
				<IrisIn frame={frame} at={CUTS.s5s6} half={IRIS_HALF} cx={525} cy={700}>
					<Scene06BrandReveal />
				</IrisIn>
			</Sequence>

			{CUT_PLAN.map((c) => (
				<WipeBands key={c.at} kind={c.kind} frame={frame} at={c.at} half={H} />
			))}

			<OriginalAudio />
		</AbsoluteFill>
	);
};
