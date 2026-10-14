import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useFontsReady} from '../lib/fonts';
import {AudioMix, AudioTimeline} from '../audio/AudioController';
import {Grain} from '../components/Primitives';
import {Hud, OutlineDefs, P2, beatPulse} from './kit';
import T from './timeline.json';
import {V2_Scene01_Hook} from './scenes/V2_Scene01_Hook';
import {V2_Scene02_Route} from './scenes/V2_Scene02_Route';
import {V2_Scene03_Bento} from './scenes/V2_Scene03_Bento';
import {V2_Scene04_Words} from './scenes/V2_Scene04_Words';
import {V2_Scene05_Reveal} from './scenes/V2_Scene05_Reveal';
import {V2_Scene06_CTA} from './scenes/V2_Scene06_CTA';

/**
 * VERSION 2 — « POP KINETIC ».
 * Fenêtres d'activité qui se chevauchent ; z = ordre d'empilement explicite
 * (la scène 03 s'éparpille AU-DESSUS de la 04, toutes les autres entrent par-dessus).
 */
const WINDOWS: {id: string; from: number; to: number; z: number; C: React.FC<{f: number}>}[] = [
  {id: 's1', from: 0, to: 158, z: 1, C: V2_Scene01_Hook},
  {id: 's2', from: 140, to: 304, z: 2, C: V2_Scene02_Route},
  {id: 's3', from: 292, to: 476, z: 4, C: V2_Scene03_Bento},
  {id: 's4', from: 448, to: 640, z: 3, C: V2_Scene04_Words},
  {id: 's5', from: 616, to: 836, z: 5, C: V2_Scene05_Reveal},
  {id: 's6', from: 816, to: 1000, z: 6, C: V2_Scene06_CTA},
];

/** Couleur du cadre éditorial selon le fond. */
const hudColor = (f: number) => {
  if ((f >= 300 && f < 450) || (f >= 640 && f < 818)) return P2.navy;
  if (f >= 836) return P2.ink;
  return P2.white;
};

/** Petit « bump » d'échelle sur chaque temps pendant les sections rythmées. */
const bump = (f: number) => {
  const on = (f >= 150 && f < 470) || (f >= 640 && f < 816);
  return on ? 1 + 0.006 * beatPulse(f) : 1;
};

export const GSN40_V2: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  // cadre masqué pendant la grille bento (elle occupe tout l'écran) et pendant le CTA
  const hudOpacity = f < 16 || (f >= 298 && f < 476) || f >= 826 ? 0 : 0.85;
  return (
    <AbsoluteFill style={{background: P2.ink, overflow: 'hidden'}}>
      <OutlineDefs />
      <AbsoluteFill style={{transform: `scale(${bump(f)})`}}>
        {ready
          ? WINDOWS.filter((w) => f >= w.from && f < w.to)
              .sort((a, b) => a.z - b.z)
              .map(({id, C}) => <C key={id} f={f} />)
          : null}
      </AbsoluteFill>
      {ready ? <Hud f={f} color={hudColor(f)} opacity={hudOpacity} /> : null}
      <Grain frame={f} opacity={0.04} />
      <AudioMix timeline={T as AudioTimeline} />
    </AbsoluteFill>
  );
};
