import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CONTENT, CUES, GRADIENTS, SCENES} from '../config';
import {DroneBackground} from '../components/DroneBackground';
import {Pill} from '../components/Typography';
import {CheckIcon, InfoIcon} from '../components/Icons';
import {DISPLAY} from '../fonts';
import {EASE_IN_OUT, EASE_OUT, sp, tw, useSceneTime} from '../lib/anim';

const S = SCENES.price;
const DIGIT_H = 1.0; // hauteur d'un chiffre en em

/** Chiffre « machine à sous » : défile puis se pose sur sa valeur. */
const RollingDigit: React.FC<{digit: number; progress: number; spins: number; paint: React.CSSProperties}> = ({
  digit,
  progress,
  spins,
  paint,
}) => {
  const total = spins * 10 + digit;
  const pos = total * progress;
  return (
    <span style={{display: 'inline-block', height: `${DIGIT_H}em`, overflow: 'hidden', verticalAlign: 'top'}}>
      <span style={{display: 'block', transform: `translateY(${-(pos % 10) * DIGIT_H}em)`}}>
        {[...Array(11)].map((_, i) => (
          <span key={i} style={{display: 'block', height: `${DIGIT_H}em`, lineHeight: `${DIGIT_H}em`, ...paint}}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
};

export const Price: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  // entrée « whip pan » depuis la droite
  const whipIn = tw(t, 17.85, 18.2, 1, 0, EASE_OUT);
  const label = tw(t, CUES.priceLabel, CUES.priceLabel + 0.5, 0, 1);
  const land = sp(t, CUES.priceLand, fps, {damping: 9, mass: 0.6, stiffness: 200});
  const punch = t >= CUES.priceLand ? 1 + (1 - land) * 0.18 : 1;
  const glow = tw(t, CUES.priceLand, CUES.priceLand + 0.25, 0, 1) * tw(t, CUES.priceLand + 0.25, CUES.priceLand + 1.6, 1, 0.45);
  const shine = tw(t, CUES.priceLand + 0.1, CUES.priceLand + 1.1, 0, 1);
  const numberIn = tw(t, CUES.priceRoll - 0.15, CUES.priceRoll + 0.2, 0, 1);
  const rays = t * 12;
  const exclusion = tw(t, CUES.exclusion, CUES.exclusion + 0.5, 0, 1);

  const digits = content.price.split('');
  let digitIndex = 0;

  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id="whipPrice">
          <feGaussianBlur stdDeviation={`${whipIn * 60} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: `translateX(${whipIn * 1080}px)`, filter: whipIn > 0.01 ? 'url(#whipPrice)' : undefined}}>
        <DroneBackground duration={S.out - S.in} trimStart={1} rate={0.5} pan={[0.7, 0.55]} zoom={[1.4, 1.25]} blur={16} />
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, rgba(6,36,74,0.95) 0%, rgba(20,40,120,0.9) 45%, rgba(90,30,170,0.92) 100%)`,
          }}
        />
        {/* rayons de lumière rotatifs derrière le prix */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 900,
            top: 800 - 900,
            width: 1800,
            height: 1800,
            borderRadius: '50%',
            background:
              'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.09) 0deg 6deg, rgba(255,255,255,0) 6deg 18deg)',
            transform: `rotate(${rays}deg)`,
            maskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
            WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
            opacity: 0.4 + glow * 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 540 - 500,
            top: 800 - 400,
            width: 1000,
            height: 800,
            background: 'radial-gradient(ellipse, rgba(255,170,70,0.55) 0%, rgba(255,120,60,0) 65%)',
            opacity: glow,
            mixBlendMode: 'screen',
          }}
        />

        <AbsoluteFill style={{alignItems: 'center', paddingTop: 500}}>
          <div style={{opacity: label, transform: `translateY(${(1 - label) * 20}px)`}}>
            <Pill style={{fontSize: 34, letterSpacing: '0.25em'}}>{content.priceLabel}</Pill>
          </div>

          {/* PRIX */}
          <div
            style={{
              marginTop: 60,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              opacity: numberIn,
              transform: `scale(${punch})`,
              filter: `drop-shadow(0 0 ${glow * 40}px rgba(255,190,90,0.8))`,
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 200,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                fontVariantNumeric: 'tabular-nums',
                filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.35))',
              }}
            >
              {digits.map((ch, i) => {
                if (ch === ' ') return <span key={i} style={{display: 'inline-block', width: '0.28em'}} />;
                const idx = digitIndex++;
                const start = CUES.priceRoll + idx * 0.12;
                const progress = tw(t, start, CUES.priceLand - 0.05 + idx * 0.02, 0, 1, EASE_IN_OUT);
                // dégradé continu réparti sur l'ensemble des chiffres + reflet
                const pos = (i / Math.max(1, digits.length - 1)) * 100;
                const shineOn = Math.max(0, 1 - Math.abs(shine * (digits.length + 2) - 1 - i) / 1.2);
                const paint: React.CSSProperties = {
                  backgroundImage: GRADIENTS.sunset,
                  backgroundSize: `${digits.length * 100}% 100%`,
                  backgroundPosition: `${pos}% 0`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: `brightness(${1 + shineOn * 0.7})`,
                };
                return <RollingDigit key={i} digit={Number(ch)} progress={progress} spins={2 + idx} paint={paint} />;
              })}
            </span>
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 96,
                color: 'white',
                marginLeft: 16,
                opacity: tw(t, CUES.priceLand - 0.1, CUES.priceLand + 0.2, 0, 1),
              }}
            >
              {content.currency}
            </span>
          </div>

          {/* PRESTATIONS INCLUSES */}
          <div
            style={{
              marginTop: 70,
              width: 940,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              columnGap: 18,
              rowGap: 22,
            }}
          >
            {content.inclusions.map((item, i) => {
              const s = sp(t, CUES.inclusions[i], fps, {damping: 12, mass: 0.6, stiffness: 180});
              return (
                <React.Fragment key={item}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 24px',
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.12)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      fontFamily: DISPLAY,
                      fontWeight: 800,
                      fontSize: 40,
                      color: 'white',
                      letterSpacing: '0.03em',
                      opacity: Math.min(1, s * 1.5),
                      transform: `translateY(${(1 - s) * 40}px) scale(${0.7 + s * 0.3})`,
                    }}
                  >
                    <CheckIcon size={38} color={i % 2 ? COLORS.sunset : COLORS.turquoise} />
                    {item}
                  </div>
                  {i < content.inclusions.length - 1 && i !== 1 ? (
                    <div style={{alignSelf: 'center', color: COLORS.gold, fontSize: 44, opacity: s, fontFamily: DISPLAY}}>•</div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>

          {/* MENTION OBLIGATOIRE */}
          <div
            style={{
              marginTop: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 30px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.38)',
              border: '2px solid rgba(255,201,74,0.8)',
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 40,
              color: 'white',
              opacity: exclusion,
              transform: `translateY(${(1 - exclusion) * 30}px)`,
            }}
          >
            <InfoIcon size={40} />
            {content.exclusion}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
