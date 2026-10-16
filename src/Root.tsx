import React from 'react';
import {Composition} from 'remotion';
import {CONTENT, DURATION, HEIGHT, WIDTH} from './config';
import {EscapadeAd} from './EscapadeAd';

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
  </>
);
