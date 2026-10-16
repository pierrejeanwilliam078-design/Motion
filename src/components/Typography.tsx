import React from 'react';
import {DISPLAY} from '../fonts';
import {EASE_OUT, tw} from '../lib/anim';

/** Texte rempli d'un dégradé, avec reflet lumineux qui balaie les lettres. */
export const GradientText: React.FC<{
  children: React.ReactNode;
  gradient: string;
  size: number;
  shine?: number; // 0 → 1 : position du reflet (au-delà = invisible)
  style?: React.CSSProperties;
  weight?: number;
}> = ({children, gradient, size, shine = -1, style, weight = 900}) => {
  const shineX = -40 + shine * 180;
  return (
    <span
      style={{
        fontFamily: DISPLAY,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${shineX - 12}%, rgba(255,255,255,0.95) ${shineX}%, rgba(255,255,255,0) ${shineX + 12}%), ${gradient}`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.35))',
        display: 'inline-block',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * Révélation d'un mot par masque : le mot monte depuis sous une ligne
 * invisible, avec un flou de mouvement qui se dissipe.
 */
export const MaskReveal: React.FC<{
  t: number;
  start: number;
  children: React.ReactNode;
  duration?: number;
  style?: React.CSSProperties;
}> = ({t, start, children, duration = 0.55, style}) => {
  const p = tw(t, start, start + duration, 0, 1, EASE_OUT);
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em', marginBottom: '-0.08em', ...style}}>
      <span
        style={{
          display: 'inline-block',
          transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 6}deg)`,
          filter: `blur(${(1 - p) * 10}px)`,
          opacity: p > 0 ? 1 : 0,
          transformOrigin: 'left bottom',
        }}
      >
        {children}
      </span>
    </span>
  );
};

/** Lettres qui arrivent en profondeur (3D) les unes après les autres. */
export const DepthLetters: React.FC<{
  t: number;
  start: number;
  text: string;
  stagger?: number;
  render: (letter: string, i: number) => React.ReactNode;
}> = ({t, start, text, stagger = 0.045, render}) => (
  <span style={{display: 'inline-block', perspective: 900, whiteSpace: 'pre'}}>
    {text.split('').map((ch, i) => {
      const p = tw(t, start + i * stagger, start + i * stagger + 0.7, 0, 1, EASE_OUT);
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            transform: `translateZ(${(1 - p) * -700}px) translateY(${(1 - p) * 60}px) rotateX(${(1 - p) * 75}deg)`,
            opacity: Math.min(1, p * 1.6),
            filter: `blur(${(1 - p) * 14}px)`,
          }}
        >
          {render(ch, i)}
        </span>
      );
    })}
  </span>
);

export const Pill: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 30px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.14)',
      border: '2px solid rgba(255,255,255,0.45)',
      backdropFilter: 'blur(14px)',
      color: 'white',
      fontFamily: DISPLAY,
      fontWeight: 800,
      letterSpacing: '0.12em',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      ...style,
    }}
  >
    {children}
  </div>
);
