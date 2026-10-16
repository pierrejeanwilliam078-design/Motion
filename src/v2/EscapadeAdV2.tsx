import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {AdContent, VOICE_FILE} from '../config';
import {FilmFinish} from '../components/Atmosphere';
import {tw} from '../lib/anim';
import {HookV2} from './scenes/HookV2';
import {DestinationV2} from './scenes/DestinationV2';
import {ExperiencesV2} from './scenes/ExperiencesV2';
import {PriceV2} from './scenes/PriceV2';
import {DatesV2} from './scenes/DatesV2';
import {CallToActionV2} from './scenes/CallToActionV2';
import {PALETTE, V2_MUSIC, V2_SCENES, V2_VOICE} from './timeline';
import '../fonts';

const SCENE_LIST = [
  {key: 'hook', Comp: HookV2, ...V2_SCENES.hook},
  {key: 'destination', Comp: DestinationV2, ...V2_SCENES.destination},
  {key: 'experiences', Comp: ExperiencesV2, ...V2_SCENES.experiences},
  {key: 'price', Comp: PriceV2, ...V2_SCENES.price},
  {key: 'dates', Comp: DatesV2, ...V2_SCENES.dates},
  {key: 'cta', Comp: CallToActionV2, ...V2_SCENES.cta},
];

const voiceWindows = V2_VOICE.map((v) => [v.at, v.at + (v.src[1] - v.src[0])] as const);

/** Volume de la musique facultative, abaissé sous la voix off. */
const musicVolumeAt = (t: number) => {
  const duck = Math.max(0, ...voiceWindows.map(([a, b]) => Math.min(tw(t, a - 0.2, a, 0, 1), tw(t, b, b + 0.3, 1, 0))));
  return V2_MUSIC.volume + (V2_MUSIC.underVoice - V2_MUSIC.volume) * duck;
};

/** Version 2 : montage nerveux, palette sobre, voix off seule. */
export const EscapadeAdV2: React.FC<AdContent> = (content) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.ink}}>
      {SCENE_LIST.map(({key, Comp, in: start, out}) => (
        <Sequence key={key} name={key} from={Math.round(start * fps)} durationInFrames={Math.round((out - start) * fps)} premountFor={fps}>
          <Comp content={content} />
        </Sequence>
      ))}
      <FilmFinish />
      {V2_VOICE.map((v, i) => (
        <Sequence key={`voice-${i}`} from={Math.round(v.at * fps)} durationInFrames={Math.ceil((v.src[1] - v.src[0]) * fps)} layout="none">
          <Audio src={staticFile(VOICE_FILE)} trimBefore={Math.round(v.src[0] * fps)} trimAfter={Math.round(v.src[1] * fps)} />
        </Sequence>
      ))}
      {V2_MUSIC.file ? <Audio src={staticFile(V2_MUSIC.file)} volume={(f) => musicVolumeAt(f / fps)} /> : null}
    </AbsoluteFill>
  );
};
