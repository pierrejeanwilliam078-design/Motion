import React from 'react';
import {FONTS} from '../config/theme';
import {FontSpec, fontStyle} from '../components/Typography';
import {EASE, clamp01, hash, lerp, prog} from '../lib/motion';

/**
 * KIT TYPOGRAPHIQUE — VERSION 4 « L'ÎLE DES OPPORTUNITÉS »
 * Chaque animation de texte a une intention : bascule 3D, décodage, vague,
 * chute, texte sur chemin. Toutes sont déterministes (fonction de la frame).
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&+';

/** Lettres qui basculent en 3D depuis l'arrière (axe X), avec léger dépassement. */
export const FlipChars: React.FC<{
  text: string;
  spec: FontSpec;
  f: number;
  start: number;
  stagger?: number;
  dur?: number;
  color?: string;
  charStyle?: (i: number, p: number) => React.CSSProperties;
  exit?: number; // frame de chute
  style?: React.CSSProperties;
  charStart?: (i: number) => number; // départ par lettre (synchronisation mot à mot)
}> = ({text, spec, f, start, stagger = 1, dur = 12, color = '#fff', charStyle, exit, style, charStart}) => (
  <div style={{display: 'flex', perspective: 900, ...fontStyle(spec), color, ...style}}>
    {[...text].map((c, i) => {
      const s0 = charStart ? charStart(i) : start + i * stagger;
      const p = prog(f, s0, s0 + dur, EASE.overshoot);
      let ty = 0;
      let rz = 0;
      let op = clamp01(p * 2.5);
      if (exit !== undefined) {
        const e = prog(f, exit + hash(i + text.length) * 6, exit + hash(i + text.length) * 6 + 14, (t) => t * t);
        ty = 900 * e;
        rz = (hash(i * 3.3) - 0.5) * 80 * e;
        op *= 1 - clamp01((e - 0.6) * 2.5);
      }
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            transform: `translateY(${ty}px) rotate(${rz}deg) rotateX(${lerp(-95, 0, Math.min(p, 1.1))}deg)`,
            transformOrigin: '50% 100%',
            opacity: op,
            ...(charStyle ? charStyle(i, p) : {}),
          }}
        >
          {c === ' ' ? ' ' : c}
        </span>
      );
    })}
  </div>
);

/** Décodage : caractères aléatoires qui se figent un par un sur le texte final. */
export const Scramble: React.FC<{
  text: string;
  spec: FontSpec;
  f: number;
  start: number;
  stagger?: number;
  settle?: number;
  color?: string;
  lockColor?: string;
  style?: React.CSSProperties;
}> = ({text, spec, f, start, stagger = 1.4, settle = 8, color = '#fff', lockColor, style}) => (
  <div style={{display: 'flex', ...fontStyle(spec), ...style}}>
    {[...text].map((c, i) => {
      const t0 = start + i * stagger;
      const locked = f >= t0 + settle;
      const visible = f >= t0;
      const rnd = GLYPHS[Math.floor(hash(i * 17.3 + Math.floor(f / 2) * 3.7) * GLYPHS.length)];
      const ch = c === ' ' ? ' ' : locked ? c : visible ? rnd : ' ';
      return (
        <span key={i} style={{display: 'inline-block', color: locked ? (lockColor ?? color) : color, opacity: visible ? (locked ? 1 : 0.55) : 0, minWidth: c === ' ' ? '0.3em' : undefined}}>
          {ch}
        </span>
      );
    })}
  </div>
);

/** Vague : chaque lettre monte puis ondule une fois. */
export const WaveChars: React.FC<{
  text: string;
  spec: FontSpec;
  f: number;
  start: number;
  stagger?: number;
  color?: string;
  charColor?: (i: number) => string | undefined;
  style?: React.CSSProperties;
}> = ({text, spec, f, start, stagger = 1.2, color = '#fff', charColor, style}) => (
  <div style={{display: 'flex', ...fontStyle(spec), color, ...style}}>
    {[...text].map((c, i) => {
      const s = start + i * stagger;
      const p = prog(f, s, s + 10, EASE.out);
      const w = f > s ? Math.sin((f - s) * 0.5) * 16 * Math.exp(-(f - s) / 9) : 0;
      return (
        <span key={i} style={{display: 'inline-block', overflow: 'visible', transform: `translateY(${lerp(120, 0, p) - w}px) scale(${lerp(0.6, 1, p)})`, opacity: clamp01(p * 2), color: charColor?.(i)}}>
          {c === ' ' ? ' ' : c}
        </span>
      );
    })}
  </div>
);

/** Petites particules qui jaillissent d'un point (impact). */
export const Burst: React.FC<{f: number; at: number; x: number; y: number; n?: number; colors?: string[]; spread?: number}> = ({f, at, x, y, n = 70, colors = ['#F9AE2F', '#0F9EDA', '#FFFFFF'], spread = 520}) => {
  if (f < at || f > at + 30) return null;
  const t = (f - at) / 30;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}).map((_, i) => {
        const a = hash(i * 7.7 + at) * Math.PI * 2;
        const d = spread * (0.25 + 0.75 * hash(i * 3.1 + at)) * (1 - Math.pow(1 - t, 3));
        return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d + 120 * t * t} r={(2 + 5 * hash(i + 99)) * (1 - t)} fill={colors[i % colors.length]} />;
      })}
    </svg>
  );
};

/** Libellé de ville (point + pastille). */
export const CityLabel: React.FC<{x: number; y: number; text: string; p: number; color: string; bg: string; side?: 'left' | 'right'; size?: number}> = ({x, y, text, p, color, bg, side = 'right', size = 24}) => (
  <div
    style={{
      position: 'absolute',
      left: side === 'right' ? x + 22 : undefined,
      right: side === 'left' ? 1920 - x + 22 : undefined,
      top: y - size * 0.9,
      background: bg,
      color,
      fontFamily: FONTS.body,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '0.16em',
      padding: `${size * 0.35}px ${size * 0.6}px`,
      borderRadius: size,
      whiteSpace: 'nowrap',
      clipPath: `inset(-10% ${side === 'right' ? (100 - p * 100).toFixed(1) : 0}% -10% ${side === 'left' ? (100 - p * 100).toFixed(1) : 0}% round ${size}px)`,
    }}
  >
    {text}
  </div>
);
