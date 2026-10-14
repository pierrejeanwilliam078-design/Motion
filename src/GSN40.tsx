import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useFontsReady} from './lib/fonts';
import {COLORS} from './config/theme';
import {SCENES} from './config/timeline';
import {AudioController} from './audio/AudioController';
import {Grain, Vignette} from './components/Primitives';
import {Scene01_Hook} from './scenes/Scene01_Hook';
import {Scene02_Opportunity} from './scenes/Scene02_Opportunity';
import {Scene03_Brand} from './scenes/Scene03_Brand';
import {Scene04_KineticWords} from './scenes/Scene04_KineticWords';
import {Scene05_EventReveal} from './scenes/Scene05_EventReveal';
import {Scene06_CTA} from './scenes/Scene06_CTA';

/**
 * Fenêtres d'activité des scènes (frames absolues). Elles se chevauchent
 * volontairement : chaque transition prolonge le mouvement de la scène
 * précédente au lieu de couper. Les bornes « éditoriales » (0/150/300/475/625/825)
 * sont dans config/timeline.json.
 */
const WINDOWS: {id: string; from: number; to: number; C: React.FC<{f: number}>}[] = [
  {id: 's1', from: SCENES.s1[0], to: 152, C: Scene01_Hook},
  {id: 's2', from: 151, to: 306, C: Scene02_Opportunity},
  {id: 's3', from: 284, to: 482, C: Scene03_Brand},
  {id: 's4', from: 473, to: 626, C: Scene04_KineticWords},
  {id: 's5', from: 596, to: 832, C: Scene05_EventReveal},
  {id: 's6', from: 806, to: SCENES.s6[1], C: Scene06_CTA},
];

export const GSN40: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  return (
    <AbsoluteFill style={{background: COLORS.night, overflow: 'hidden'}}>
      {/* ordre d'empilement : pendant un chevauchement, la scène sortante reste AU-DESSUS
          (elle « ouvre » la suivante), sauf la scène 06 dont la carte blanche recouvre la 05 */}
      {ready
        ? [...WINDOWS.slice(0, 5)].reverse().concat(WINDOWS[5]).map(({id, from, to, C}) => (f >= from && f < to ? <C key={id} f={f} /> : null))
        : null}
      <Vignette strength={f >= 548 && f < 600 ? 0.12 : f >= 830 ? 0.08 : 0.5} />
      <Grain frame={f} opacity={f >= 830 ? 0.035 : 0.06} />
      <AudioController />
    </AbsoluteFill>
  );
};
