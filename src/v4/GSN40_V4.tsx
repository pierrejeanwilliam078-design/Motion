import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useFontsReady} from '../lib/fonts';
import {AudioMix, AudioTimeline} from '../audio/AudioController';
import {Grain} from '../components/Primitives';
import {C3} from '../v3/kit3';
import T from './timeline.json';
import {V4_Scene01, V4_Scene02} from './scenes/V4_S1_S2';
import {V4_Scene03, V4_Scene04} from './scenes/V4_S3_S4';
import {V4_Scene05, V4_Scene06} from './scenes/V4_S5_S6';

/**
 * VERSION 4 — « L'ÎLE DES OPPORTUNITÉS ».
 * La silhouette de Madagascar est le fil conducteur de chaque scène :
 * points qui s'assemblent, île pleine, trajet avec texte sur chemin, fenêtre photo,
 * ondes « rayonner », iris en forme d'île, points qui reforment l'île, texte sur le contour,
 * morphing île → cercle, mini-île finale. z = ordre d'empilement explicite.
 */
const WINDOWS: {id: string; from: number; to: number; z: number; C: React.FC<{f: number}>}[] = [
  {id: 's1', from: 0, to: 152, z: 2, C: V4_Scene01},
  {id: 's2', from: 140, to: 306, z: 1, C: V4_Scene02},
  {id: 's3', from: 286, to: 484, z: 4, C: V4_Scene03},
  {id: 's4', from: 472, to: 627, z: 3, C: V4_Scene04},
  {id: 's5', from: 626, to: 834, z: 5, C: V4_Scene05},
  {id: 's6', from: 830, to: 1000, z: 6, C: V4_Scene06},
];

export const GSN40_V4: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  return (
    <AbsoluteFill style={{background: C3.navy, overflow: 'hidden'}}>
      {ready
        ? WINDOWS.filter((w) => f >= w.from && f < w.to)
            .sort((a, b) => a.z - b.z)
            .map(({id, C}) => <C key={id} f={f} />)
        : null}
      <Grain frame={f} opacity={0.03} />
      <AudioMix timeline={T as AudioTimeline} />
    </AbsoluteFill>
  );
};
