import React from 'react';
import {Composition} from 'remotion';
import {CONTENT, DURATION, HEIGHT, WIDTH} from './config';
import {EscapadeAd} from './EscapadeAd';
import {EscapadeAdV2} from './v2/EscapadeAdV2';
import {V2_DURATION} from './v2/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    {/* Version standard 30 i/s (Facebook, Instagram, TikTok) */}
    <Composition
      id="EscapadeAd"
      component={EscapadeAd}
      width={WIDTH}
      height={HEIGHT}
      fps={30}
      durationInFrames={DURATION * 30}
      defaultProps={CONTENT}
    />
    {/* Version 60 i/s (mouvements encore plus fluides, rendu 2× plus long) */}
    <Composition
      id="EscapadeAd60"
      component={EscapadeAd}
      width={WIDTH}
      height={HEIGHT}
      fps={60}
      durationInFrames={DURATION * 60}
      defaultProps={CONTENT}
    />
    {/* Version 2 : montage plus rythmé, palette sobre, voix off seule */}
    <Composition
      id="EscapadeAdV2"
      component={EscapadeAdV2}
      width={WIDTH}
      height={HEIGHT}
      fps={30}
      durationInFrames={V2_DURATION * 30}
      defaultProps={CONTENT}
    />
    <Composition
      id="EscapadeAdV2-60"
      component={EscapadeAdV2}
      width={WIDTH}
      height={HEIGHT}
      fps={60}
      durationInFrames={V2_DURATION * 60}
      defaultProps={CONTENT}
    />
  </>
);
