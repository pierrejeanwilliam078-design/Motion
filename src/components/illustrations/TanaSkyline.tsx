import React from 'react';
import {random} from 'remotion';
import {COLORS} from '../../config/theme';
import {twinkle} from '../Primitives';

/**
 * Illustration ORIGINALE et stylisée d'Antananarivo à l'heure bleue :
 * ville bâtie sur des collines, silhouette évocatrice du Rova au sommet,
 * maisons hautes à toits pentus des Hautes Terres, fenêtres éclairées.
 * Ce n'est pas une photographie : à remplacer par une image sous licence
 * en déposant public/media/antananarivo.jpg (voir MediaSlot).
 */

type Hill = {base: number; peaks: {x: number; h: number; w: number}[]};

const hillY = (hill: Hill, x: number) =>
  hill.base - hill.peaks.reduce((acc, p) => acc + p.h * Math.exp(-(((x - p.x) / p.w) ** 2)), 0);

const hillPath = (hill: Hill, W: number, H: number) => {
  let d = `M -40 ${H + 40} L -40 ${hillY(hill, -40).toFixed(1)}`;
  for (let x = -40; x <= W + 40; x += 16) d += ` L ${x} ${hillY(hill, x).toFixed(1)}`;
  return d + ` L ${W + 40} ${H + 40} Z`;
};

const HILLS: {hill: Hill; color: string; depth: number; houses: number; seed: string}[] = [
  {
    hill: {base: 760, peaks: [{x: 300, h: 140, w: 260}, {x: 980, h: 90, w: 300}, {x: 1700, h: 160, w: 280}]},
    color: '#123E6E',
    depth: 0.25,
    houses: 90,
    seed: 'far',
  },
  {
    hill: {base: 860, peaks: [{x: 1240, h: 330, w: 300}, {x: 520, h: 170, w: 240}, {x: 1880, h: 120, w: 200}]},
    color: '#0B2B52',
    depth: 0.55,
    houses: 130,
    seed: 'mid',
  },
  {
    hill: {base: 1010, peaks: [{x: 200, h: 220, w: 300}, {x: 820, h: 120, w: 260}, {x: 1600, h: 200, w: 320}]},
    color: '#061A35',
    depth: 1,
    houses: 60,
    seed: 'near',
  },
];

const House: React.FC<{x: number; y: number; s: number; color: string; lit: number; seed: number; frame: number}> = ({x, y, s, color, lit, seed, frame}) => {
  const w = 22 * s;
  const h = (26 + random(`hh-${seed}`) * 16) * s;
  const roof = (14 + random(`hr-${seed}`) * 8) * s;
  const win = lit > 0.28;
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h + 30 * s} fill={color} />
      <polygon points={`${x - w / 2 - 3 * s},${y - h} ${x},${y - h - roof} ${x + w / 2 + 3 * s},${y - h}`} fill={color} />
      {win ? (
        <>
          <rect x={x - w / 4 - 2.5 * s} y={y - h * 0.7} width={5 * s} height={7 * s} fill={COLORS.amber} opacity={twinkle(seed, frame)} />
          {random(`w2-${seed}`) > 0.5 ? (
            <rect x={x + w / 4 - 2.5 * s} y={y - h * 0.7} width={5 * s} height={7 * s} fill="#FFD27A" opacity={twinkle(seed + 99, frame) * 0.9} />
          ) : null}
        </>
      ) : null}
    </g>
  );
};

/** Silhouette évocatrice (non architecturale) du palais du Rova : corps rectangulaire et tours d'angle. */
const Rova: React.FC<{x: number; y: number; s: number; color: string}> = ({x, y, s, color}) => {
  const w = 150 * s;
  const h = 70 * s;
  const tw = 16 * s;
  const th = 98 * s;
  return (
    <g fill={color}>
      <rect x={x - w / 2} y={y - h} width={w} height={h + 20} />
      {[-1, 1].map((k) => (
        <rect key={k} x={x + (k * w) / 2 - tw / 2} y={y - th} width={tw} height={th + 20} />
      ))}
      <rect x={x - w / 2 + 6 * s} y={y - h - 14 * s} width={w - 12 * s} height={14 * s} />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={x - w / 2 + 18 * s + i * 18.5 * s} y={y - h + 16 * s} width={6 * s} height={14 * s} fill={COLORS.amber} opacity={0.55} />
      ))}
    </g>
  );
};

export const TanaSkyline: React.FC<{frame: number; camX?: number; camY?: number}> = ({frame, camX = 0, camY = 0}) => {
  const W = 1920;
  const H = 1080;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="tanaSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04142E" />
          <stop offset="0.45" stopColor="#0D3B70" />
          <stop offset="0.7" stopColor="#226A9E" />
          <stop offset="0.86" stopColor="#E6954A" />
        </linearGradient>
        <radialGradient id="tanaGlow" cx="0.62" cy="0.62" r="0.5">
          <stop offset="0" stopColor={COLORS.amber} stopOpacity="0.28" />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tanaFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor={COLORS.night} stopOpacity="0" />
          <stop offset="1" stopColor={COLORS.night} stopOpacity="0.92" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#tanaSky)" />
      <rect width={W} height={H} fill="url(#tanaGlow)" />
      {Array.from({length: 40}).map((_, i) => (
        <circle
          key={i}
          cx={random(`sx-${i}`) * W - camX * 0.1}
          cy={random(`sy-${i}`) * H * 0.45}
          r={0.8 + random(`sr-${i}`) * 1.2}
          fill={COLORS.white}
          opacity={0.25 * twinkle(i, frame)}
        />
      ))}
      {HILLS.map(({hill, color, depth, houses, seed}, li) => {
        const ox = -camX * depth;
        const oy = -camY * depth;
        const s = 0.6 + depth * 0.7;
        return (
          <g key={li} transform={`translate(${ox.toFixed(2)} ${oy.toFixed(2)})`}>
            <path d={hillPath(hill, W, H)} fill={color} />
            {li === 1 ? <Rova x={1240} y={hillY(hill, 1240) + 6} s={0.82} color={color} /> : null}
            {li === 1
              ? // clochers stylisés
                [[1010, 70], [1470, 60]].map(([x, h], k) => {
                  const y = hillY(hill, x) + 4;
                  return <polygon key={k} points={`${x - 9},${y} ${x - 9},${y - h} ${x},${y - h - 34} ${x + 9},${y - h} ${x + 9},${y}`} fill={color} />;
                })
              : null}
            {Array.from({length: houses}).map((_, i) => {
              const x = random(`${seed}-x-${i}`) * (W + 120) - 60;
              if (li === 1 && Math.abs(x - 1240) < 110) return null;
              const y = hillY(hill, x) + 6 + random(`${seed}-y-${i}`) * 60 * depth;
              return (
                <House key={i} x={x} y={y} s={s * (0.8 + random(`${seed}-s-${i}`) * 0.4)} color={color} lit={random(`${seed}-l-${i}`)} seed={li * 1000 + i} frame={frame} />
              );
            })}
            {/* lumières de rues sur la colline */}
            {Array.from({length: 26}).map((_, i) => {
              const x = random(`${seed}-lx-${i}`) * W;
              const y = hillY(hill, x) + 30 + random(`${seed}-ly-${i}`) * 140;
              return <circle key={`l${i}`} cx={x} cy={y} r={1.6 * s} fill="#FFD27A" opacity={0.7 * twinkle(i + li * 50, frame)} />;
            })}
          </g>
        );
      })}
      <rect width={W} height={H} fill="url(#tanaFade)" />
    </svg>
  );
};
