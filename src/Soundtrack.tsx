import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {DURATION, MUSIC_FILE, MUSIC_VOLUME, SFX, VOICE, VOICE_FILE} from './config';
import {tw} from './lib/anim';

/** Intervalles (secondes, timeline finale) où la voix off parle. */
const voiceWindows = VOICE.map((v) => [v.at, v.at + (v.src[1] - v.src[0])] as const);

/** Ducking : la musique baisse automatiquement sous la voix off. */
const musicVolumeAt = (t: number) => {
  const duck = Math.max(
    0,
    ...voiceWindows.map(([a, b]) => Math.min(tw(t, a - 0.2, a, 0, 1), tw(t, b, b + 0.35, 1, 0))),
  );
  const lastVoiceEnd = voiceWindows[voiceWindows.length - 1][1];
  const free = t > lastVoiceEnd ? MUSIC_VOLUME.outro : MUSIC_VOLUME.free;
  const fadeOut = tw(t, DURATION - 1.2, DURATION, 1, 0);
  return (free + (MUSIC_VOLUME.underVoice - free) * duck) * fadeOut;
};

export const Soundtrack: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <>
      <Audio src={staticFile(MUSIC_FILE)} volume={(f) => musicVolumeAt(f / fps)} />
      {VOICE.map((v, i) => (
        <Sequence key={`voice-${i}`} from={Math.round(v.at * fps)} durationInFrames={Math.ceil((v.src[1] - v.src[0]) * fps)} layout="none">
          <Audio
            src={staticFile(VOICE_FILE)}
            trimBefore={Math.round(v.src[0] * fps)}
            trimAfter={Math.round(v.src[1] * fps)}
            volume={1}
          />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={Math.round(s.at * fps)} layout="none">
          <Audio src={staticFile(`audio/sfx/${s.file}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
    </>
  );
};
