import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {FontSpec, fontStyle, textWidth} from '../components/Typography';
import {EASE, clamp01, hash, lerp, prog} from '../lib/motion';

/**
 * KIT GRAPHIQUE — VERSION 2 « POP KINETIC »
 * Aplats de couleurs francs, coupes sur le tempo (150 BPM = 10 frames/temps),
 * transitions par formes (cercles, rayures, stores), bandeaux défilants,
 * stickers, typographie Unbounded très large.
 */
export const P2 = {
  ink: '#031029',
  navy: COLORS.navy,
  cyan: COLORS.brandCyan,
  electric: COLORS.cyan,
  orange: COLORS.orange,
  flame: COLORS.flame,
  amber: COLORS.amber,
  white: '#FFFFFF',
  paper: '#EEF2F7',
};

export const BEAT = 10;
export const BAR = 40;

/** Impulsion qui retombe après chaque temps (pour les « bumps » rythmiques). */
export const beatPulse = (f: number, offset = 0) => Math.exp(-(((f - offset) % BEAT) + BEAT) % BEAT / 2.5);

export const WIDE = (fontSize: number, weight = 900, letterSpacing = -0.02): FontSpec => ({
  fontFamily: 'Unbounded',
  fontSize,
  fontWeight: weight,
  letterSpacing,
});

/** Taille de police pour qu'un texte tienne dans `maxW` px. */
export const fitSize = (text: string, maxW: number, max: number, weight = 900, ls = -0.02) => {
  const w = textWidth(text, WIDE(100, weight, ls));
  return Math.min(max, (100 * maxW) / w);
};

export const Abs: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <div style={{position: 'absolute', inset: 0, ...style}}>{children}</div>
);

// ------------------------------------------------------------------ transitions
/** Cercle qui grandit depuis (x, y) et révèle `children` (ou une couleur). */
export const CircleReveal: React.FC<{f: number; start: number; dur?: number; x?: number; y?: number; color?: string; children?: React.ReactNode}> = ({
  f,
  start,
  dur = 12,
  x = 960,
  y = 540,
  color,
  children,
}) => {
  const p = prog(f, start, start + dur, EASE.out);
  if (p <= 0) return null;
  const r = p * 2300;
  return (
    <Abs style={{clipPath: p < 1 ? `circle(${r.toFixed(1)}px at ${x}px ${y}px)` : undefined, background: color}}>
      {children}
    </Abs>
  );
};

/** Rayures diagonales qui balaient l'écran et laissent la couleur `color`. */
export const StripeWipe: React.FC<{f: number; start: number; color: string; n?: number; dur?: number; stagger?: number; angle?: number}> = ({
  f,
  start,
  color,
  n = 6,
  dur = 12,
  stagger = 1.5,
  angle = -16,
}) => {
  if (f < start) return null;
  const done = prog(f, start + (n - 1) * stagger, start + (n - 1) * stagger + dur) >= 1;
  if (done) return <Abs style={{background: color}} />;
  const h = 1700 / n;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <g transform={`rotate(${angle} 960 540)`}>
        {Array.from({length: n}).map((_, i) => {
          const p = prog(f, start + i * stagger, start + i * stagger + dur, EASE.inOut);
          const x = lerp(2700, -900, p);
          return <rect key={i} x={x} y={-310 + i * h} width={3600} height={h + 2} fill={color} />;
        })}
      </g>
    </svg>
  );
};

/** Stores verticaux qui se ferment sur une nouvelle couleur. */
export const BlindsWipe: React.FC<{f: number; start: number; color: string; n?: number; dur?: number; stagger?: number}> = ({f, start, color, n = 8, dur = 9, stagger = 1}) => {
  if (f < start) return null;
  const w = 1920 / n;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}).map((_, i) => {
        const p = prog(f, start + i * stagger, start + i * stagger + dur, EASE.inOut);
        return <rect key={i} x={i * w - 0.5} y={i % 2 ? 0 : 1080 * (1 - p)} width={w + 1} height={1080 * p} fill={color} />;
      })}
    </svg>
  );
};

// ------------------------------------------------------------------ contours
/**
 * Contour typographique propre : le texte est rempli puis un filtre SVG garde
 * seulement le liseré extérieur (dilatation − forme). Contrairement à
 * -webkit-text-stroke, les chevauchements internes de la police n'apparaissent pas.
 */
const OUTLINE_COLORS: Record<string, string> = {};
export const outlineFilter = (color: string) => {
  const id = `ol-${Object.keys(OUTLINE_COLORS).indexOf(color) >= 0 ? Object.keys(OUTLINE_COLORS).indexOf(color) : Object.keys(OUTLINE_COLORS).length}`;
  OUTLINE_COLORS[color] = id;
  return `url(#${id})`;
};
export const OUTLINES = [COLORS.navy, COLORS.cyan, 'rgba(3,16,41,0.35)', COLORS.brandCyan];
OUTLINES.forEach(outlineFilter);
export const OutlineDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      {Object.entries(OUTLINE_COLORS).map(([color, id]) => (
        <filter key={id} id={id} x="-5%" y="-20%" width="110%" height="140%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d" />
          <feComposite in="d" in2="SourceAlpha" operator="out" result="ring" />
          <feFlood floodColor={color} />
          <feComposite in2="ring" operator="in" />
        </filter>
      ))}
    </defs>
  </svg>
);

// ------------------------------------------------------------------ typographie
/** Bandeau défilant (marquee) continu, déterministe. */
export const Marquee: React.FC<{
  text: string;
  spec: FontSpec;
  f: number;
  speed: number; // px/frame (négatif = vers la gauche)
  top: number;
  color?: string;
  outline?: string;
  offset?: number;
  opacity?: number;
  travel?: number; // si fourni, distance parcourue imposée (pour décélérer)
}> = ({text, spec, f, speed, top, color = P2.white, outline, offset = 0, opacity = 1, travel}) => {
  const unit = textWidth(text, spec);
  const copies = Math.ceil(1920 / unit) + 2;
  const d = travel ?? f * speed;
  const x = (((d + offset) % unit) + unit) % unit - unit;
  return (
    <div style={{position: 'absolute', left: 0, top, width: 1920, overflow: 'hidden', opacity}}>
      <div
        style={{
          ...fontStyle(spec),
          display: 'flex',
          transform: `translateX(${x.toFixed(2)}px)`,
          color: outline ? '#000' : color,
          filter: outline ? outlineFilter(outline) : undefined,
        }}
      >
        {Array.from({length: copies}).map((_, i) => (
          <span key={i} style={{whiteSpace: 'pre'}}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Mot qui « claque » : échelle 1,6 → 1, netteté, lettres échelonnées. */
export const Slam: React.FC<{
  text: string;
  spec: FontSpec;
  f: number;
  start: number;
  color?: string;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
  charColor?: (i: number) => string | undefined;
}> = ({text, spec, f, start, color = P2.white, stagger = 0.6, dur = 7, style, charColor}) => (
  <div style={{display: 'flex', ...fontStyle(spec), color, ...style}}>
    {[...text].map((c, i) => {
      const p = prog(f, start + i * stagger, start + i * stagger + dur, EASE.out);
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            transform: `scale(${lerp(1.7, 1, p)})`,
            opacity: clamp01(p * 3),
            filter: p < 1 ? `blur(${lerp(10, 0, p).toFixed(1)}px)` : undefined,
            color: charColor?.(i),
          }}
        >
          {c === ' ' ? ' ' : c}
        </span>
      );
    })}
  </div>
);

/** Lettres qui montent dans un masque généreux (accents compris). */
export const Rise: React.FC<{
  text: string;
  spec: FontSpec;
  f: number;
  start: number;
  color?: string;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
  charColor?: (i: number) => string | undefined;
}> = ({text, spec, f, start, color = P2.white, stagger = 0.7, dur = 9, style, charColor}) => (
  <div style={{display: 'flex', ...fontStyle(spec), color, ...style}}>
    {[...text].map((c, i) => {
      const p = prog(f, start + i * stagger, start + i * stagger + dur, EASE.out);
      return (
        <span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0.25em 0 0.12em', margin: '-0.25em 0 -0.12em'}}>
          <span style={{display: 'inline-block', transform: `translateY(${lerp(150, 0, p)}%)`, color: charColor?.(i)}}>{c === ' ' ? ' ' : c}</span>
        </span>
      );
    })}
  </div>
);

/** Sticker / pastille qui se pose avec rebond. */
export const Sticker: React.FC<{
  text: string;
  f: number;
  start: number;
  rot?: number;
  bg?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
  stamp?: boolean;
}> = ({text, f, start, rot = -6, bg = P2.white, color = P2.navy, size = 40, style, stamp}) => {
  const p = prog(f, start, start + (stamp ? 7 : 12), stamp ? EASE.out : EASE.overshoot);
  if (f < start) return null;
  const s = stamp ? lerp(1.8, 1, p) : lerp(0.2, 1, p);
  return (
    <div
      style={{
        position: 'absolute',
        transform: `rotate(${lerp(rot * 2.5, rot, p)}deg) scale(${s})`,
        opacity: clamp01(p * 3),
        background: bg,
        color,
        borderRadius: size * 1.2,
        padding: `${size * 0.42}px ${size * 0.85}px`,
        fontFamily: FONTS.wide,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: '0.01em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        boxShadow: `0 ${size * 0.25}px 0 rgba(3,16,41,0.25)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// ------------------------------------------------------------------ 3D
/** Projection d'un point du plan (u, v) transformé par perspective(d) rotateX(rx) rotateZ(rz) scale(s). */
export const project = (u: number, v: number, o: {d: number; rx: number; rz: number; s: number; cx: number; cy: number}) => {
  const rz = (o.rz * Math.PI) / 180;
  const rx = (o.rx * Math.PI) / 180;
  const x1 = u * o.s;
  const y1 = v * o.s;
  const x2 = x1 * Math.cos(rz) - y1 * Math.sin(rz);
  const y2 = x1 * Math.sin(rz) + y1 * Math.cos(rz);
  const y3 = y2 * Math.cos(rx);
  const z3 = y2 * Math.sin(rx);
  const k = o.d / (o.d - z3);
  return [o.cx + x2 * k, o.cy + y3 * k] as [number, number];
};

/** Petit tremblement de caméra déterministe après un impact. */
export const shake = (f: number, at: number, amp = 14) => {
  if (f < at) return [0, 0];
  const decay = Math.exp(-(f - at) / 3);
  return [(hash(f * 1.7) - 0.5) * 2 * amp * decay, (hash(f * 3.1 + 9) - 0.5) * 2 * amp * decay];
};

// ------------------------------------------------------------------ icônes
export const PinIcon: React.FC<{size: number; color: string; dot?: string}> = ({size, color, dot = P2.white}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z" fill={color} />
    <circle cx="12" cy="9" r="2.8" fill={dot} />
  </svg>
);

export const PhoneIcon: React.FC<{size: number; color?: string}> = ({size, color = P2.white}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"
      fill={color}
    />
  </svg>
);

export const MailIcon: React.FC<{size: number; color?: string}> = ({size, color = P2.white}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="3" y="5.5" width="18" height="13" rx="2" fill="none" stroke={color} strokeWidth="2.2" />
    <path d="M3.8 7l8.2 6 8.2-6" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

/** Étoile à 8 branches (accent graphique « idée »). */
export const Spark: React.FC<{size: number; color: string; rot?: number}> = ({size, color, rot = 0}) => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 ? 0.38 : 1;
    const a = (i * Math.PI) / 8;
    pts.push(`${(50 + 50 * r * Math.cos(a)).toFixed(2)},${(50 + 50 * r * Math.sin(a)).toFixed(2)}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{transform: `rotate(${rot}deg)`}}>
      <polygon points={pts.join(' ')} fill={color} />
    </svg>
  );
};

/** Cadre éditorial persistant (coins) : repères d'événement + barre de progression. */
export const Hud: React.FC<{f: number; color: string; opacity: number}> = ({f, color, opacity}) => {
  const st: React.CSSProperties = {
    position: 'absolute',
    fontFamily: FONTS.body,
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: '0.22em',
    color,
    opacity,
    whiteSpace: 'nowrap',
  };
  return (
    <>
      <div style={{...st, left: 56, top: 40}}>GSN 2.0</div>
      <div style={{...st, right: 56, top: 40}}>03—05.12.2026</div>
      <div style={{...st, left: 56, bottom: 40}}>ARENA TOAMASINA · MADAGASCAR</div>
      <div style={{position: 'absolute', right: 56, bottom: 46, width: 140, height: 4, background: color, opacity: opacity * 0.25, borderRadius: 2}} />
      <div style={{position: 'absolute', right: 56 + 140 * (1 - f / 1000), bottom: 46, width: 140 * (f / 1000), height: 4, background: color, opacity, borderRadius: 2}} />
    </>
  );
};
