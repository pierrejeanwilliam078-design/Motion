import React from 'react';
import { ease, progress, tween } from '../lib/motion';
import { COLORS, GRADIENTS, MONO, gradientText } from '../theme';

const clean = (w: string) => w.replace(/[.,!?;:«»"]/g, '').toLowerCase();

type WordsProps = {
  text: string;
  t: number;
  start: number;
  stagger?: number;
  dur?: number;
  /** « mask » : les mots montent derrière un masque ; « blur » : mise au point progressive. */
  mode?: 'mask' | 'blur';
  emphasis?: string[];
  emphasisGradient?: string;
  /** Instant où un surligneur se dessine sous les mots mis en valeur. */
  markerAt?: number;
  markerColor?: string;
  exitAt?: number;
  exitDur?: number;
  style?: React.CSSProperties;
};

/** Typographie cinétique : révélation mot par mot avec stagger. */
export function Words({
  text,
  t,
  start,
  stagger = 0.08,
  dur = 0.7,
  mode = 'mask',
  emphasis = [],
  emphasisGradient = GRADIENTS.brand,
  markerAt,
  markerColor = 'rgba(107, 28, 240, 0.18)',
  exitAt,
  exitDur = 0.45,
  style,
}: WordsProps) {
  const words = text.split(/\s+/).filter(Boolean);
  const emph = new Set(emphasis.map(clean));
  let markIndex = 0;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: '0.27em',
        rowGap: '0.02em',
        textAlign: 'center',
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = ease.out(progress(t, start + i * stagger, start + i * stagger + dur));
        const x = exitAt === undefined ? 0 : ease.in(progress(t, exitAt + i * 0.03, exitAt + i * 0.03 + exitDur));
        const isEmph = emph.has(clean(w));
        const mi = isEmph ? markIndex++ : 0;
        const marker =
          isEmph && markerAt !== undefined ? ease.inOut(progress(t, markerAt + mi * 0.12, markerAt + mi * 0.12 + 0.45)) : 0;
        const inner: React.CSSProperties =
          mode === 'mask'
            ? { transform: `translateY(${(1 - p) * 105 - x * 40}%)`, opacity: 1 - x }
            : {
                transform: `translateY(${(1 - p) * 0.35 - x * 0.4}em) scale(${0.96 + 0.04 * p})`,
                opacity: p * (1 - x),
                filter: p < 1 || x > 0 ? `blur(${(1 - p) * 14 + x * 10}px)` : undefined,
              };
        return (
          <span
            key={i}
            style={{
              position: 'relative',
              display: 'inline-block',
              overflow: mode === 'mask' ? 'hidden' : 'visible',
              padding: '0.04em 0.02em 0.14em',
              margin: '-0.04em -0.02em -0.14em',
            }}
          >
            {marker > 0 && (
              <span
                style={{
                  position: 'absolute',
                  left: '-0.06em',
                  right: '-0.06em',
                  bottom: '0.16em',
                  height: '0.32em',
                  borderRadius: '0.1em',
                  background: markerColor,
                  transform: `scaleX(${marker})`,
                  transformOrigin: 'left center',
                  opacity: 1 - x,
                }}
              />
            )}
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                ...inner,
                ...(isEmph ? gradientText(emphasisGradient) : null),
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Texte révélé caractère par caractère (composition progressive). */
export function Typewriter({ text, t, start, end, caret = true }: { text: string; t: number; start: number; end: number; caret?: boolean }) {
  const n = Math.round(text.length * progress(t, start, end));
  const blink = Math.floor(t * 2.4) % 2 === 0 || (t > start && t < end);
  return (
    <span>
      {text.slice(0, n)}
      {caret && t >= start - 0.4 && (
        <span
          style={{
            display: 'inline-block',
            width: 3,
            height: '1.05em',
            marginLeft: 4,
            verticalAlign: '-0.15em',
            background: COLORS.blue,
            opacity: blink ? 1 : 0,
          }}
        />
      )}
    </span>
  );
}

/** Pastille d'usage (micro-interaction en ressort). */
export function Chip({ label, t, at, dot = COLORS.blue }: { label: string; t: number; at: number; dot?: string }) {
  const p = tween(t, at, 0.5, 0, 1, ease.out);
  const s = 0.6 + 0.4 * (t < at ? 0 : 1 - Math.exp(-(t - at) * 9) * Math.cos((t - at) * 16));
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        height: 78,
        padding: '0 30px 0 24px',
        borderRadius: 39,
        background: 'rgba(255,255,255,0.92)',
        border: `1.5px solid ${COLORS.line}`,
        boxShadow: '0 10px 30px rgba(31, 91, 255, 0.10)',
        fontSize: 36,
        fontWeight: 600,
        color: COLORS.ink,
        whiteSpace: 'nowrap',
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px) scale(${s})`,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 7, background: dot, boxShadow: `0 0 0 6px ${dot}22` }} />
      {label}
    </div>
  );
}

/** Étiquette monospace (repère éditorial). */
export function MonoLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: '0.14em', fontWeight: 500, color: COLORS.inkSoft, ...style }}>
      {children}
    </div>
  );
}

/** Révélation lettre par lettre derrière un masque (titres de marques). */
export function Letters({ text, t, start, stagger = 0.035, dur = 0.6, style }: { text: string; t: number; start: number; stagger?: number; dur?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', whiteSpace: 'pre', ...style }}>
      {[...text].map((ch, i) => {
        const p = ease.out(progress(t, start + i * stagger, start + i * stagger + dur));
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', padding: '0.05em 0 0.12em', margin: '-0.05em 0 -0.12em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 8}deg)`, transformOrigin: 'left bottom' }}>{ch}</span>
          </span>
        );
      })}
    </div>
  );
}
