import React from 'react';
import {FONTS} from '../../config/theme';
import {FontSpec, Tag, textWidth} from '../../components/Typography';
import {EASE, clamp01, lerp, prog} from '../../lib/motion';
import {bezier} from '../../scenes/mapCamera';
import {C3, NAVY_BG} from '../../v3/kit3';
import {BBOX_C, DOTS, ISLAND_N, ISLAND_RAW, Pt, TANA, TOAM, View, mapPts, scaleAbout, smoothPathD, toPath, toScreen, viewLerp} from '../island';
import {CityLabel, FlipChars, Scramble, WaveChars} from '../kit4';
import T from '../timeline.json';

const W = T.words;
export const V_A1: View = {s: 0.86, cx: 1360, cy: 545};
export const V_P: View = {s: 0.86, cx: 1380, cy: 545};
const V_Z: View = {s: 4.4, cx: 900 - (364.4 - BBOX_C[0]) * 4.4, cy: 600 - (476.95 - BBOX_C[1]) * 4.4};
const MID: Pt = [364.4, 476.95];

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

// ------------------------------------------------------------------ SCÈNE 01
/**
 * V4 · SCÈNE 01 — 0 → 6 s — Une étincelle explose en ~1 000 points de lumière
 * (les « opportunités ») qui s'assemblent en Madagascar. Antananarivo s'allume ;
 * « AU-DELÀ » : la silhouette émet des échos qui dépassent ses propres côtes.
 * Les points fusionnent ensuite en une île pleine.
 */
const L: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 60, fontWeight: 700, letterSpacing: -0.01};

export const V4_Scene01: React.FC<{f: number}> = ({f}) => {
  const C: Pt = [960, 540];
  const burst = prog(f, 6, 16, EASE.out);
  const merge = prog(f, 126, 148, EASE.inOut);
  const tanaGlow = prog(f, 56, 68, EASE.out);
  const center = toScreen(BBOX_C, V_A1);
  const tanaS = toScreen(TANA, V_A1);
  const outline = mapPts(ISLAND_N, V_A1);

  // synchronisation mot à mot de la 1re ligne
  const words = [
    {w: 'ET', at: W.etSi},
    {w: 'SI', at: W.etSi + 5},
    {w: 'VOS', at: W.vos},
    {w: 'PROCHAINES', at: W.prochaines},
  ];
  const l1 = words.map((x) => x.w).join(' ');
  const starts: number[] = [];
  words.forEach((x, wi) => {
    [...x.w].forEach((_, ci) => starts.push(x.at + ci * 0.8));
    if (wi < words.length - 1) starts.push(x.at);
  });

  // AU-DELÀ : lettres qui « dépassent » (arrivent de loin, étirées)
  const aud: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 210, fontWeight: 700, letterSpacing: -0.03};
  const fallOut = (i: number) => prog(f, 130 + i * 0.7, 144 + i * 0.7, (t) => t * t);

  return (
    <div style={{position: 'absolute', inset: 0, background: NAVY_BG}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="v4spark">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.4" stopColor={C3.cyan} stopOpacity="0.8" />
            <stop offset="1" stopColor={C3.cyan} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* étincelle */}
        {f < 14 ? <circle cx={C[0]} cy={C[1]} r={lerp(8, 60, prog(f, 0, 6, EASE.out)) * (1 - prog(f, 7, 13))} fill="url(#v4spark)" /> : null}
        {f >= 6 && f < 26 ? <circle cx={C[0]} cy={C[1]} r={40 + 1100 * prog(f, 6, 26, EASE.out)} fill="none" stroke={C3.cyan} strokeWidth={4 * (1 - prog(f, 6, 26))} /> : null}

        {/* échos « au-delà » */}
        {[0, 1, 2].map((j) => {
          const p = prog(f, W.auDela + j * 8, W.auDela + 40 + j * 8, EASE.out);
          if (p <= 0 || p >= 1) return null;
          return <path key={j} d={toPath(scaleAbout(outline, center, 1 + 0.75 * p))} fill="none" stroke={j === 1 ? C3.amber : C3.cyan} strokeWidth={3} opacity={(1 - p) * 0.9} />;
        })}
        {/* île pleine (fusion des points) */}
        {merge > 0 ? <path d={toPath(outline)} fill={C3.cyan} opacity={clamp01((merge - 0.55) * 2.2)} /> : null}

        {/* points */}
        {f >= 6
          ? DOTS.map((d, i) => {
              const tgt = toScreen(d.p, V_A1);
              const a = d.r1 * Math.PI * 2;
              const rad = 120 + d.r2 * 900;
              const o: Pt = [C[0] + Math.cos(a) * rad * burst, C[1] + Math.sin(a) * rad * burst];
              const delay = 14 + (d.p[1] / 1000) * 20 + d.r3 * 6;
              const fly = prog(f, delay, delay + 18, EASE.inOut);
              const x = lerp(o[0], tgt[0], fly);
              const y = lerp(o[1], tgt[1], fly);
              const glow = Math.exp(-d.dTana / 70) * tanaGlow;
              const tw = 0.85 + 0.15 * Math.sin(f * 0.12 + d.r4 * 20);
              const r = lerp(2, 3.3, fly) * tw * (1 + 0.9 * glow) + 6.5 * merge;
              const col = glow > 0.3 ? C3.amber : d.r4 > 0.88 ? C3.white : C3.cyan;
              return <circle key={i} cx={x} cy={y} r={r} fill={merge > 0.2 ? mix(col === C3.cyan ? '#0F9EDA' : col === C3.white ? '#FFFFFF' : '#F9AE2F', '#0F9EDA', merge) : col} opacity={lerp(0.85, 1, fly)} />;
            })
          : null}

        {/* Antananarivo */}
        {f >= 58
          ? [0, 1].map((k) => {
              const p = (((f - 58 + k * 14) % 28) + 28) % 28 / 28;
              return <circle key={k} cx={tanaS[0]} cy={tanaS[1]} r={8 + 46 * p} fill="none" stroke={C3.amber} strokeWidth={2.5} opacity={(1 - p) * (1 - merge)} />;
            })
          : null}
      </svg>
      {f >= 60 ? <CityLabel x={tanaS[0]} y={tanaS[1]} text="ANTANANARIVO" p={prog(f, 60, 72, EASE.out) * (1 - merge)} color={C3.navy} bg={C3.amber} size={22} /> : null}

      {/* texte */}
      <div style={{position: 'absolute', left: 120, top: 196}}>
        <FlipChars text={l1} spec={L} f={f} start={0} charStart={(i) => starts[i]} exit={128} />
      </div>
      <div style={{position: 'absolute', left: 120, top: 276, display: 'flex', gap: 18}}>
        <FlipChars text="GRANDES" spec={L} f={f} start={W.grandes} stagger={0.8} exit={130} />
        <div style={{transform: `translateY(${900 * prog(f, 132, 148, (t) => t * t)}px)`}}>
          <Scramble text="OPPORTUNITÉS" spec={L} f={f} start={W.opportunites - 3} stagger={1} settle={7} color={C3.cyan} lockColor={C3.amber} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 120, top: 356}}>
        <FlipChars text="SE TROUVAIENT…" spec={L} f={f} start={W.se} stagger={0.7} exit={131} />
      </div>
      <div style={{position: 'absolute', left: 112, top: 462, display: 'flex', fontFamily: FONTS.display, fontWeight: 700, fontSize: aud.fontSize, letterSpacing: '-0.03em', lineHeight: 1, color: C3.white}}>
        {[...'AU-DELÀ'].map((c, i) => {
          const s0 = W.auDela - 4 + i * 1.6;
          const p = prog(f, s0, s0 + 12, EASE.out);
          const fo = fallOut(i);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translate(${lerp(-520, 0, p)}px, ${900 * fo}px) scaleX(${lerp(2.4, 1, p)}) rotate(${fo * (i % 2 ? 30 : -25)}deg)`,
                transformOrigin: '0 100%',
                opacity: clamp01(p * 2) * (1 - clamp01((fo - 0.6) * 2.5)),
                filter: p < 1 ? `blur(${lerp(10, 0, p).toFixed(1)}px)` : undefined,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 124, top: 700, transform: `translateY(${900 * prog(f, 134, 150, (t) => t * t)}px)`}}>
        <WaveChars text="D'ANTANANARIVO ?" spec={{fontFamily: 'Space Grotesk', fontSize: 88, fontWeight: 700, letterSpacing: -0.01}} f={f} start={W.dAntananarivo - 2} stagger={1} color={C3.cyan} charColor={(i) => (i === 15 ? C3.amber : undefined)} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ SCÈNE 02
/**
 * V4 · SCÈNE 02 — 6 → 12 s — Plongée sur l'île pleine jusqu'au trajet.
 * Le texte « LA TRAJECTOIRE D'UNE ENTREPRISE » suit littéralement la route,
 * révélé par la comète. Recul rapide puis « NOUVELLES OPPORTUNITÉS ».
 */
const ROUTE: Pt[] = [TANA, [TANA[0] + 30, TANA[1] - 58], [TOAM[0] - 52, TOAM[1] - 40], TOAM];

export const v4View2 = (f: number): View => {
  if (f < 232) return viewLerp(V_A1, V_Z, MID, prog(f, 154, 200, EASE.inOut));
  return viewLerp(V_Z, V_P, MID, prog(f, 232, 252, EASE.inOut));
};

export const V4_Scene02: React.FC<{f: number}> = ({f}) => {
  const v = v4View2(f);
  const fillOp = lerp(0.95, 0.18, prog(f, 146, 176, EASE.out));
  const coast = smoothPathD(mapPts(ISLAND_RAW, v));
  const r = ROUTE.map((p) => toScreen(p, v));
  const routeD = `M ${r[0][0]} ${r[0][1]} C ${r[1][0]} ${r[1][1]} ${r[2][0]} ${r[2][1]} ${r[3][0]} ${r[3][1]}`;
  const draw = prog(f, 180, 214, EASE.inOut);
  const comet = toScreen(bezier(ROUTE, draw), v);
  const tanaS = toScreen(TANA, v);
  const toamS = toScreen(TOAM, v);
  const pTana = prog(f, 168, 180, EASE.overshoot);
  const pToam = prog(f, 212, 224, EASE.overshoot);
  const pathText = (1 - prog(f, 228, 238)) * prog(f, 180, 186);
  const big: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 140, fontWeight: 700, letterSpacing: -0.025};
  const bigSize = Math.min(140, (140 * 1040) / textWidth('OPPORTUNITÉS', big));
  const bs = {...big, fontSize: bigSize};
  const islandOut = f >= 290 ? 0 : 1;

  return (
    <div style={{position: 'absolute', inset: 0, background: NAVY_BG}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: islandOut}}>
        <defs>
          <mask id="v4routeMask" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            <path d={routeD} fill="none" stroke="white" strokeWidth={200} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" />
          </mask>
          <path id="v4routePath" d={routeD} />
          <radialGradient id="v4comet">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.4" stopColor={C3.amber} stopOpacity="0.9" />
            <stop offset="1" stopColor={C3.amber} stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={coast} fill={C3.cyan} opacity={fillOp} />
        <path d={coast} fill="none" stroke={C3.cyan} strokeWidth={3} opacity={prog(f, 146, 160)} />
        {draw > 0 ? <path d={routeD} fill="none" stroke={C3.amber} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} style={{filter: `drop-shadow(0 0 10px ${C3.amber})`}} /> : null}
        {/* texte sur la trajectoire */}
        <g mask="url(#v4routeMask)" opacity={pathText}>
          <text fontFamily="Space Grotesk" fontWeight={700} fontSize={38} fill={C3.white} letterSpacing="1">
            <textPath href="#v4routePath" startOffset="3%">
              <tspan dy={-24}>LA TRAJECTOIRE D'UNE ENTREPRISE</tspan>
            </textPath>
          </text>
        </g>
        {f >= 180 && draw < 1 ? <circle cx={comet[0]} cy={comet[1]} r={30} fill="url(#v4comet)" /> : null}
        {pTana > 0 ? (
          <>
            <circle cx={tanaS[0]} cy={tanaS[1]} r={11 * pTana} fill={C3.white} />
            <circle cx={tanaS[0]} cy={tanaS[1]} r={11 + 30 * prog(f, 168, 192)} fill="none" stroke={C3.white} strokeWidth={2} opacity={1 - prog(f, 168, 192)} />
          </>
        ) : null}
        {pToam > 0 ? (
          <>
            <circle cx={toamS[0]} cy={toamS[1]} r={13 * pToam} fill={C3.flame} />
            {[0, 1, 2].map((k) => {
              const p = (((f - 212 + k * 10) % 30) + 30) % 30 / 30;
              return <circle key={k} cx={toamS[0]} cy={toamS[1]} r={13 + 60 * p} fill="none" stroke={C3.flame} strokeWidth={3} opacity={1 - p} />;
            })}
          </>
        ) : null}
      </svg>
      {pTana > 0 ? <CityLabel x={tanaS[0]} y={tanaS[1] + 50} text="ANTANANARIVO" p={pTana * (1 - prog(f, 230, 238))} color={C3.navy} bg={C3.white} side="left" size={24} /> : null}
      {pToam > 0 && islandOut ? <CityLabel x={toamS[0]} y={toamS[1] - 26} text="TOAMASINA" p={pToam} color={C3.white} bg={C3.flame} size={f < 232 ? 26 : 20} /> : null}

      {/* NOUVELLES OPPORTUNITÉS */}
      {f >= 246 ? (
        <>
          <div style={{position: 'absolute', left: 120, top: 300}}>
            <FlipChars text="NOUVELLES" spec={bs} f={f} start={248} stagger={1} dur={13} exit={288} />
          </div>
          <div style={{position: 'absolute', left: 120, top: 300 + bigSize * 1.05, transform: `translateX(${-1400 * prog(f, 290, 304, (t) => t * t)}px)`}}>
            <Scramble text="OPPORTUNITÉS" spec={bs} f={f} start={252} stagger={0.9} settle={7} color={C3.cyan} lockColor={C3.amber} />
          </div>
          <div style={{position: 'absolute', left: 124, top: 300 + bigSize * 2.3, transform: `translateX(${-900 * prog(f, 292, 304, (t) => t * t)}px)`}}>
            <Tag text="DEVENEZ EXPOSANT" f={f} start={266} size={34} bg={C3.flame} color={C3.white} />
          </div>
        </>
      ) : null}
    </div>
  );
};
