import React from 'react';
import {Composition} from 'remotion';
import {GSN40} from './GSN40';
import {GSN40_V2} from './v2/GSN40_V2';
import {VIDEO} from './config/theme';

export const RemotionRoot: React.FC = () => (
  <>
    {/* Publicité GSN 2.0 — 1920×1080, 25 fps, 1 000 frames = 40,00 s */}
    <Composition id="GSN40" component={GSN40} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
    {/* Version 2 « Pop Kinetic » — même format, direction artistique différente */}
    <Composition id="GSN40-V2" component={GSN40_V2} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
  </>
);
