import React from 'react';
import {FONTS} from '../../config/theme';
import {fontStyle} from '../../components/Typography';
import {MediaSlot} from '../../components/MediaSlot';
import {Hex} from '../../components/Primitives';
import {EASE, clamp01, hash, lerp, prog} from '../../lib/motion';
import {Abs, Marquee, P2, PinIcon, Rise, Spark, WIDE, fitSize} from '../kit';
import T from '../timeline.json';

const W = T.words;

/**
 * V2 · SCÈNE 03 — 12 → 19 s — Grille « bento » en 3D : chaque tuile porte une idée
 * (marque, stand, idées, ambitions, Toamasina). Le titre est une tuile à part entière :
 * il ne recouvre jamais les visuels.
 */
const M = 72;
const G = 20;
const CW = (1920 - 2 * M - 3 * G) / 4;
const RH = (1080 - 2 * M - 2 * G) / 3;
const cell = (c: number, r: number, cs = 1, rs = 1) => ({x: M + c * (CW + G), y: M + r * (RH + G), w: cs * CW + (cs - 1) * G, h: rs * RH + (rs - 1) * G});

/** Stand d'exposition en aplats (illustration originale, remplaçable par public/media/stand.*). */
const BoothFlat: React.FC<{f: number}> = ({f}) => {
  const bars = [0.4, 0.65, 0.5, 0.9];
  return (
    <svg viewBox="0 0 880 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width={880} height={300} fill={P2.cyan} />
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={i * 80 - ((f * 2) % 80)} y={0} width={40} height={300} fill="#FFFFFF" opacity={0.06} />
      ))}
      <rect x={300} y={40} width={420} height={210} rx={10} fill={P2.white} />
      <rect x={300} y={40} width={420} height={46} rx={10} fill={P2.navy} />
      <text x={510} y={72} textAnchor="middle" fontFamily="Unbounded" fontWeight={900} fontSize={22} fill={P2.white}>
        VOTRE MARQUE
      </text>
      <rect x={330} y={108} width={170} height={100} rx={8} fill={P2.ink} />
      {bars.map((b, i) => {
        const h = 80 * b * prog(f, 310 + i * 3, 330 + i * 3, EASE.out);
        return <rect key={i} x={346 + i * 38} y={198 - h} width={24} height={h} rx={3} fill={i === 3 ? P2.orange : P2.electric} />;
      })}
      <rect x={530} y={170} width={160} height={80} rx={8} fill={P2.orange} />
      <circle cx={580} cy={130} r={18} fill={P2.navy} />
      <rect x={562} y={150} width={36} height={22} rx={8} fill={P2.navy} />
      <circle cx={210} cy={170} r={22} fill={P2.ink} />
      <rect x={186} y={196} width={48} height={70} rx={20} fill={P2.ink} />
      <circle cx={790} cy={160} r={22} fill={P2.white} />
      <rect x={766} y={186} width={48} height={80} rx={20} fill={P2.white} />
    </svg>
  );
};

type TileDef = {key: string; c: number; r: number; cs?: number; rs?: number; bg: string; from: [number, number]; at: number};
const TILES: TileDef[] = [
  {key: 'head', c: 0, r: 0, cs: 2, rs: 2, bg: P2.ink, from: [-400, -200], at: 300},
  {key: 'stand', c: 2, r: 0, cs: 2, bg: P2.cyan, from: [400, -300], at: 303},
  {key: 'idees', c: 2, r: 1, bg: P2.orange, from: [300, 0], at: 306},
  {key: 'amb', c: 3, r: 1, bg: P2.white, from: [500, 100], at: 309},
  {key: 'toam', c: 0, r: 2, bg: P2.electric, from: [-300, 300], at: 312},
  {key: 'ticker', c: 1, r: 2, cs: 2, bg: P2.navy, from: [0, 400], at: 315},
  {key: 'date', c: 3, r: 2, bg: P2.amber, from: [400, 400], at: 318},
];

export const V2_Scene03_Bento: React.FC<{f: number}> = ({f}) => {
  const flat = prog(f, 300, 344, EASE.out);
  const drift = prog(f, 344, 452, EASE.soft);
  const rx = lerp(18, 0, flat) + 2 * drift;
  const ry = lerp(-16, 0, flat) + 3 * drift;
  const camS = lerp(0.86, 1, flat) * lerp(1, 1.03, drift);
  const head = cell(0, 0, 2, 2);
  const headSize = fitSize('RAYONNER', head.w - 110, 120);

  const content = (key: string, w: number, h: number) => {
    switch (key) {
      case 'head':
        return (
          <div style={{position: 'absolute', left: 54, top: 60, display: 'flex', flexDirection: 'column', gap: headSize * 0.12}}>
            <div style={{fontFamily: FONTS.body, fontWeight: 700, fontSize: 22, letterSpacing: '0.24em', color: P2.electric, opacity: prog(f, 322, 330), marginBottom: 14}}>EXPOSEZ AU GSN 2.0</div>
            <Rise text="FAITES" spec={WIDE(headSize)} f={f} start={W.faites - 14} />
            <Rise
              text="RAYONNER"
              spec={WIDE(headSize)}
              f={f}
              start={W.faites - 6}
              charColor={(i) => {
                const wave = Math.sin((f - W.faites) * 0.35 - i * 0.7);
                return f > W.faites && f < W.faites + 40 && wave > 0.6 ? P2.amber : undefined;
              }}
            />
            <Rise text="VOTRE" spec={WIDE(headSize)} f={f} start={W.marque - 10} />
            <div style={{alignSelf: 'flex-start', background: P2.orange, borderRadius: 14, padding: '6px 18px 2px', transform: `scaleX(${prog(f, W.marque - 2, W.marque + 6, EASE.out)})`, transformOrigin: '0 50%'}}>
              <Rise text="MARQUE" spec={WIDE(headSize)} f={f} start={W.marque} color={P2.ink} />
            </div>
          </div>
        );
      case 'stand':
        return (
          <>
            <MediaSlot name="stand" fallback={<BoothFlat f={f} />} />
            <div style={{position: 'absolute', left: 22, top: 20, background: P2.white, color: P2.ink, borderRadius: 30, padding: '10px 18px', fontFamily: FONTS.body, fontWeight: 800, fontSize: 18, letterSpacing: '0.16em'}}>STAND D'EXPOSITION</div>
          </>
        );
      case 'idees':
        return (
          <>
            <div style={{position: 'absolute', right: -30, top: -30, opacity: 0.9}}>
              <Spark size={190} color={P2.ink} rot={f * 2.2} />
            </div>
            <div style={{position: 'absolute', left: 30, bottom: 30}}>
              <Rise text="VOS" spec={WIDE(46)} f={f} start={W.idees - 4} color={P2.ink} />
              <Rise text="IDÉES" spec={WIDE(64)} f={f} start={W.idees} color={P2.white} />
            </div>
          </>
        );
      case 'amb': {
        const vals = [0.35, 0.6, 0.95];
        return (
          <>
            <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
              {vals.map((v, i) => {
                const bh = 170 * v * prog(f, W.ambitions - 8 + i * 3, W.ambitions + 6 + i * 3, EASE.overshoot);
                return <rect key={i} x={w - 190 + i * 56} y={h - 34 - bh} width={42} height={bh} rx={8} fill={[P2.electric, P2.navy, P2.orange][i]} />;
              })}
            </svg>
            <div style={{position: 'absolute', left: 28, top: 28}}>
              <Rise text="VOS" spec={WIDE(34)} f={f} start={W.ambitions - 4} color={P2.navy} />
              <Rise text="AMBITIONS" spec={WIDE(fitSize('AMBITIONS', w - 60, 40))} f={f} start={W.ambitions} color={P2.ink} />
            </div>
          </>
        );
      }
      case 'toam':
        return (
          <div style={{position: 'absolute', left: 30, bottom: 30, display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{transform: `translateY(${-14 * Math.abs(Math.sin(f * 0.3))}px)`, width: 60}}>
              <PinIcon size={60} color={P2.ink} dot={P2.electric} />
            </div>
            <Rise text="À" spec={WIDE(40)} f={f} start={W.aToamasina} color={P2.ink} />
            <Rise text="TOAMASINA" spec={WIDE(fitSize('TOAMASINA', w - 60, 46))} f={f} start={W.aToamasina + 2} color={P2.white} />
          </div>
        );
      case 'ticker':
        return (
          <>
            <Marquee text="EXPOSEZ VOTRE MARQUE • RENCONTRES • VISIBILITÉ • " spec={WIDE(56)} f={f} speed={-8} top={58} />
            <Marquee text="OPPORTUNITÉS • CLIENTS • PARTENAIRES • " spec={WIDE(56)} f={f} speed={8} top={168} outline={P2.electric} />
          </>
        );
      case 'date':
        return (
          <>
            <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
              <Hex cx={w - 90} cy={90} r={52} rot={f * 1.5} fill={P2.white} />
              <Hex cx={w - 160} cy={150} r={34} rot={-f * 2} stroke={P2.ink} strokeWidth={5} />
              <Hex cx={w - 60} cy={180} r={24} rot={f} fill={P2.flame} />
            </svg>
            <div style={{position: 'absolute', left: 28, bottom: 28, ...fontStyle(WIDE(44)), color: P2.ink}}>
              3–5
              <div style={{...fontStyle(WIDE(30, 700)), marginTop: 10}}>DÉC. 2026</div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Abs>
      {f < 450 ? <Abs style={{background: P2.paper}} /> : null}
      <Abs style={{perspective: 2200}}>
        <Abs style={{transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${camS})`, transformStyle: 'preserve-3d'}}>
          {TILES.map((t, i) => {
            const g = cell(t.c, t.r, t.cs, t.rs);
            const p = prog(f, t.at, t.at + 14, EASE.overshoot);
            const dirX = g.x + g.w / 2 - 960;
            const dirY = g.y + g.h / 2 - 540;
            const sc = prog(f, 450 + hash(i) * 6, 466 + hash(i) * 6, EASE.in);
            return (
              <div
                key={t.key}
                style={{
                  position: 'absolute',
                  left: g.x,
                  top: g.y,
                  width: g.w,
                  height: g.h,
                  borderRadius: 34,
                  overflow: 'hidden',
                  background: t.bg,
                  opacity: clamp01(p * 2) * (1 - sc),
                  transform: `translate(${lerp(t.from[0], 0, p) + dirX * 1.6 * sc}px, ${lerp(t.from[1], 0, p) + dirY * 1.6 * sc}px) scale(${lerp(0.7, 1, p) * lerp(1, 1.25, sc)}) rotate(${(i % 2 ? 1 : -1) * 12 * sc}deg)`,
                  boxShadow: t.bg === P2.white ? 'inset 0 0 0 3px rgba(2,66,110,0.12)' : undefined,
                }}
              >
                {content(t.key, g.w, g.h)}
              </div>
            );
          })}
        </Abs>
      </Abs>
    </Abs>
  );
};
