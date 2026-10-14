import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useFontsReady} from '../lib/fonts';
import {AudioMix, AudioTimeline} from '../audio/AudioController';
import {Grain} from '../components/Primitives';
import {C3} from './kit3';
import {OutlineDefs} from '../v2/kit';
import T from './timeline.json';
import {V3_Scene01, V3_Scene02} from './scenes/V3_S1_S2';
import {V3_Scene03, V3_Scene04} from './scenes/V3_S3_S4';
import {V3_Scene05, V3_Scene06} from './scenes/V3_S5_S6';

/**
 * VERSION 3 — « DESTINATION TOAMASINA ».
 * Vraies photos (Antananarivo, Arena de Toamasina) en parallaxe 2,5D,
 * silhouette exacte de Madagascar, charte stricte du logo GSN.
 * z = ordre d'empilement explicite pendant les chevauchements.
 */
const WINDOWS: {id: string; from: number; to: number; z: number; C: React.FC<{f: number}>}[] = [
  {id: 's1', from: 0, to: 162, z: 2, C: V3_Scene01},
  {id: 's2', from: 134, to: 308, z: 1, C: V3_Scene02},
  {id: 's3', from: 288, to: 482, z: 4, C: V3_Scene03},
  {id: 's4', from: 472, to: 632, z: 3, C: V3_Scene04},
  {id: 's5', from: 600, to: 832, z: 5, C: V3_Scene05},
  {id: 's6', from: 818, to: 1000, z: 6, C: V3_Scene06},
];

export const GSN40_V3: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  return (
    <AbsoluteFill style={{background: C3.navy, overflow: 'hidden'}}>
      <OutlineDefs />
      {ready
        ? WINDOWS.filter((w) => f >= w.from && f < w.to)
            .sort((a, b) => a.z - b.z)
            .map(({id, C}) => <C key={id} f={f} />)
        : null}
      <Grain frame={f} opacity={0.035} />
      <AudioMix timeline={T as AudioTimeline} />
    </AbsoluteFill>
  );
};
