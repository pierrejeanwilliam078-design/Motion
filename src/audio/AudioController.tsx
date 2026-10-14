import React from 'react';
import {Audio, Sequence, getStaticFiles, interpolate, staticFile} from 'remotion';
import timelineV1 from '../config/timeline.json';

type Clip = {id: string; srcIn: number; srcOut: number; at: number};
type Cue = {id: string; file: string; at: number; gain: number};
export type AudioTimeline = {
  fps: number;
  voiceover: {src: string; clips: Clip[]};
  sfx: Cue[];
  music: {src: string; volume: number; duckedVolume: number; sfxDir?: string};
};

const exists = (p: string) => getStaticFiles().some((f) => f.name === p);

/**
 * Mixage générique :
 *  - voix off officielle découpée en phrases (coupes dans les silences),
 *    chacune calée sur sa scène, sans aucune accélération ;
 *  - lit musical ducké doucement (rampes de 8 frames) sous la voix ;
 *  - effets sonores placés depuis le fichier de minutage.
 */
export const AudioMix: React.FC<{timeline: AudioTimeline}> = ({timeline}) => {
  const {fps, voiceover, sfx, music} = timeline;
  const sfxDir = music.sfxDir ?? 'audio/sfx';
  const ranges = voiceover.clips.map((c) => [c.at, c.at + Math.round((c.srcOut - c.srcIn) * fps)] as const);
  const musicVolume = (frame: number) => {
    let duck = 0;
    for (const [a, b] of ranges) {
      duck = Math.max(duck, interpolate(frame, [a - 8, a, b, b + 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    }
    return music.volume + (music.duckedVolume - music.volume) * duck;
  };
  return (
    <>
      {voiceover.clips.map((c) => {
        const dur = Math.round((c.srcOut - c.srcIn) * fps);
        return (
          <Sequence key={c.id} from={c.at} durationInFrames={dur} name={`VO ${c.id}`} layout="none">
            <Audio
              src={staticFile(voiceover.src)}
              trimBefore={Math.round(c.srcIn * fps)}
              trimAfter={Math.round(c.srcOut * fps)}
              volume={(f) => interpolate(f, [0, 2, dur - 3, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
            />
          </Sequence>
        );
      })}
      {exists(music.src) ? <Audio src={staticFile(music.src)} volume={musicVolume} name="Musique" /> : null}
      {sfx.map((s) =>
        exists(`${sfxDir}/${s.file}.wav`) ? (
          <Sequence key={s.id} from={s.at} name={`SFX ${s.id}`} layout="none">
            <Audio src={staticFile(`${sfxDir}/${s.file}.wav`)} volume={s.gain * 0.8} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};

/** Version 1 (cinématique). */
export const AudioController: React.FC = () => <AudioMix timeline={timelineV1 as AudioTimeline} />;
