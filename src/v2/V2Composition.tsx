import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {loadBrandFonts} from '../components/BrandTypography';
import {OriginalAudio} from '../components/OriginalAudio';
import {CUTS} from '../timeline';
import {V2Scene01Dubai} from './scenes/V2Scene01Dubai';
import {V2Scene02Booking} from './scenes/V2Scene02Booking';
import {V2Scene03Flight} from './scenes/V2Scene03Flight';
import {V2Scene04Transfer} from './scenes/V2Scene04Transfer';
import {V2Scene05Discover} from './scenes/V2Scene05Discover';
import {V2Scene06Brand} from './scenes/V2Scene06Brand';
import {CloudPass, PanelStack, PinPortal, SpeedPanels} from './TransitionsV2';

loadBrandFonts();

/**
 * TIAVOYAGES — V2: a completely new, fully vector motion design built on the
 * ORIGINAL soundtrack (voice-over + music untouched). No footage from the
 * original video is used; the mascot comes from the supplied artwork.
 * Same cut points as the voice-over structure (4.0 / 9.0 / 14.0 / 19.2 / 25.2 s).
 */
export const V2Composition: React.FC = () => {
	const f = useCurrentFrame();
	const T1 = CUTS.s1s2 - 10; // pin portal start
	const T5 = CUTS.s5s6 - 12;
	return (
		<AbsoluteFill style={{backgroundColor: '#0B1F5C'}}>
			{f < CUTS.s1s2 + 12 ? <V2Scene01Dubai f={f} /> : null}
			{f >= T1 && f < CUTS.s2s3 ? (
				<PinPortal frame={f} start={T1} duration={18} cx={540} cy={960}>
					<V2Scene02Booking f={f} />
				</PinPortal>
			) : null}
			{f >= CUTS.s2s3 && f < CUTS.s3s4 ? <V2Scene03Flight f={f} /> : null}
			{f >= CUTS.s3s4 && f < CUTS.s4s5 ? <V2Scene04Transfer f={f} /> : null}
			{f >= CUTS.s4s5 && f < T5 + 20 ? <V2Scene05Discover f={f} /> : null}
			{f >= T5 ? (
				<PinPortal frame={f} start={T5} duration={18} cx={540} cy={1000}>
					<V2Scene06Brand f={f} />
				</PinPortal>
			) : null}

			<PanelStack frame={f} at={CUTS.s2s3} half={8} />
			<CloudPass frame={f} at={CUTS.s3s4} half={10} />
			<SpeedPanels frame={f} at={CUTS.s4s5} half={8} />

			<OriginalAudio />
		</AbsoluteFill>
	);
};
