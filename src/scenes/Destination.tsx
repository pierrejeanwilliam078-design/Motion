import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CONTENT, CUES, GRADIENTS, SCENES} from '../config';
import {DroneBackground} from '../components/DroneBackground';
import {DepthLetters, GradientText, Pill} from '../components/Typography';
import {PinIcon} from '../components/Icons';
import {DISPLAY} from '../fonts';
import {EASE_OUT, tw, useSceneTime} from '../lib/anim';

const S = SCENES.destination;

export const Destination: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t} = useSceneTime(S.in);
  // entrée : zoom depuis le flou (continuité du fly-through du hook)
  const enter = tw(t, S.in, S.in + 0.45, 0, 1, EASE_OUT);
  // parallaxe : le titre dérive moins vite que le décor
  const drift = tw(t, S.in, S.out, 0, 1);
  const shine = tw(t, CUES.destNameSaid, CUES.destNameSaid + 0.9, 0, 1);
  const brand = tw(t, CUES.destBrand, CUES.destBrand + 0.7, 0, 1);
  const chip = tw(t, CUES.destDates, CUES.destDates + 0.6, 0, 1);
  const tag = tw(t, S.in + 0.2, S.in + 0.8, 0, 1);
  const [n1, n2] = content.destination;

  return (
    <AbsoluteFill
      style={{
        opacity: enter,
        transform: `scale(${1.25 - enter * 0.25})`,
        filter: `blur(${(1 - enter) * 24}px)`,
      }}
    >
      <DroneBackground duration={S.out - S.in} trimStart={3.5} rate={0.8} pan={[0.3, 0.46]} zoom={[1.02, 1.22]} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(6,36,74,0.75) 0%, rgba(6,36,74,0.35) 40%, rgba(6,36,74,0) 62%, rgba(6,36,74,0.45) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          paddingTop: 330,
          transform: `translateY(${-drift * 40}px)`,
        }}
      >
        <div style={{opacity: tag, transform: `translateY(${(1 - tag) * 20}px)`}}>
          <Pill style={{fontSize: 30}}>
            <PinIcon size={34} color="#FFC94A" />
            {content.location}
          </Pill>
        </div>
        <div style={{marginTop: 40, textAlign: 'center'}}>
          <DepthLetters
            t={t}
            start={CUES.destTitle}
            text={n1}
            render={(ch) => (
              <GradientText gradient={GRADIENTS.ocean} size={132} shine={shine}>
                {ch}
              </GradientText>
            )}
          />
        </div>
        <div style={{marginTop: -6, textAlign: 'center'}}>
          <DepthLetters
            t={t}
            start={CUES.destTitle + 0.3}
            stagger={0.07}
            text={n2}
            render={(ch) => (
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  fontSize: 250,
                  lineHeight: 0.95,
                  color: 'white',
                  letterSpacing: '0.02em',
                  textShadow: '0 14px 40px rgba(0,0,0,0.45)',
                }}
              >
                {ch}
              </span>
            )}
          />
        </div>
        {/* signature de la marque */}
        <div
          style={{
            marginTop: 26,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            opacity: brand,
            transform: `translateY(${(1 - brand) * 24}px)`,
          }}
        >
          <div style={{height: 3, width: 90 * brand, background: 'linear-gradient(90deg, rgba(255,255,255,0), #FFC94A)'}} />
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 38,
              letterSpacing: `${0.3 - brand * 0.12}em`,
              color: 'white',
              textShadow: '0 4px 18px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            {content.brand}
          </div>
          <div style={{height: 3, width: 90 * brand, background: 'linear-gradient(90deg, #FFC94A, rgba(255,255,255,0))'}} />
        </div>
        <div
          style={{
            marginTop: 40,
            opacity: chip,
            transform: `scale(${0.8 + chip * 0.2})`,
          }}
        >
          <Pill style={{fontSize: 36, background: 'rgba(255,122,53,0.85)', border: '2px solid rgba(255,255,255,0.7)'}}>
            {content.day1} & {content.day2} {content.month}
          </Pill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
