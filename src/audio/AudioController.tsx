import React from 'react';
import {Audio, Sequence, getStaticFiles, interpolate, staticFile} from 'remotion';
import {MUSIC, SFX, VO, VO_RANGES} from '../config/timeline';
import {TIMELINE} from '../config/timeline';

const FPS = TIMELINE.fps;
const exists = (p: string) => getStaticFiles().some((f) => f.name === p);

/** Gain musique : ducking doux (rampes de 8 frames) pendant la voix off. */
const musicVolume = (frame: number) => {
  let duck = 0;
  for (const [a, b] of VO_RANGES) {
    const v = interpolate(frame, [a - 8, a, b, b + 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    duck = Math.max(duck, v);
  }
  return MUSIC.volume + (MUSIC.duckedVolume - MUSIC.volume) * duck;
};

/**
 * Contrôleur audio :
 *  - voix off officielle découpée en 6 phrases (coupes dans les silences),
 *    chacune calée sur sa scène, sans aucune accélération ;
 *  - lit musical original (ducké sous la voix) ;
 *  - effets sonores originaux placés depuis timeline.json.
 */
export const AudioController: React.FC = () => {
  const hasMusic = exists(MUSIC.src);
  return (
    <>
      {VO.clips.map((c) => {
        const dur = Math.round((c.srcOut - c.srcIn) * FPS);
        return (
          <Sequence key={c.id} from={c.at} durationInFrames={dur} name={`VO ${c.id}`} layout="none">
            <Audio
              src={staticFile(VO.src)}
              trimBefore={Math.round(c.srcIn * FPS)}
              trimAfter={Math.round(c.srcOut * FPS)}
              volume={(f) => interpolate(f, [0, 2, dur - 3, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
            />
          </Sequence>
        );
      })}
      {hasMusic ? <Audio src={staticFile(MUSIC.src)} volume={musicVolume} name="Musique" /> : null}
      {SFX.map((s) =>
        exists(`audio/sfx/${s.file}.wav`) ? (
          <Sequence key={s.id} from={s.at} name={`SFX ${s.id}`} layout="none">
            <Audio src={staticFile(`audio/sfx/${s.file}.wav`)} volume={s.gain * 0.8} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};
