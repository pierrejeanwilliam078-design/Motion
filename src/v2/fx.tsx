// Effets « énergie » de la V2 : caméra qui pulse sur le tempo, secousses, textes qui claquent,
// ondes de choc, éclats, volets tricolores, glitch et flou de mouvement.
import React from 'react';
import { clamp, ease, interp, lerp, progress, rand, spring } from '../lib/motion';
import { COLORS, GRADIENTS, gradientText } from '../theme';
import { BEAT2, GROOVE2, IMPACTS2 } from './timeline2';

const inRange = (t: number, [a, b]: readonly [number, number]) => t >= a - 0.001 && t < b - 0.001;

/** Petit « punch » d'échelle sur chaque temps où le kick joue. */
export function beatPunch(t: number) {
  const b = Math.floor(t / BEAT2 + 1e-6);
  const tb = b * BEAT2;
  const active = inRange(tb, GROOVE2.full) || inRange(tb, GROOVE2.introBeat) || (inRange(tb, GROOVE2.half) && b % 2 === 0);
  if (!active) return 0;
  return (b % 4 === 0 ? 0.02 : 0.011) * Math.exp(-(t - tb) / 0.1);
}

/** Secousse amortie après chaque impact. */
export function shake(t: number) {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const [ti, amp] of IMPACTS2) {
    const dt = t - ti;
    if (dt < 0 || dt > 0.6) continue;
    const a = Math.min(amp, 16) * Math.exp(-dt * 9);
    x += a * Math.sin(dt * 58 + ti);
    y += a * 0.7 * Math.cos(dt * 47 + ti);
    r += a * 0.035 * Math.sin(dt * 39);
  }
  return { x, y, r };
}

export function Camera({ t, children }: { t: number; children: React.ReactNode }) {
  const p = beatPunch(t);
  const s = shake(t);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg) scale(${1.03 + p})` }}>
      {children}
    </div>
  );
}

/** Texte qui « claque » : arrive grand et flou, se pose en ressort, laisse deux contours en écho. */
export function Slam({
  text,
  t,
  at,
  style,
  from = 1.7,
  echo = true,
  echoColor = 'rgba(31, 91, 255, 0.55)',
  gradient,
}: {
  text: string;
  t: number;
  at: number;
  style?: React.CSSProperties;
  from?: number;
  echo?: boolean;
  echoColor?: string;
  gradient?: string;
}) {
  const dt = t - at;
  const sp = spring(dt, { stiffness: 420, damping: 23 });
  const visible = dt >= 0;
  const e = progress(dt, 0.02, 0.42);
  const base: React.CSSProperties = { display: 'inline-block', whiteSpace: 'nowrap', ...style };
  return (
    <span style={{ position: 'relative', display: 'inline-block', opacity: visible ? clamp(dt / 0.05) : 0 }}>
      <span
        style={{
          ...base,
          transform: `scale(${visible ? lerp(from, 1, sp) : from})`,
          filter: visible && sp < 0.98 ? `blur(${(1 - sp) * 14}px)` : undefined,
          ...(gradient ? gradientText(gradient) : null),
        }}
      >
        {text}
      </span>
      {echo &&
        visible &&
        e < 1 &&
        [1, 2].map((k) => (
          <span
            key={k}
            aria-hidden
            style={{
              ...base,
              position: 'absolute',
              left: 0,
              top: 0,
              color: 'transparent',
              WebkitTextStroke: `3px ${echoColor}`,
              transform: `scale(${1 + k * 0.1 * ease.out(e)})`,
              opacity: (1 - e) * (k === 1 ? 0.7 : 0.4),
              pointerEvents: 'none',
            }}
          >
            {text}
          </span>
        ))}
    </span>
  );
}

const clean = (w: string) => w.replace(/[.,!?;:«»"]/g, '').toLowerCase();

/** Phrase dont chaque mot claque à son tour ; les mots clés reçoivent un « bloc » de couleur. */
export function SlamWords({
  text,
  t,
  start,
  step,
  style,
  emphasis = [],
  boxAt,
  boxGradient = GRADIENTS.brandWarm,
  emphasisGradient,
  exitAt,
  color = COLORS.ink,
}: {
  text: string;
  t: number;
  start: number;
  step: number;
  style?: React.CSSProperties;
  emphasis?: string[];
  boxAt?: number;
  boxGradient?: string;
  emphasisGradient?: string;
  exitAt?: number;
  color?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const emph = new Set(emphasis.map(clean));
  let k = 0;
  const out = exitAt === undefined ? 0 : ease.in(progress(t, exitAt, exitAt + 0.28));
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: '0.26em',
        rowGap: '0.08em',
        color,
        transform: `translateY(${-out * 140}px)`,
        opacity: 1 - out,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const isE = emph.has(clean(w));
        const ki = isE ? k++ : 0;
        const box = isE && boxAt !== undefined ? ease.inOut(progress(t, boxAt + ki * 0.07, boxAt + ki * 0.07 + 0.22)) : 0;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
            {box > 0 && (
              <span
                style={{
                  position: 'absolute',
                  left: '-0.12em',
                  right: '-0.12em',
                  top: '0.04em',
                  bottom: '-0.02em',
                  borderRadius: '0.16em',
                  background: boxGradient,
                  transform: `scaleX(${box})`,
                  transformOrigin: 'left center',
                }}
              />
            )}
            <span style={{ position: 'relative', color: box > 0.5 ? '#fff' : undefined }}>
              <Slam
                text={w}
                t={t}
                at={start + i * step}
                from={1.55}
                echo={false}
                gradient={isE && box <= 0.5 && emphasisGradient ? emphasisGradient : undefined}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Onde de choc circulaire. */
export function Shockwave({ t, at, x, y, size = 900, color = COLORS.violet, width = 6, dur = 0.65 }: { t: number; at: number; x: number; y: number; size?: number; color?: string; width?: number; dur?: number }) {
  const p = progress(t, at, at + dur);
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${width}px solid ${color}`,
        transform: `scale(${0.12 + 0.88 * ease.out(p)})`,
        opacity: 1 - p,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Éclats radiaux (traits qui jaillissent). */
export function Burst({ t, at, x, y, count = 10, r0 = 120, r1 = 300, color = COLORS.blue, width = 8 }: { t: number; at: number; x: number; y: number; count?: number; r0?: number; r1?: number; color?: string; width?: number }) {
  const p = progress(t, at, at + 0.45);
  if (p <= 0 || p >= 1) return null;
  const head = ease.out(p);
  const tail = ease.in(p);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.2;
        const ra = lerp(r0, r1, tail);
        const rb = lerp(r0, r1, head);
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * ra}
            y1={y + Math.sin(a) * ra}
            x2={x + Math.cos(a) * rb}
            y2={y + Math.sin(a) * rb}
            stroke={i % 2 ? COLORS.cyan : color}
            strokeWidth={width}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/** Volets diagonaux cyan / bleu / violet : couvrent l'écran puis le libèrent. */
export function TriWipe({ t, start, switchAt }: { t: number; start: number; switchAt: number }) {
  if (t < start || t > switchAt + 0.6) return null;
  const colors = [COLORS.cyan, COLORS.blue, COLORS.violet];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {colors.map((c, i) => {
        const pin = ease.inOut(progress(t, start + i * 0.06, start + i * 0.06 + 0.3));
        const pout = ease.inOut(progress(t, switchAt + 0.02 + (2 - i) * 0.06, switchAt + 0.02 + (2 - i) * 0.06 + 0.3));
        const x = lerp(-1700, 0, pin) + lerp(0, 1700, pout);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: -200,
              bottom: -200,
              left: -260,
              width: 1600,
              background: c,
              transform: `translateX(${x}px) skewX(-14deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Découpe en tranches décalées + bandes colorées (glitch numérique). */
export function Glitch({ t, start, end, children }: { t: number; start: number; end: number; children: React.ReactNode }) {
  if (t < start || t >= end) return <>{children}</>;
  const step = Math.floor(t * 30);
  const k = progress(t, start, end);
  const slices = 5;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: slices }, (_, i) => {
        const y0 = (i / slices) * 100;
        const y1 = ((i + 1) / slices) * 100;
        const off = (rand(step * 13 + i) - 0.5) * 180 * (0.4 + k);
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${y0}% 0 ${100 - y1}% 0)`, transform: `translateX(${off}px)` }}>
            {children}
          </div>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={`b${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: rand(step * 7 + i) * 1920,
            height: 12 + rand(step * 3 + i) * 70,
            background: i % 2 ? COLORS.cyan : COLORS.magenta,
            mixBlendMode: 'screen',
            opacity: 0.55,
            transform: `translateX(${(rand(step + i * 5) - 0.5) * 300}px)`,
          }}
        />
      ))}
    </div>
  );
}

/** Filtre SVG de flou directionnel (horizontal) pour les whip pans. */
export function MotionBlurDefs({ amount }: { amount: number }) {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <filter id="v2-mblur" x="-20%" y="0" width="140%" height="100%">
        <feGaussianBlur stdDeviation={`${Math.max(0, amount)} 0`} />
      </filter>
    </svg>
  );
}

/** Flash blanc ponctuel. */
export function Flash({ t, at, before = 0.1, after = 0.3, color = '#fff' }: { t: number; at: number; before?: number; after?: number; color?: string }) {
  const o = interp(t, [at - before, at, at + after], [0, 1, 0], ease.soft);
  if (o <= 0) return null;
  return <div style={{ position: 'absolute', inset: 0, background: color, opacity: o, pointerEvents: 'none' }} />;
}
