import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CONTENT, CUES, GRADIENTS, SCENES} from '../config';
import {DroneBackground} from '../components/DroneBackground';
import {GradientText, MaskReveal} from '../components/Typography';
import {DISPLAY} from '../fonts';
import {EASE_IN, EASE_OUT, tw, useSceneTime} from '../lib/anim';

const S = SCENES.hook;

/** Coins de viseur d'appareil photo + mise au point automatique. */
const Viewfinder: React.FC<{t: number}> = ({t}) => {
  const p = tw(t, 0, 0.6, 0, 1);
  const inset = 70 + (1 - p) * 40;
  const fade = tw(t, 3.2, 3.8, 1, 0);
  const corner = (r: number): React.CSSProperties => ({
    position: 'absolute',
    width: 90,
    height: 90,
    borderColor: 'rgba(255,255,255,0.9)',
    borderStyle: 'solid',
    borderWidth: 0,
    transform: `rotate(${r}deg)`,
  });
  const focus = tw(t, 0.05, 0.55, 1.6, 1);
  const focusOpacity = tw(t, 0.05, 0.2, 0, 1) * tw(t, 0.9, 1.3, 1, 0);
  const rec = Math.floor(t * 2) % 2 === 0;
  return (
    <AbsoluteFill style={{opacity: fade * p}}>
      <div style={{...corner(0), left: inset, top: inset + 120, borderTopWidth: 6, borderLeftWidth: 6}} />
      <div style={{...corner(0), right: inset, top: inset + 120, borderTopWidth: 6, borderRightWidth: 6}} />
      <div style={{...corner(0), left: inset, bottom: inset + 260, borderBottomWidth: 6, borderLeftWidth: 6}} />
      <div style={{...corner(0), right: inset, bottom: inset + 260, borderBottomWidth: 6, borderRightWidth: 6}} />
      <div
        style={{
          position: 'absolute',
          left: inset + 24,
          top: inset + 150,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 30,
          color: 'white',
          letterSpacing: '0.1em',
        }}
      >
        <div style={{width: 20, height: 20, borderRadius: 10, background: '#FF3B4E', opacity: rec ? 1 : 0.25}} />
        REC
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          width: 170,
          height: 120,
          border: '4px solid rgba(255,214,90,0.95)',
          transform: `translate(-50%,-50%) scale(${focus})`,
          opacity: focusOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

export const Hook: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t} = useSceneTime(S.in);
  const w = CUES.hookWords;
  // sortie « fly-through » vers la scène suivante
  const exit = tw(t, 3.65, 4.15, 0, 1, EASE_IN);
  const underline = tw(t, w[5] + 0.3, w[5] + 0.85, 0, 1, EASE_OUT);
  const shine = tw(t, 2.5, 3.4, 0, 1);
  const [l1, l2, l3, l4] = content.hook;
  const [l1a, ...l1b] = l1.split(' ');
  const [l2a, ...l2b] = l2.split(' ');

  const white: React.CSSProperties = {
    fontFamily: DISPLAY,
    fontWeight: 900,
    fontSize: 86,
    color: 'white',
    lineHeight: 1.02,
    letterSpacing: '-0.01em',
    textShadow: '0 8px 30px rgba(0,0,0,0.45)',
  };

  return (
    <AbsoluteFill>
      <DroneBackground duration={S.out - S.in} trimStart={0} rate={0.85} pan={[0.36, 0.42]} zoom={[1.35, 1.12]} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(6,36,74,0.55) 0%, rgba(6,36,74,0.15) 35%, rgba(6,36,74,0.25) 60%, rgba(6,36,74,0.7) 100%)',
        }}
      />
      <Viewfinder t={t} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          transform: `scale(${1 + exit * 0.9})`,
          filter: `blur(${exit * 18}px)`,
          opacity: 1 - exit,
          paddingBottom: 120,
        }}
      >
        <div style={white}>
          <MaskReveal t={t} start={w[0]}>{l1a}</MaskReveal>{' '}
          <MaskReveal t={t} start={w[1]}>{l1b.join(' ')}</MaskReveal>
        </div>
        <div style={white}>
          <MaskReveal t={t} start={w[2]}>{l2a}</MaskReveal>{' '}
          <MaskReveal t={t} start={w[3]}>{l2b.join(' ')}</MaskReveal>
        </div>
        <div style={{marginTop: 14}}>
          <MaskReveal t={t} start={w[4]}>
            <GradientText gradient={GRADIENTS.sunset} size={156} shine={shine}>
              {l3}
            </GradientText>
          </MaskReveal>
        </div>
        <div style={{position: 'relative'}}>
          <MaskReveal t={t} start={w[5]}>
            <GradientText gradient={GRADIENTS.brand} size={156} shine={shine - 0.15}>
              {l4}
            </GradientText>
          </MaskReveal>
          {/* trait de pinceau sous « DÉCOR ! » */}
          <svg width={720} height={60} viewBox="0 0 720 60" style={{position: 'absolute', left: '50%', bottom: -42, transform: 'translateX(-50%)'}}>
            <path
              d="M12 38 C 180 14, 420 10, 708 30"
              stroke="#FFC94A"
              strokeWidth={14}
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - underline}
            />
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
