import React from 'react';
import {Composition} from 'remotion';
import {MainComposition} from './MainComposition';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="TiavoyagesPremium"
		component={MainComposition}
		durationInFrames={DURATION}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
	/>
);
