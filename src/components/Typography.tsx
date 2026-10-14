import React from 'react';
import {measureText} from '@remotion/layout-utils';
import {COLORS, FONTS} from '../config/theme';
import {EASE, clamp01, lerp, prog} from '../lib/motion';

export type FontSpec = {
  fontFamily: 'Space Grotesk' | 'Inter' | 'Unbounded';
  fontSize: number;
  fontWeight: number;
  letterSpacing?: number; // em
};

const family = (f: FontSpec['fontFamily']) => (f === 'Space Grotesk' ? FONTS.display : f === 'Unbounded' ? FONTS.wide : FONTS.body);

/** Largeur réelle (px) d'un texte, mesurée dans le navigateur avec la vraie police. */
export const textWidth = (text: string, spec: FontSpec) =>
  measureText({
    text,
    fontFamily: spec.fontFamily,
    fontSize: spec.fontSize,
    fontWeight: String(spec.fontWeight),
    letterSpacing: spec.letterSpacing ? `${spec.letterSpacing}em` : undefined,
    validateFontIsLoaded: true,
  }).width;

/** Positions x de chaque caractère (approche cumulée, crénage inclus). */
export const charOffsets = (text: string, spec: FontSpec) => {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) out.push(i === 0 ? 0 : textWidth(text.slice(0, i), spec));
  return out;
};

export const fontStyle = (spec: FontSpec): React.CSSProperties => ({
  fontFamily: family(spec.fontFamily),
  fontSize: spec.fontSize,
  fontWeight: spec.fontWeight,
  letterSpacing: spec.letterSpacing ? `${spec.letterSpacing}em` : undefined,
  lineHeight: 1,
  whiteSpace: 'pre',
});

/**
 * Révélation caractère par caractère : chaque lettre monte dans son propre masque.
 * order : 'ltr' | 'center' (du centre vers l'extérieur) | 'rtl'
 */
export const CharRise: React.FC<{
  text: string;
  spec: FontSpec;
  f: number;
  start: number;
  stagger?: number;
  dur?: number;
  order?: 'ltr' | 'center' | 'rtl';
  from?: number; // décalage vertical initial en % de la hauteur
  rotate?: number; // rotation initiale en degrés
  color?: string;
  style?: React.CSSProperties;
  charStyle?: (i: number, p: number) => React.CSSProperties;
  exit?: {start: number; dur?: number; stagger?: number; to?: number};
}> = ({text, spec, f, start, stagger = 1.4, dur = 16, order = 'ltr', from = 140, rotate = 0, color = COLORS.white, style, charStyle, exit}) => {
  const chars = [...text];
  const n = chars.length;
  const rank = (i: number) => {
    if (order === 'rtl') return n - 1 - i;
    if (order === 'center') return Math.abs(i - (n - 1) / 2);
    return i;
  };
  return (
    <div style={{display: 'flex', ...fontStyle(spec), color, ...style}}>
      {chars.map((c, i) => {
        const s = start + rank(i) * stagger;
        const p = prog(f, s, s + dur, EASE.out);
        let y = lerp(from, 0, p);
        let rot = lerp(rotate, 0, p);
        if (exit) {
          const es = exit.start + i * (exit.stagger ?? 0.8);
          const pe = prog(f, es, es + (exit.dur ?? 12), EASE.in);
          y += (exit.to ?? -110) * pe;
          rot += 0;
        }
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              paddingTop: '0.12em',
              paddingBottom: '0.08em',
              marginTop: '-0.12em',
              marginBottom: '-0.08em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${y}%) rotate(${rot}deg)`,
                transformOrigin: '0% 100%',
                ...(charStyle ? charStyle(i, p) : {}),
              }}
            >
              {c === ' ' ? ' ' : c}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/**
 * Mots synchronisés à la diction : chaque mot surgit (masque + netteté) à sa frame.
 */
export const WordSync: React.FC<{
  words: {text: string; at: number; color?: string}[];
  spec: FontSpec;
  f: number;
  color?: string;
  style?: React.CSSProperties;
  dur?: number;
  fadeOut?: [number, number];
}> = ({words, spec, f, color = COLORS.white, style, dur = 10, fadeOut}) => {
  const out = fadeOut ? 1 - prog(f, fadeOut[0], fadeOut[1], EASE.in) : 1;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', columnGap: '0.28em', ...fontStyle(spec), color, opacity: out, ...style}}>
      {words.map((w, i) => {
        const p = prog(f, w.at, w.at + dur, EASE.out);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em'}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${lerp(140, 0, p)}%)`,
                opacity: clamp01(p * 1.6),
                filter: p < 1 ? `blur(${lerp(6, 0, p).toFixed(2)}px)` : undefined,
                color: w.color ?? color,
              }}
            >
              {w.text}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Ligne de texte révélée par un masque glissant (wipe), avec trait lumineux en tête. */
export const WipeText: React.FC<{
  children: React.ReactNode;
  f: number;
  start: number;
  dur?: number;
  dir?: 'right' | 'up';
  edgeColor?: string;
  style?: React.CSSProperties;
}> = ({children, f, start, dur = 14, dir = 'right', edgeColor, style}) => {
  const p = prog(f, start, start + dur, EASE.out);
  const clip = dir === 'right' ? `inset(-20% ${(100 - p * 100).toFixed(2)}% -20% -2%)` : `inset(${(100 - p * 100).toFixed(2)}% -2% -20% -2%)`;
  return (
    <div style={{position: 'relative', ...style}}>
      <div style={{clipPath: clip}}>{children}</div>
      {edgeColor && p > 0 && p < 1 && dir === 'right' ? (
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            bottom: '-10%',
            left: `${p * 100}%`,
            width: 3,
            background: edgeColor,
            boxShadow: `0 0 18px ${edgeColor}`,
            opacity: Math.sin(p * Math.PI),
          }}
        />
      ) : null}
    </div>
  );
};

/** Pastille / tag éditorial (ex. « DEVENEZ EXPOSANT »). */
export const Tag: React.FC<{
  text: string;
  f: number;
  start: number;
  bg?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({text, f, start, bg = COLORS.cyan, color = COLORS.night, size = 30, style}) => {
  const p = prog(f, start, start + 14, EASE.out);
  const pt = prog(f, start + 4, start + 18, EASE.out);
  return (
    <div style={{position: 'relative', display: 'inline-block', ...style}}>
      <div
        style={{
          background: bg,
          clipPath: `inset(0 ${(100 - p * 100).toFixed(2)}% 0 0)`,
          padding: `${size * 0.42}px ${size * 0.8}px`,
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: 700,
            fontSize: size,
            letterSpacing: `${lerp(0.5, 0.16, pt)}em`,
            color,
            lineHeight: 1,
            opacity: pt,
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
