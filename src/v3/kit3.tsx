import React from 'react';
import {Img, staticFile} from 'remotion';
import {COLORS, FONTS} from '../config/theme';
import {SegmentedArc} from '../components/Primitives';
import {EASE, clamp01, lerp, prog} from '../lib/motion';
import {PinIcon} from '../v2/kit';

/**
 * KIT — VERSION 3 « DESTINATION TOAMASINA »
 * Charte stricte du logo GSN : marine #02426E, cyan #0F9EDA, ambre #F9AE2F,
 * orange #F0592E, blanc. (Le marine profond #01263F n'est qu'une ombre du marine.)
 */
export const C3 = {
  navy: COLORS.navy,
  deep: '#01263F',
  cyan: COLORS.brandCyan,
  amber: COLORS.amber,
  flame: COLORS.flame,
  white: '#FFFFFF',
};

export const NAVY_BG = `radial-gradient(ellipse 80% 80% at 60% 45%, #0A5486 0%, ${C3.navy} 48%, ${C3.deep} 100%)`;

/** Photos fournies, agrandies ×3 (scripts/prep_photos_v3.py). Tailles intrinsèques. */
export const PHOTOS = {
  arena: {src: 'media/v3/toamasina-arena.jpg', fg: 'media/v3/toamasina-arena-fg.webp', w: 1422, h: 1842, poi: [0.54, 0.655] as [number, number]},
  tana: {src: 'media/v3/antananarivo.jpg', fg: 'media/v3/antananarivo-fg.webp', w: 1422, h: 948, poi: [0.49, 0.72] as [number, number]},
};
export type PhotoKey = keyof typeof PHOTOS;

/**
 * Géométrie « cover » d'une photo dans un cadre W×H, centrée sur un point d'intérêt
 * normalisé (fx, fy), avec zoom. Renvoie l'échelle et la position du coin haut-gauche.
 */
export const cover = (key: PhotoKey, W: number, H: number, zoom = 1, fx = 0.5, fy = 0.5) => {
  const p = PHOTOS[key];
  const s = Math.max(W / p.w, H / p.h) * zoom;
  const iw = p.w * s;
  const ih = p.h * s;
  const x = Math.min(0, Math.max(W - iw, W / 2 - fx * iw));
  const y = Math.min(0, Math.max(H - ih, H / 2 - fy * ih));
  return {s, x, y, iw, ih, at: (nx: number, ny: number) => [x + nx * iw, y + ny * ih] as [number, number]};
};

/**
 * Photo animée en 2,5D : arrière-plan + calque de premier plan détouré qui glisse
 * un peu plus vite (parallaxe). `geo` vient de cover().
 */
export const Photo: React.FC<{
  k: PhotoKey;
  geo: ReturnType<typeof cover>;
  parallax?: number; // px
  blur?: number;
  style?: React.CSSProperties;
}> = ({k, geo, parallax = 0, blur = 0, style}) => {
  const p = PHOTOS[k];
  const base: React.CSSProperties = {position: 'absolute', width: geo.iw, height: geo.ih, maxWidth: 'none'};
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', filter: blur > 0.2 ? `blur(${blur}px)` : undefined, ...style}}>
      <Img src={staticFile(p.src)} style={{...base, left: geo.x - parallax * 0.35, top: geo.y}} />
      <Img src={staticFile(p.fg)} style={{...base, left: geo.x + parallax * 0.65, top: geo.y + parallax * 0.12, transform: 'scale(1.015)', transformOrigin: '50% 100%'}} />
    </div>
  );
};

/** Iris circulaire bordé de l'arc segmenté du logo (cyan / marine) : transition de marque. */
export const ArcIris: React.FC<{
  f: number;
  start: number;
  dur?: number;
  x?: number;
  y?: number;
  color: string;
  ring?: string[];
  children?: React.ReactNode;
}> = ({f, start, dur = 16, x = 960, y = 540, color, ring = [C3.cyan, C3.navy], children}) => {
  const p = prog(f, start, start + dur, EASE.inOut);
  if (p <= 0) return null;
  const r = p * 2300;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: color, clipPath: p < 1 ? `circle(${r.toFixed(1)}px at ${x}px ${y}px)` : undefined}}>{children}</div>
      {p < 1 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <SegmentedArc cx={x} cy={y} r={r + 18} thickness={lerp(70, 30, p)} start={-90 + 260 * p} end={270 + 260 * p} segments={20} colors={ring} gap={1.5} taper={false} />
        </svg>
      ) : null}
    </>
  );
};

/** Texte rempli par une photo (background-clip: text). */
export const PhotoType: React.FC<{
  k: PhotoKey;
  text: string;
  style: React.CSSProperties;
  width: number;
  height: number;
  tint?: string;
  zoom?: number;
}> = ({k, text, style, width, height, tint, zoom = 1}) => {
  const g = cover(k, width, height, zoom, PHOTOS[k].poi[0], 0.5);
  const layers = [tint ? `linear-gradient(${tint}, ${tint})` : null, `url(${staticFile(PHOTOS[k].src)})`].filter(Boolean).join(', ');
  return (
    <div
      style={{
        ...style,
        backgroundImage: layers,
        backgroundSize: tint ? `100% 100%, ${g.iw}px ${g.ih}px` : `${g.iw}px ${g.ih}px`,
        backgroundPosition: tint ? `0 0, ${g.x}px ${g.y}px` : `${g.x}px ${g.y}px`,
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        width,
      }}
    >
      {text}
    </div>
  );
};

/** Épingle qui tombe sur un lieu + ondes + étiquette. */
export const PinDrop: React.FC<{
  f: number;
  start: number;
  x: number;
  y: number;
  label: string;
  dark?: boolean;
  size?: number;
  side?: 'right' | 'left';
  cw?: number; // largeur du conteneur (pour l'ancrage à gauche)
}> = ({f, start, x, y, label, dark, size = 64, side = 'right', cw = 1920}) => {
  if (f < start) return null;
  const drop = prog(f, start, start + 9, EASE.overshoot);
  const lab = prog(f, start + 5, start + 16, EASE.out);
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {[0, 1].map((k) => {
          const p = (((f - start - 4 + k * 15) % 30) + 30) % 30 / 30;
          return f > start + 4 ? <ellipse key={k} cx={x} cy={y} rx={12 + 70 * p} ry={(12 + 70 * p) * 0.45} fill="none" stroke={C3.flame} strokeWidth={3} opacity={(1 - p) * 0.9} /> : null;
        })}
      </svg>
      <div style={{position: 'absolute', left: x - size / 2, top: y - size + lerp(-140, 0, drop), opacity: clamp01(drop * 3)}}>
        <PinIcon size={size} color={C3.flame} dot={C3.white} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: side === 'right' ? x + size * 0.55 : undefined,
          right: side === 'left' ? cw - x + size * 0.55 : undefined,
          top: y - size * 0.95,
          background: dark ? C3.navy : C3.white,
          color: dark ? C3.white : C3.navy,
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: size * 0.42,
          letterSpacing: '0.04em',
          padding: `${size * 0.16}px ${size * 0.3}px`,
          borderRadius: size * 0.18,
          whiteSpace: 'nowrap',
          clipPath: `inset(0 ${(100 - lab * 100).toFixed(1)}% 0 0 round ${size * 0.18}px)`,
          boxShadow: '0 8px 24px rgba(1,38,63,0.3)',
        }}
      >
        {label}
      </div>
    </>
  );
};

/** Pastille d'information. */
export const Chip: React.FC<{f: number; start: number; text: string; bg: string; color: string; size?: number; icon?: React.ReactNode}> = ({f, start, text, bg, color, size = 32, icon}) => {
  const p = prog(f, start, start + 12, EASE.overshoot);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.4,
        background: bg,
        color,
        borderRadius: size,
        padding: `${size * 0.45}px ${size * 0.8}px`,
        fontFamily: FONTS.body,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        transform: `scale(${p})`,
        transformOrigin: '0 50%',
        opacity: clamp01(p * 3),
      }}
    >
      {icon}
      {text}
    </div>
  );
};
