import React from 'react';
import {Composition} from 'remotion';
import {TiavoyagesAd} from './TiavoyagesAd';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';
import './fonts';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="TiavoyagesAd"
			component={TiavoyagesAd}
			durationInFrames={DURATION}
			fps={FPS}
			width={WIDTH}
			height={HEIGHT}
		/>
	);
};
