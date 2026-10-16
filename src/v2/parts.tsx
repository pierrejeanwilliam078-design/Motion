import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {CONDENSED, DISPLAY} from '../fonts';
import {EASE_OUT, tw} from '../lib/anim';
import {PALETTE} from './timeline';

/**
 * Photo plein écran recadrée en vertical (aucune déformation : simple
 * recadrage centré sur `focus`), avec « punch-in » à l'entrée puis
 * lente poussée de caméra.
 */
export const FullPhoto: React.FC<{
  src: string;
  t: number;
  start: number;
  end: number;
  focus?: number; // position horizontale du cadrage (0 = gauche, 1 = droite)
  dir?: 1 | -1;
  dim?: number;
}> = ({src, t, start, end, focus = 0.5, dir = 1, dim = 0.25}) => {
  if (t < start || t >= end) return null;
  const punch = tw(t, start, start + 0.35, 1.2, 1.07, EASE_OUT);
  const push = tw(t, start + 0.35, Math.max(end, start + 0.5), 0, 0.05, (n) => n);
  const slide = tw(t, start, start + 0.3, dir * 140, 0, EASE_OUT);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: PALETTE.ink}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${focus * 100}% 50%`,
          transform: `translateX(${slide}px) scale(${punch + push})`,
          filter: 'saturate(0.92) contrast(1.04)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(14,26,38,${dim}) 0%, rgba(14,26,38,0) 35%, rgba(14,26,38,0) 55%, rgba(14,26,38,${dim + 0.45}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Ligne de titre condensée qui jaillit d'un masque (rapide, nette). */
export const Line: React.FC<{
  t: number;
  start: number;
  children: React.ReactNode;
  size: number;
  color?: string;
  duration?: number;
  style?: React.CSSProperties;
}> = ({t, start, children, size, color = PALETTE.white, duration = 0.38, style}) => {
  const p = tw(t, start, start + duration, 0, 1, EASE_OUT);
  return (
    <div style={{overflow: 'hidden', lineHeight: 0.95, paddingTop: size * 0.04, ...style}}>
      <div
        style={{
          fontFamily: CONDENSED,
          fontSize: size,
          lineHeight: 0.95,
          color,
          textTransform: 'uppercase',
          transform: `translateY(${(1 - p) * 105}%) skewY(${(1 - p) * 6}deg)`,
          opacity: p > 0 ? 1 : 0,
          whiteSpace: 'nowrap',
          textShadow: color === PALETTE.white ? '0 6px 24px rgba(0,0,0,0.35)' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Bandeau sable qui s'étire derrière un mot (surlignage éditorial). */
export const Highlight: React.FC<{
  t: number;
  start: number;
  children: React.ReactNode;
  size: number;
  bg?: string;
  color?: string;
}> = ({t, start, children, size, bg = PALETTE.sand, color = PALETTE.ink}) => {
  const bar = tw(t, start, start + 0.3, 0, 1, EASE_OUT);
  const text = tw(t, start + 0.12, start + 0.42, 0, 1, EASE_OUT);
  return (
    <div style={{position: 'relative', display: 'inline-block', padding: `${size * 0.06}px ${size * 0.16}px ${size * 0.02}px`}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bg,
          transformOrigin: 'left center',
          transform: `scaleX(${bar})`,
        }}
      />
      <div style={{position: 'relative', overflow: 'hidden'}}>
        <div
          style={{
            fontFamily: CONDENSED,
            fontSize: size,
            lineHeight: 1,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transform: `translateY(${(1 - text) * 100}%)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/** Petit libellé espacé (Montserrat). */
export const Label: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({children, size = 28, color = PALETTE.white, opacity = 1, style}) => (
  <div
    style={{
      fontFamily: DISPLAY,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '0.28em',
      color,
      opacity,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      textShadow: '0 2px 12px rgba(0,0,0,0.35)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Flash blanc très court (déclenchement d'appareil photo, sans son). */
export const Flash: React.FC<{t: number; at: number}> = ({t, at}) => {
  const o = t < at ? 0 : tw(t, at, at + 0.22, 0.85, 0);
  if (o <= 0) return null;
  return <AbsoluteFill style={{backgroundColor: 'white', opacity: o}} />;
};
