import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CONTENT, PHOTOS} from '../../config';
import {DroneBackground} from '../../components/DroneBackground';
import {EASE_IN, EASE_OUT, tw, useSceneTime} from '../../lib/anim';
import {FullPhoto, Highlight, Label, Line} from '../parts';
import {PALETTE, V2_CUES, V2_SCENES} from '../timeline';

const S = V2_SCENES.hook;
const FLICKS = [
  {src: PHOTOS.plage.src, focus: 0.68},
  {src: PHOTOS.shooting.src, focus: 0.46},
  {src: PHOTOS.soiree.src, focus: 0.42},
  {src: PHOTOS.nature.src, focus: 0.5},
];

export const HookV2: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t} = useSceneTime(S.in);
  const w = V2_CUES.hookWords;
  const f = V2_CUES.hookFlicks;
  const exit = tw(t, S.out - 0.2, S.out, 0, 1, EASE_IN);
  const brand = tw(t, 0, 0.4, 0, 1, EASE_OUT);
  const [l1, l2, l3, l4] = content.hook;

  return (
    <AbsoluteFill>
      {/* ouverture : plongée rapide sur la plage */}
      <DroneBackground duration={S.out - S.in} trimStart={0} rate={1} pan={[0.38, 0.42]} zoom={[1.6, 1.15]} filter="saturate(0.9)" />
      {/* « nouveau décor » : les photos défilent en coupes rapides */}
      {FLICKS.map((p, i) => (
        <FullPhoto key={p.src} src={p.src} t={t} start={f[i]} end={f[i + 1] ?? S.out + 0.1} focus={p.focus} dir={i % 2 ? -1 : 1} dim={0.45} />
      ))}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,26,38,0.55) 0%, rgba(14,26,38,0.1) 40%, rgba(14,26,38,0.6) 100%)'}} />

      <div style={{position: 'absolute', top: 120, left: 80, opacity: brand}}>
        <Label size={26}>{content.brand}</Label>
      </div>

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          paddingLeft: 80,
          paddingBottom: 80,
          transform: `translateY(${-exit * 260}px)`,
          filter: `blur(${exit * 14}px)`,
          opacity: 1 - exit,
        }}
      >
        <Line t={t} start={w[0]} size={140}>
          {l1}
        </Line>
        <Line t={t} start={w[2]} size={140}>
          {l2}
        </Line>
        <div style={{marginTop: 18}}>
          <Highlight t={t} start={w[4]} size={118}>
            {l3} {l4}
          </Highlight>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: PALETTE.ink, opacity: tw(t, 0, 0.12, 1, 0)}} />
    </AbsoluteFill>
  );
};
