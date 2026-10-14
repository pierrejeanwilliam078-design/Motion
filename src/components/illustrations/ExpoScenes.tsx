import React from 'react';
import {COLORS} from '../../config/theme';
import {EASE, hexPoints, prog} from '../../lib/motion';

/**
 * Illustrations ORIGINALES 2.5D (stand, présentation, rencontre d'affaires).
 * Volontairement stylisées : elles ne prétendent pas montrer une édition
 * passée du GSN. Remplaçables par des vidéos sous licence (voir MediaSlot).
 * Repère : viewBox 800 × 680.
 */

const VB = {w: 800, h: 680};

const Person: React.FC<{x: number; y: number; s?: number; color?: string; badge?: boolean; tilt?: number; arm?: number}> = ({
  x,
  y,
  s = 1,
  color = '#164C7E',
  badge = true,
  tilt = 0,
  arm,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`}>
    <circle cx={0} cy={-150} r={22} fill={color} />
    <path d="M -40 -118 Q 0 -134 40 -118 L 46 -20 Q 0 -8 -46 -20 Z" fill={color} />
    <rect x={-30} y={-24} width={24} height={110} rx={10} fill={color} />
    <rect x={6} y={-24} width={24} height={110} rx={10} fill={color} />
    {badge ? (
      <>
        <path d="M -12 -122 L 0 -80 L 12 -122" stroke={COLORS.brandCyan} strokeWidth={3} fill="none" />
        <rect x={-10} y={-82} width={20} height={26} rx={3} fill={COLORS.white} opacity={0.9} />
      </>
    ) : null}
    {arm !== undefined ? (
      <rect x={30} y={-112} width={70 * arm} height={18} rx={9} fill={color} transform={`rotate(${-10 + 10 * arm} 30 -104)`} />
    ) : null}
  </g>
);

const Floor: React.FC<{color?: string}> = ({color = '#08213F'}) => (
  <g>
    <polygon points={`0,470 ${VB.w},470 ${VB.w},${VB.h} 0,${VB.h}`} fill={color} />
    {Array.from({length: 9}).map((_, i) => (
      <line key={i} x1={400 + (i - 4) * 40} y1={470} x2={400 + (i - 4) * 260} y2={VB.h} stroke={COLORS.brandCyan} strokeOpacity={0.08} />
    ))}
    {Array.from({length: 4}).map((_, i) => (
      <line key={`h${i}`} x1={0} y1={470 + i * i * 14 + i * 20} x2={VB.w} y2={470 + i * i * 14 + i * 20} stroke={COLORS.brandCyan} strokeOpacity={0.07} />
    ))}
  </g>
);

const Spot: React.FC<{x: number; w: number; o?: number}> = ({x, w, o = 0.16}) => (
  <polygon points={`${x - 8},0 ${x + 8},0 ${x + w},470 ${x - w},470`} fill="url(#spotGrad)" opacity={o} />
);

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="spotGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFE2A8" stopOpacity="0.9" />
      <stop offset="1" stopColor="#FFE2A8" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="hallBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#051631" />
      <stop offset="1" stopColor="#0B3159" />
    </linearGradient>
    <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={COLORS.navy} />
      <stop offset="1" stopColor="#043058" />
    </linearGradient>
  </defs>
);

/** Stand d'exposition en perspective. */
export const ExpoStand: React.FC<{f: number}> = ({f}) => {
  const bars = [0.45, 0.7, 0.55, 0.9];
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <Defs />
      <rect width={VB.w} height={VB.h} fill="url(#hallBg)" />
      {/* stands lointains */}
      {[60, 640].map((x, i) => (
        <g key={i} opacity={0.35}>
          <rect x={x} y={250} width={130} height={220} fill="#0A2C52" />
          <rect x={x} y={250} width={130} height={18} fill={i ? COLORS.amber : COLORS.brandCyan} />
        </g>
      ))}
      <Floor />
      {/* stand principal */}
      <polygon points="190,140 610,140 610,470 190,470" fill="url(#wallGrad)" />
      <polygon points="610,140 690,190 690,510 610,470" fill="#032A4C" />
      <rect x={190} y={140} width={420} height={56} fill={COLORS.brandCyan} />
      <text x={400} y={180} textAnchor="middle" fill={COLORS.white} fontFamily="Space Grotesk" fontWeight={700} fontSize={30} letterSpacing="0.12em">
        VOTRE MARQUE
      </text>
      {/* écran */}
      <rect x={250} y={232} width={190} height={120} rx={6} fill="#051631" stroke={COLORS.brandCyan} strokeOpacity={0.6} />
      {bars.map((b, i) => {
        const h = 90 * b * prog(f, 6 + i * 4, 30 + i * 4, EASE.out);
        return <rect key={i} x={272 + i * 40} y={338 - h} width={24} height={h} fill={i === 3 ? COLORS.amber : COLORS.brandCyan} opacity={0.9} />;
      })}
      {/* motif hexagonal sur le mur */}
      {[0, 1, 2].map((i) => (
        <polygon
          key={i}
          points={hexPoints(520 + (i % 2) * 34, 262 + i * 30, 20, 0)
            .map((p) => p.join(','))
            .join(' ')}
          fill="none"
          stroke={i === 1 ? COLORS.amber : COLORS.white}
          strokeOpacity={0.6}
          strokeWidth={2.5}
        />
      ))}
      {/* comptoir */}
      <polygon points="300,400 520,400 540,412 540,500 320,500 300,488" fill={COLORS.white} />
      <polygon points="300,400 520,400 540,412 320,412" fill="#DCE8F5" />
      <rect x={320} y={440} width={220} height={8} fill={COLORS.amber} />
      <Spot x={300} w={110} o={0.12 + 0.03 * Math.sin(f * 0.15)} />
      <Spot x={520} w={110} o={0.12 + 0.03 * Math.sin(f * 0.13 + 1)} />
      {/* visiteurs */}
      <Person x={210 + f * 0.25} y={585} s={0.95} color="#1A5A8E" />
      <Person x={620 - f * 0.18} y={600} s={1.02} color="#15497A" />
      <Person x={430} y={392} s={0.62} color="#103E6A" badge={false} />
    </svg>
  );
};

/** Présentation sur scène : partage d'idées. */
export const StagePitch: React.FC<{f: number}> = ({f}) => {
  const pts = [0, 0.18, 0.12, 0.38, 0.33, 0.6, 0.82];
  const k = prog(f, 0, 22, EASE.out);
  const d = pts
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${230 + i * 56} ${300 - v * 150 * k}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <Defs />
      <rect width={VB.w} height={VB.h} fill="url(#hallBg)" />
      <rect x={180} y={90} width={440} height={260} rx={8} fill="#041330" stroke={COLORS.brandCyan} strokeOpacity={0.5} strokeWidth={2} />
      <path d={d} stroke={COLORS.amber} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={230 + 6 * 56} cy={300 - 0.82 * 150 * k} r={10} fill={COLORS.amber} />
      <text x={210} y={135} fill={COLORS.white} fontFamily="Space Grotesk" fontWeight={700} fontSize={26} letterSpacing="0.1em">
        VOS IDÉES
      </text>
      <rect x={110} y={400} width={580} height={30} fill="#0A2C52" />
      <Spot x={300} w={120} o={0.18} />
      <Person x={300} y={398} s={0.82} color="#1A5A8E" arm={0.6 + 0.2 * Math.sin(f * 0.2)} />
      <rect x={520} y={330} width={46} height={70} fill="#0C2A4C" />
      {/* public */}
      {Array.from({length: 9}).map((_, i) => (
        <g key={i} transform={`translate(${40 + i * 92} ${640 + (i % 2) * 16})`}>
          <circle cx={0} cy={-80} r={30} fill="#030F24" />
          <path d="M -58 0 Q -54 -54 0 -54 Q 54 -54 58 0 Z" fill="#030F24" />
        </g>
      ))}
    </svg>
  );
};

/** Rencontre d'affaires : poignée de main au stand. */
export const BusinessMeeting: React.FC<{f: number}> = ({f}) => {
  const shake = Math.sin(f * 0.55) * 4 * prog(f, 6, 12);
  const glow = 0.35 + 0.15 * Math.sin(f * 0.2);
  const hand: [number, number] = [400, 432 + shake];
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <Defs />
      <defs>
        <radialGradient id="meetGlow">
          <stop offset="0" stopColor={COLORS.amber} stopOpacity="0.9" />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={VB.w} height={VB.h} fill="url(#hallBg)" />
      <rect x={40} y={70} width={720} height={400} fill="url(#wallGrad)" />
      <rect x={40} y={70} width={720} height={14} fill={COLORS.brandCyan} />
      {Array.from({length: 12}).map((_, i) => (
        <polygon
          key={i}
          points={hexPoints(110 + (i % 6) * 116 + (Math.floor(i / 6) % 2) * 58, 160 + Math.floor(i / 6) * 100, 46, 0)
            .map((p) => p.join(','))
            .join(' ')}
          fill="none"
          stroke={i === 4 ? COLORS.amber : COLORS.brandCyan}
          strokeOpacity={i === 4 ? 0.5 : 0.16}
          strokeWidth={2}
        />
      ))}
      <Floor />
      <Spot x={400} w={190} o={0.16} />
      <circle cx={hand[0]} cy={hand[1]} r={120} fill="url(#meetGlow)" opacity={glow} />
      <Person x={250} y={575} s={1.5} color="#1B5C93" />
      <Person x={550} y={575} s={1.5} color="#14497A" />
      <path d={`M 302 ${410} Q 352 ${445 + shake} ${hand[0] - 6} ${hand[1]}`} stroke="#1B5C93" strokeWidth={26} strokeLinecap="round" fill="none" />
      <path d={`M 498 ${410} Q 448 ${445 + shake} ${hand[0] + 6} ${hand[1]}`} stroke="#14497A" strokeWidth={26} strokeLinecap="round" fill="none" />
      <ellipse cx={hand[0]} cy={hand[1]} rx={20} ry={15} fill="#226BA8" />
      {[0, 1, 2, 3, 4].map((i) => {
        const p = ((f * 0.03 + i * 0.2) % 1);
        return <circle key={i} cx={hand[0] + Math.cos(i * 1.3) * 60 * p} cy={hand[1] - 70 * p} r={3} fill={COLORS.amber} opacity={(1 - p) * 0.8} />;
      })}
    </svg>
  );
};
