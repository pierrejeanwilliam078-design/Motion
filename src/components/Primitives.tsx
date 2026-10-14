import React from 'react';
import {AbsoluteFill, Img, random, staticFile} from 'remotion';
import {COLORS} from '../config/theme';
import {hexPoints} from '../lib/motion';

/** Calque plein cadre positionné en absolu. */
export const Layer: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <AbsoluteFill style={{pointerEvents: 'none', ...style}}>{children}</AbsoluteFill>
);

/**
 * Flou de mouvement directionnel contrôlé (filtre SVG gaussien anisotrope).
 * `x` / `y` = intensité en px, proportionnelle à la vitesse de l'élément.
 */
export const DirBlur: React.FC<{
  id: string;
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({id, x = 0, y = 0, style, children}) => {
  const bx = Math.min(Math.abs(x), 60);
  const by = Math.min(Math.abs(y), 60);
  const active = bx > 0.25 || by > 0.25;
  return (
    <>
      {active ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div style={{...style, filter: active ? `url(#${id})` : undefined}}>{children}</div>
    </>
  );
};

/** Grain film déterministe (change de graine toutes les 2 frames). */
export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.07}) => {
  const seed = Math.floor(frame / 2) % 12;
  return (
    <Layer style={{mixBlendMode: 'overlay', opacity}}>
      <svg width="1920" height="1080">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1920" height="1080" filter={`url(#grain-${seed})`} />
      </svg>
    </Layer>
  );
};

/** Vignettage cinéma. */
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <Layer
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(3,15,36,0) 55%, rgba(3,15,36,${strength}) 100%)`,
    }}
  />
);

/** Logo officiel GSN : ratio verrouillé, aucune déformation possible (seule la largeur est paramétrable). */
export const LOGO_RATIO = 392 / 517;
export const GsnLogo: React.FC<{width: number; style?: React.CSSProperties}> = ({width, style}) => (
  <Img
    src={staticFile('brand/gsn-logo.png')}
    style={{width, height: width * LOGO_RATIO, display: 'block', ...style}}
  />
);

/** Hexagone (motif issu du logo). */
export const Hex: React.FC<{
  cx: number;
  cy: number;
  r: number;
  rot?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}> = ({cx, cy, r, rot = 0, fill = 'none', stroke, strokeWidth = 2, opacity = 1}) => (
  <polygon
    points={hexPoints(cx, cy, r, rot)
      .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ')}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinejoin="round"
    opacity={opacity}
  />
);

/** Dégradé ambre → flamme, à référencer par url(#gsnFlame) dans un SVG. */
export const FlameGradientDefs: React.FC<{id?: string; x1?: string; x2?: string}> = ({id = 'gsnFlame', x1 = '0', x2 = '1'}) => (
  <linearGradient id={id} x1={x1} y1="0" x2={x2} y2="0">
    <stop offset="0" stopColor={COLORS.amber} />
    <stop offset="0.5" stopColor={COLORS.orange} />
    <stop offset="1" stopColor={COLORS.flame} />
  </linearGradient>
);

/** Arc segmenté : système de mouvement dérivé de l'arc rayé du logo (sans le reproduire ni le déformer). */
export const SegmentedArc: React.FC<{
  cx: number;
  cy: number;
  r: number;
  thickness: number;
  start: number; // degrés
  end: number; // degrés
  segments: number;
  reveal?: number; // 0..1 apparition échelonnée
  colors?: string[];
  gap?: number; // degrés
  taper?: boolean;
  opacity?: number;
}> = ({cx, cy, r, thickness, start, end, segments, reveal = 1, colors = [COLORS.brandCyan, COLORS.navy], gap = 1.2, taper = true, opacity = 1}) => {
  const span = (end - start) / segments;
  const paths: React.ReactNode[] = [];
  for (let i = 0; i < segments; i++) {
    const local = Math.max(0, Math.min(1, reveal * (segments + 3) / 3 - i / 3));
    if (local <= 0) continue;
    const a0 = start + i * span + gap / 2;
    const a1 = a0 + (span - gap) * local;
    const k = taper ? Math.pow(Math.sin((Math.PI * (i + 0.5)) / segments), 0.7) : 1;
    const t = thickness * (0.25 + 0.75 * k);
    const ro = r + t / 2;
    const ri = r - t / 2;
    const p = (rad: number, deg: number) => {
      const a = (deg * Math.PI) / 180;
      return `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
    };
    const large = a1 - a0 > 180 ? 1 : 0;
    const d = `M ${p(ro, a0)} A ${ro} ${ro} 0 ${large} 1 ${p(ro, a1)} L ${p(ri, a1)} A ${ri} ${ri} 0 ${large} 0 ${p(ri, a0)} Z`;
    paths.push(<path key={i} d={d} fill={colors[i % colors.length]} opacity={opacity} />);
  }
  return <g>{paths}</g>;
};

/** Petites lumières scintillantes déterministes. */
export const twinkle = (seed: number, frame: number) => {
  const base = 0.55 + 0.45 * random(`tw-${seed}`);
  const speed = 0.04 + 0.08 * random(`sp-${seed}`);
  return base * (0.75 + 0.25 * Math.sin(frame * speed + seed * 3.1));
};
