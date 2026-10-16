import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CONTENT} from '../../config';
import {DroneBackground} from '../../components/DroneBackground';
import {PinIcon} from '../../components/Icons';
import {CONDENSED} from '../../fonts';
import {EASE_OUT, sp, tw, useSceneTime} from '../../lib/anim';
import {Highlight, Label} from '../parts';
import {PALETTE, V2_CUES, V2_SCENES} from '../timeline';

const S = V2_SCENES.destination;

/** Lettres qui montent une à une depuis un masque. */
const Letters: React.FC<{t: number; start: number; text: string; size: number; stagger?: number}> = ({
  t,
  start,
  text,
  size,
  stagger = 0.035,
}) => (
  <div style={{display: 'flex', justifyContent: 'center', overflow: 'hidden', lineHeight: 0.92, paddingTop: size * 0.04}}>
    {text.split('').map((ch, i) => {
      const p = tw(t, start + i * stagger, start + i * stagger + 0.4, 0, 1, EASE_OUT);
      return (
        <span
          key={i}
          style={{
            fontFamily: CONDENSED,
            fontSize: size,
            lineHeight: 0.92,
            color: PALETTE.white,
            display: 'inline-block',
            whiteSpace: 'pre',
            transform: `translateY(${(1 - p) * 110}%)`,
            textShadow: '0 10px 34px rgba(0,0,0,0.35)',
          }}
        >
          {ch}
        </span>
      );
    })}
  </div>
);

export const DestinationV2: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  // entrée : glissement vertical rapide avec flou de mouvement
  const enter = tw(t, S.in, S.in + 0.28, 1, 0, EASE_OUT);
  const exit = tw(t, S.out - 0.12, S.out, 0, 1);
  const pulse = sp(t, V2_CUES.destNameSaid, fps, {damping: 10, stiffness: 220, mass: 0.5});
  const nameScale = t >= V2_CUES.destNameSaid ? 1.06 - pulse * 0.06 : 1;
  const brand = tw(t, V2_CUES.destBrand, V2_CUES.destBrand + 0.45, 0, 1, EASE_OUT);
  const loc = tw(t, S.in + 0.1, S.in + 0.45, 0, 1, EASE_OUT);
  const [n1, n2] = content.destination;

  return (
    <AbsoluteFill style={{transform: `translateY(${enter * 1920}px)`, opacity: 1 - exit}}>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id="v2DestBlur">
          <feGaussianBlur stdDeviation={`0 ${enter * 50}`} />
        </filter>
      </svg>
      <AbsoluteFill style={{filter: enter > 0.01 ? 'url(#v2DestBlur)' : undefined}}>
        <DroneBackground duration={S.out - S.in} trimStart={3.5} rate={1.1} pan={[0.3, 0.48]} zoom={[1.3, 1.05]} filter="saturate(0.9)" />
        <AbsoluteFill
          style={{background: 'linear-gradient(180deg, rgba(14,26,38,0.8) 0%, rgba(14,26,38,0.55) 50%, rgba(14,26,38,0.1) 72%, rgba(14,26,38,0.55) 100%)'}}
        />
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 240}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, opacity: loc, transform: `translateY(${(1 - loc) * 20}px)`}}>
            <PinIcon size={30} color={PALETTE.coral} />
            <Label size={28}>{content.location}</Label>
          </div>
          <div style={{marginTop: 26, transform: `scale(${nameScale})`}}>
            <Letters t={t} start={V2_CUES.destTitle} text={n1} size={200} />
            <Letters t={t} start={V2_CUES.destTitle + 0.2} text={n2} size={390} stagger={0.05} />
          </div>
          <div style={{marginTop: 30}}>
            <Highlight t={t} start={V2_CUES.destDates} size={80}>
              {content.day1} & {content.day2} {content.month}
            </Highlight>
          </div>
          <div style={{marginTop: 34, opacity: brand, transform: `translateY(${(1 - brand) * 24}px)`}}>
            <Label size={32} style={{letterSpacing: `${0.4 - brand * 0.14}em`}}>
              {content.brand}
            </Label>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
