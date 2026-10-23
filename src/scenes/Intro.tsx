import React from 'react';
import { CUES } from '../timeline';
import { clamp, ease, lerp, progress, rand, spring, tween } from '../lib/motion';
import { COLORS, FONT } from '../theme';
import { Words, MonoLabel } from '../components/Text';
import type { SceneProps } from './types';

const I = CUES.intro;

// --- Morphing des lettres « IA » : des cercles se transforment en glyphes par interpolation de points.
type Pt = [number, number];
const N = 96;

function samplePolygon(poly: Pt[], n: number): Pt[] {
  const seg = poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length];
    return { p, q, len: Math.hypot(q[0] - p[0], q[1] - p[1]) };
  });
  const total = seg.reduce((s, x) => s + x.len, 0);
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * total;
    for (const s of seg) {
      if (d <= s.len) {
        const r = d / s.len;
        out.push([lerp(s.p[0], s.q[0], r), lerp(s.p[1], s.q[1], r)]);
        break;
      }
      d -= s.len;
    }
  }
  return out;
}

function sampleCircle(cx: number, cy: number, r: number, n: number): Pt[] {
  return Array.from({ length: n }, (_, k) => {
    const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
}

/** Aligne le point de départ de `b` sur celui de `a` pour un morphing sans torsion. */
function align(a: Pt[], b: Pt[]): Pt[] {
  let best = 0;
  let bestD = Infinity;
  for (let s = 0; s < b.length; s++) {
    let d = 0;
    for (let i = 0; i < a.length; i += 4) {
      const q = b[(i + s) % b.length];
      d += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
    }
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return b.map((_, i) => b[(i + best) % b.length]);
}

// Glyphes géométriques (viewBox 660 × 520).
const I_SHAPE: Pt[] = [[0, 0], [124, 0], [124, 520], [0, 520]];
const A_SHAPE: Pt[] = [[338, 0], [492, 0], [660, 520], [530, 520], [415, 150], [300, 520], [170, 520]];
const I_CENTER: Pt = [62, 260];
const A_CENTER: Pt = [415, 330];
const I_CIRCLE = sampleCircle(I_CENTER[0], I_CENTER[1], 62, N);
const A_CIRCLE = sampleCircle(A_CENTER[0], A_CENTER[1], 62, N);
const I_TARGET = align(I_CIRCLE, samplePolygon(I_SHAPE, N));
const A_TARGET = align(A_CIRCLE, samplePolygon(A_SHAPE, N));

const toPath = (pts: Pt[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z';
const mix = (a: Pt[], b: Pt[], p: number, scale: number, c: Pt): Pt[] =>
  a.map((pa, i) => {
    const x = lerp(pa[0], b[i][0], p);
    const y = lerp(pa[1], b[i][1], p);
    return [c[0] + (x - c[0]) * scale, c[1] + (y - c[1]) * scale];
  });

function IAMorph({ t }: { t: number }) {
  const grow = spring(t - (I.morphStart - 0.35), { stiffness: 220, damping: 18 });
  const m = ease.inOut(progress(t, I.morphStart, I.morphEnd));
  const bar = ease.out(progress(t, I.morphEnd - 0.2, I.morphEnd + 0.3));
  const shine = progress(t, I.morphEnd, I.morphEnd + 0.9);
  if (grow <= 0.001) return null;
  return (
    <svg viewBox="-20 -20 700 560" width={600} height={480} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ia-grad" x1="0" y1="0" x2="660" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={COLORS.cyan} />
          <stop offset="0.42" stopColor={COLORS.blue} />
          <stop offset="0.82" stopColor={COLORS.violet} />
          <stop offset="1" stopColor={COLORS.magenta} />
        </linearGradient>
        <linearGradient id="ia-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="ia-clip">
          <path d={toPath(mix(I_CIRCLE, I_TARGET, m, grow, I_CENTER))} />
          <path d={toPath(mix(A_CIRCLE, A_TARGET, m, grow, A_CENTER))} />
          <rect x={415 - 115 * bar} y={330} width={230 * bar} height={86} />
        </clipPath>
      </defs>
      <g clipPath="url(#ia-clip)">
        <rect x={-20} y={-20} width={700} height={560} fill="url(#ia-grad)" />
        {shine > 0 && shine < 1 && (
          <rect x={lerp(-300, 700, shine)} y={-40} width={220} height={620} fill="url(#ia-shine)" transform={`skewX(-18)`} />
        )}
      </g>
    </svg>
  );
}

/** Particules discrètes qui convergent vers les deux lettres. */
function Particles({ t }: { t: number }) {
  const conv = ease.inOut(progress(t, I.converge, I.morphStart + 0.1));
  const burst = ease.out(progress(t, I.morphEnd, I.morphEnd + 1.6));
  return (
    <>
      {Array.from({ length: 34 }, (_, i) => {
        const target = i % 2 ? A_CENTER : I_CENTER;
        // coordonnées du centre des lettres sur la scène (svg 600 px centré en x=540, top=470)
        const tx = 540 - 300 + ((target[0] + 20) / 700) * 600;
        const ty = 590 + ((target[1] + 20) / 560) * 480;
        const sx = 80 + rand(i * 3) * 920;
        const sy = 240 + rand(i * 3 + 1) * 1400;
        const drift = Math.sin(t * 0.8 + i) * 18;
        const ang = rand(i * 7) * Math.PI * 2;
        const dist = 160 + rand(i * 5) * 420;
        const x = lerp(sx + drift, tx, conv) + Math.cos(ang) * dist * burst;
        const y = lerp(sy - drift, ty, conv) + Math.sin(ang) * dist * burst;
        const size = 6 + rand(i * 11) * 12;
        const o = Math.min(tween(t, 0.05 + rand(i) * 0.3, 0.4), conv < 0.97 || burst > 0 ? 1 : 0) * (1 - burst) * 0.85;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              background: i % 3 === 0 ? COLORS.cyan : i % 3 === 1 ? COLORS.blue : COLORS.violet,
              opacity: clamp(o),
              boxShadow: `0 0 ${size * 1.5}px ${i % 3 === 0 ? COLORS.cyan : COLORS.violet}55`,
            }}
          />
        );
      })}
    </>
  );
}

export function Intro({ t, content, assets }: SceneProps) {
  if (t > I.maskEnd + 0.1) return null;
  const c = content.intro;
  const exit = ease.inOut(progress(t, I.maskStart, I.maskEnd));
  const lift = ease.inOut(progress(t, I.titleIn - 0.25, I.titleIn + 0.5));
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        fontFamily: FONT,
        transform: `scale(${1 + exit * 0.08})`,
        opacity: 1 - exit * 0.9,
        filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
      }}
    >
      <Particles t={t} />
      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          opacity: tween(t, 0.3, 0.6),
          transform: `translateY(${tween(t, 0.3, 0.8, 20, 0)}px)`,
        }}
      >
        <img src={assets.icon} width={64} height={64} style={{ display: 'block' }} />
        <MonoLabel style={{ color: COLORS.ink }}>DIGITALSUB</MonoLabel>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 590, display: 'flex', justifyContent: 'center', transform: `translateY(${-lift * 110}px) scale(${1 - lift * 0.18})` }}>
        <IAMorph t={t} />
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 1020 }}>
        <Words
          text={c.title}
          t={t}
          start={I.titleIn}
          stagger={0.09}
          style={{ fontSize: 86, fontWeight: 850, letterSpacing: '-0.025em', lineHeight: 1.02, color: COLORS.ink }}
        />
      </div>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 1270 }}>
        <Words
          text={c.subtitle}
          t={t}
          start={I.subtitleIn}
          stagger={0.05}
          dur={0.6}
          mode="blur"
          emphasis={['IA?']}
          style={{ fontSize: 50, fontWeight: 500, lineHeight: 1.25, color: COLORS.inkSoft }}
        />
      </div>
    </div>
  );
}
