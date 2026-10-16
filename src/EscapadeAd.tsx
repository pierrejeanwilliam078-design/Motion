import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {AdContent, SCENES} from './config';
import {CameraFlashes, FilmFinish, LightLeaks, SunParticles} from './components/Atmosphere';
import {Hook} from './scenes/Hook';
import {Destination} from './scenes/Destination';
import {Experiences} from './scenes/Experiences';
import {Price} from './scenes/Price';
import {Dates} from './scenes/Dates';
import {CallToAction} from './scenes/CallToAction';
import {Soundtrack} from './Soundtrack';
import './fonts';

const SCENE_LIST = [
  {key: 'hook', Comp: Hook, ...SCENES.hook},
  {key: 'destination', Comp: Destination, ...SCENES.destination},
  {key: 'experiences', Comp: Experiences, ...SCENES.experiences},
  {key: 'price', Comp: Price, ...SCENES.price},
  {key: 'dates', Comp: Dates, ...SCENES.dates},
  {key: 'cta', Comp: CallToAction, ...SCENES.cta},
];

export const EscapadeAd: React.FC<AdContent> = (content) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#06244A'}}>
      {SCENE_LIST.map(({key, Comp, in: start, out}) => (
        <Sequence
          key={key}
          name={key}
          from={Math.round(start * fps)}
          durationInFrames={Math.round((out - start) * fps)}
          premountFor={fps}
        >
          <Comp content={content} />
        </Sequence>
      ))}
      <LightLeaks intensity={0.32} />
      <SunParticles />
      <CameraFlashes times={[0.12, 8.7, 29.0, 32.3]} />
      <FilmFinish />
      <Soundtrack />
    </AbsoluteFill>
  );
};
