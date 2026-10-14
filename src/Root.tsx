import React from 'react';
import {Composition} from 'remotion';
import {MainComposition} from './MainComposition';
import {V2Composition} from './v2/V2Composition';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';

export const RemotionRoot: React.FC = () => (
	<>
		{/* V1 — premium edit of the original footage */}
		<Composition id="TiavoyagesPremium" component={MainComposition} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
		{/* V2 — completely new vector motion design on the original voice-over */}
		<Composition id="TiavoyagesV2" component={V2Composition} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
	</>
);
