import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CONTENT} from '../../config';
import {InfoIcon} from '../../components/Icons';
import {CONDENSED, DISPLAY} from '../../fonts';
import {EASE_IN_OUT, EASE_OUT, sp, tw, useSceneTime} from '../../lib/anim';
import {Label} from '../parts';
import {PALETTE, V2_CUES, V2_SCENES} from '../timeline';

const S = V2_SCENES.price;
const C = V2_CUES;

/** Chiffre qui défile verticalement puis se pose sur sa valeur. */
const RollingDigit: React.FC<{digit: number; progress: number; spins: number}> = ({digit, progress, spins}) => {
  const pos = (spins * 10 + digit) * progress;
  return (
    <span style={{display: 'inline-block', height: '1em', overflow: 'hidden', verticalAlign: 'top'}}>
      <span style={{display: 'block', transform: `translateY(${-(pos % 10)}em)`}}>
        {[...Array(11)].map((_, i) => (
          <span key={i} style={{display: 'block', height: '1em', lineHeight: '1em'}}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
};

export const PriceV2: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  // entrée : glissement latéral rapide
  const enter = tw(t, S.in, S.in + 0.28, 1, 0, EASE_OUT);
  const exit = tw(t, S.out - 0.1, S.out, 0, 1);
  const label = tw(t, C.priceLabel, C.priceLabel + 0.4, 0, 1, EASE_OUT);
  const land = sp(t, C.priceLand, fps, {damping: 10, mass: 0.5, stiffness: 240});
  const punch = t >= C.priceLand ? 1.08 - land * 0.08 : 1;
  const rule = tw(t, C.priceLand, C.priceLand + 0.5, 0, 1, EASE_OUT);
  const exclusion = tw(t, C.exclusion, C.exclusion + 0.4, 0, 1, EASE_OUT);
  const numIn = tw(t, C.priceRoll - 0.1, C.priceRoll + 0.15, 0, 1);
  let digitIndex = 0;

  return (
    <AbsoluteFill style={{transform: `translateX(${enter * 1080}px)`, opacity: 1 - exit, backgroundColor: PALETTE.ink}}>
      {/* lueur lagon très discrète */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(92,200,188,0.16) 0%, rgba(14,26,38,0) 60%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 470}}>
        <div style={{opacity: label, transform: `translateY(${(1 - label) * 20}px)`}}>
          <Label size={34} color={PALETTE.sand}>
            {content.priceLabel}
          </Label>
        </div>

        <div
          style={{
            marginTop: 30,
            display: 'flex',
            alignItems: 'flex-end',
            opacity: numIn,
            transform: `scale(${punch})`,
          }}
        >
          <span style={{fontFamily: CONDENSED, fontSize: 280, lineHeight: 1, color: PALETTE.white}}>
            {content.price.split('').map((ch, i) => {
              if (ch === ' ') return <span key={i} style={{display: 'inline-block', width: '0.2em'}} />;
              const idx = digitIndex++;
              const start = C.priceRoll + idx * 0.1;
              const progress = tw(t, start, C.priceLand - 0.05 + idx * 0.02, 0, 1, EASE_IN_OUT);
              return <RollingDigit key={i} digit={Number(ch)} progress={progress} spins={1 + idx} />;
            })}
          </span>
          <span
            style={{
              fontFamily: CONDENSED,
              fontSize: 130,
              lineHeight: 1.35,
              color: PALETTE.coral,
              marginLeft: 18,
              opacity: tw(t, C.priceLand - 0.1, C.priceLand + 0.15, 0, 1),
            }}
          >
            {content.currency}
          </span>
        </div>

        <div style={{marginTop: 30, width: 860 * rule, height: 3, backgroundColor: PALETTE.sand, opacity: 0.8}} />

        {/* prestations incluses */}
        <div style={{marginTop: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          {[content.inclusions.slice(0, 2), content.inclusions.slice(2)].map((row, r) => (
            <div key={r} style={{display: 'flex', alignItems: 'center', gap: 22}}>
              {row.map((item, j) => {
                const i = r * 2 + j;
                const p = tw(t, C.inclusions[i], C.inclusions[i] + 0.3, 0, 1, EASE_OUT);
                return (
                  <React.Fragment key={item}>
                    {j > 0 ? <span style={{color: PALETTE.lagoon, fontSize: 46, fontFamily: DISPLAY, opacity: p}}>•</span> : null}
                    <span
                      style={{
                        fontFamily: DISPLAY,
                        fontWeight: 800,
                        fontSize: 48,
                        letterSpacing: '0.04em',
                        color: PALETTE.white,
                        opacity: p,
                        transform: `translateX(${(1 - p) * -40}px)`,
                        display: 'inline-block',
                      }}
                    >
                      {item}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>

        {/* mention obligatoire */}
        <div
          style={{
            marginTop: 70,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 30px',
            border: `2px solid ${PALETTE.sand}`,
            borderRadius: 12,
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 40,
            color: PALETTE.sand,
            opacity: exclusion,
            transform: `translateY(${(1 - exclusion) * 24}px)`,
          }}
        >
          <InfoIcon size={40} />
          {content.exclusion}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
