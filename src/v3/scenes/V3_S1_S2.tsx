import React from 'react';
import {getLength} from '@remotion/paths';
import {FONTS} from '../../config/theme';
import {MADAGASCAR} from '../../data/madagascar';
import {CharRise, Tag, WordSync, fontStyle, textWidth} from '../../components/Typography';
import {SegmentedArc} from '../../components/Primitives';
import {EASE, lerp, prog} from '../../lib/motion';
import {bezier} from '../../scenes/mapCamera';
import {PinIcon} from '../../v2/kit';
import {ArcIris, C3, NAVY_BG, PHOTOS, Photo, cover} from '../kit3';
import T from '../timeline.json';

const W = T.words;

// ------------------------------------------------------------------ carte (partagée S1 → S2)
const MS = 0.86;
const MT: [number, number] = [1290 - 253 * MS, 545 - 500 * MS];
const mapPt = (p: [number, number]) => [MT[0] + p[0] * MS, MT[1] + p[1] * MS] as [number, number];
const TANA = MADAGASCAR.cities.antananarivo;
const TOAM = MADAGASCAR.cities.toamasina;
const ROUTE: [number, number][] = [TANA, [TANA[0] + 30, TANA[1] - 58], [TOAM[0] - 52, TOAM[1] - 40], TOAM];
const MID = mapPt([(TANA[0] + TOAM[0]) / 2, (TANA[1] + TOAM[1]) / 2]);
const COAST = getLength(MADAGASCAR.path);

/** Caméra 2D de la carte : vue de l'île entière puis rapprochement sur le trajet. */
const cam = (f: number) => {
  const t = prog(f, 176, 228, EASE.inOut);
  const z = lerp(1, 2.05, t);
  const A: [number, number] = [lerp(MID[0], 960, t), lerp(MID[1], 600, t)];
  return {z, A, scr: (p: [number, number]) => [A[0] + (p[0] - MID[0]) * z, A[1] + (p[1] - MID[1]) * z] as [number, number]};
};

const PC_TANA = {w: 360, h: 240};
const PC_TOAM = {w: 270, h: 350};
const tanaCardRect = (f: number) => {
  const p = cam(f).scr(mapPt(TANA));
  return {x: p[0] - PC_TANA.w - 34, y: p[1] - PC_TANA.h - 34, w: PC_TANA.w, h: PC_TANA.h};
};
const toamCardRect = (f: number) => {
  const p = cam(f).scr(mapPt(TOAM));
  return {x: p[0] + 34, y: p[1] - PC_TOAM.h - 30, w: PC_TOAM.w, h: PC_TOAM.h};
};

// ------------------------------------------------------------------ SCÈNE 01
/**
 * V3 · SCÈNE 01 — 0 → 6 s — Antananarivo en vraie photo (parallaxe 2,5D),
 * révélée par l'arc segmenté du logo. « AU-DELÀ » déborde de la colonne de texte
 * jusque sur la photo. La photo se range ensuite en carte postale sur la carte.
 */
const CARD1 = {x: 800, y: 190, w: 1000, h: 667};

export const V3_Scene01: React.FC<{f: number}> = ({f}) => {
  const reveal = prog(f, 4, 30, EASE.inOut);
  const fly = prog(f, 132, 160, EASE.inOut);
  const target = tanaCardRect(160);
  const r = {
    x: lerp(CARD1.x, target.x, fly),
    y: lerp(CARD1.y, target.y, fly),
    w: lerp(CARD1.w, target.w, fly),
    h: lerp(CARD1.h, target.h, fly),
  };
  const zoom = lerp(1.16, 1.02, prog(f, 4, 150, EASE.out));
  const geo = cover('tana', r.w, r.h, zoom, 0.5, 0.55);
  const par = 34 * prog(f, 10, 150, EASE.soft);
  const bgFade = 1 - prog(f, 134, 152);
  const textOut = prog(f, 128, 146, EASE.in);

  const audSpec = {fontFamily: 'Space Grotesk' as const, fontSize: 250, fontWeight: 700, letterSpacing: -0.03};
  const audIn = prog(f, W.auDela - 4, W.auDela + 10, EASE.out);
  const audX = lerp(-textWidth('AU-DELÀ', audSpec) - 100, 112, audIn) + 50 * prog(f, W.auDela + 10, 132, EASE.soft) + 1400 * prog(f, 128, 146, EASE.in);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: 0, background: NAVY_BG, opacity: bgFade}} />

      {/* photo d'Antananarivo */}
      {f >= 4 ? (
        <div
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
            borderRadius: lerp(30, 18, fly),
            overflow: 'hidden',
            clipPath: reveal < 1 ? `circle(${(reveal * 75).toFixed(2)}% at 50% 50%)` : undefined,
            boxShadow: '0 30px 60px rgba(1,38,63,0.45)',
          }}
        >
          <Photo k="tana" geo={geo} parallax={par} />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,66,110,0) 55%, rgba(1,38,63,0.55) 100%)'}} />
        </div>
      ) : null}
      {f < 34 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <SegmentedArc cx={CARD1.x + CARD1.w / 2} cy={CARD1.y + CARD1.h / 2} r={reveal * 620 + 20} thickness={46} start={-120 + 300 * reveal} end={140 + 300 * reveal} segments={13} colors={[C3.cyan, C3.white]} gap={1.6} opacity={1 - prog(f, 26, 34)} />
        </svg>
      ) : null}

      {/* texte */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - textOut, transform: `translateX(${-120 * textOut}px)`}}>
        <div style={{position: 'absolute', left: 120, top: 190, display: 'flex', alignItems: 'center', gap: 12, opacity: prog(f, 24, 34), transform: `translateY(${lerp(16, 0, prog(f, 24, 36, EASE.out))}px)`}}>
          <PinIcon size={34} color={C3.cyan} dot={C3.navy} />
          <div style={{fontFamily: FONTS.body, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', color: C3.white}}>ANTANANARIVO</div>
        </div>
        <div style={{position: 'absolute', left: 120, top: 262, width: 620}}>
          <WordSync
            words={[
              {text: 'Et', at: W.etSi},
              {text: 'si', at: W.etSi + 5},
              {text: 'vos', at: W.vos},
              {text: 'prochaines', at: W.prochaines},
              {text: 'grandes', at: W.grandes},
              {text: 'opportunités', at: W.opportunites, color: C3.amber},
              {text: 'se', at: W.se},
              {text: 'trouvaient…', at: W.trouvaient},
            ]}
            spec={{fontFamily: 'Inter', fontSize: 42, fontWeight: 600}}
            f={f}
            style={{lineHeight: 1.25}}
          />
        </div>
      </div>
      <div style={{position: 'absolute', left: audX, top: 450, ...fontStyle(audSpec), color: C3.white, textShadow: '0 10px 40px rgba(1,38,63,0.55)', opacity: 1 - prog(f, 140, 148)}}>AU-DELÀ</div>
      <div style={{position: 'absolute', left: 126, top: 730, opacity: 1 - textOut, transform: `translateX(${-120 * textOut}px)`}}>
        <CharRise text="D'ANTANANARIVO ?" spec={{fontFamily: 'Space Grotesk', fontSize: 92, fontWeight: 700, letterSpacing: -0.01}} f={f} start={W.dAntananarivo - 2} stagger={1} dur={13} color={C3.amber} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ SCÈNE 02
/**
 * V3 · SCÈNE 02 — 6 → 12 s — Silhouette exacte de Madagascar, trajet
 * Antananarivo → Toamasina, cartes postales photo épinglées sur chaque ville ;
 * la carte de Toamasina s'agrandit et devient le fond de « NOUVELLES OPPORTUNITÉS ».
 */
export const V3_Scene02: React.FC<{f: number}> = ({f}) => {
  const c = cam(f);
  const mapIn = prog(f, 138, 168, EASE.out);
  const coast = prog(f, 138, 200, EASE.inOut);
  const route = prog(f, 176, 214, EASE.inOut);
  const tanaS = c.scr(mapPt(TANA));
  const toamS = c.scr(mapPt(TOAM));
  const car = c.scr(mapPt(bezier(ROUTE, route)));
  const r0 = ROUTE.map(mapPt);
  const routePath = `M ${r0[0][0]} ${r0[0][1]} C ${r0[1][0]} ${r0[1][1]} ${r0[2][0]} ${r0[2][1]} ${r0[3][0]} ${r0[3][1]}`;
  const tc = tanaCardRect(f);
  const pToam = prog(f, 214, 228, EASE.overshoot);

  // agrandissement de la carte de Toamasina
  const ex = prog(f, 234, 258, EASE.inOut);
  const tr0 = toamCardRect(234);
  const tr = f < 234 ? toamCardRect(f) : {x: lerp(tr0.x, 0, ex), y: lerp(tr0.y, 0, ex), w: lerp(tr0.w, 1920, ex), h: lerp(tr0.h, 1080, ex)};
  const geoToam = cover('arena', tr.w, tr.h, lerp(1.05, 1.12, ex), PHOTOS.arena.poi[0], 0.42);
  const geoTana = cover('tana', tc.w, tc.h, 1.02, 0.5, 0.55);
  const overlay = prog(f, 244, 262);
  const oppSize = Math.min(178, (178 * 1640) / textWidth('OPPORTUNITÉS', {fontFamily: 'Space Grotesk', fontSize: 178, fontWeight: 700, letterSpacing: -0.02}));

  return (
    <div style={{position: 'absolute', inset: 0, background: NAVY_BG}}>
      {/* île */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: mapIn}}>
        <defs>
          <clipPath id="v3island">
            <path d={MADAGASCAR.path} />
          </clipPath>
          <pattern id="v3dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4.5" cy="4.5" r="1.6" fill={C3.cyan} opacity="0.55" />
          </pattern>
        </defs>
        <g transform={`translate(${c.A[0] - MID[0] * c.z} ${c.A[1] - MID[1] * c.z}) scale(${c.z})`}>
          <g transform={`translate(${MT[0]} ${MT[1]}) scale(${MS})`}>
            <path d={MADAGASCAR.path} fill={C3.cyan} opacity={0.14} />
            <rect x={-50} y={-50} width={700} height={1100} fill="url(#v3dots)" clipPath="url(#v3island)" opacity={0.6} />
            <path d={MADAGASCAR.path} fill="none" stroke={C3.cyan} strokeWidth={3 / (MS * c.z)} strokeDasharray={coast < 1 ? COAST : undefined} strokeDashoffset={coast < 1 ? COAST * (1 - coast) : undefined} strokeLinejoin="round" />
          </g>
          <path d={routePath} fill="none" stroke={C3.amber} strokeWidth={6 / c.z} strokeLinecap="round" pathLength={1} strokeDasharray={`${route} 1`} />
        </g>
        {f >= 176 && route < 1 ? <circle cx={car[0]} cy={car[1]} r={11} fill={C3.white} stroke={C3.amber} strokeWidth={4} /> : null}
        <circle cx={tanaS[0]} cy={tanaS[1]} r={9} fill={C3.white} />
        <line x1={tanaS[0]} y1={tanaS[1]} x2={tc.x + tc.w} y2={tc.y + tc.h} stroke={C3.white} strokeWidth={2} opacity={0.7 * prog(f, 160, 168)} />
        {pToam > 0 ? <circle cx={toamS[0]} cy={toamS[1]} r={11 * pToam} fill={C3.flame} /> : null}
      </svg>

      {/* carte postale Antananarivo (arrivée depuis la scène 01) */}
      {f >= 158 ? (
        <div style={{position: 'absolute', left: tc.x, top: tc.y, width: tc.w, height: tc.h, borderRadius: 18, overflow: 'hidden', border: `6px solid ${C3.white}`, boxShadow: '0 20px 40px rgba(1,38,63,0.45)', opacity: 1 - prog(f, 236, 248)}}>
          <Photo k="tana" geo={geoTana} parallax={8} />
          <div style={{position: 'absolute', left: 12, bottom: 10, fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: C3.white, textShadow: '0 2px 8px rgba(0,0,0,0.5)'}}>ANTANANARIVO</div>
        </div>
      ) : null}

      {/* légende du trajet */}
      <div style={{position: 'absolute', left: 120, top: 860, fontFamily: FONTS.body, fontWeight: 700, fontSize: 26, letterSpacing: '0.22em', color: C3.white, opacity: prog(f, W.trajectoire - 6, W.trajectoire + 6) * (1 - prog(f, 236, 246))}}>
        ANTANANARIVO <span style={{color: C3.amber}}>→</span> TOAMASINA
      </div>
      <div style={{position: 'absolute', left: 120, top: 760, ...fontStyle({fontFamily: 'Space Grotesk', fontSize: 64, fontWeight: 700, letterSpacing: -0.01}), color: C3.white, opacity: prog(f, W.trajectoire - 4, W.trajectoire + 8) * (1 - prog(f, 236, 246)), transform: `translateY(${lerp(30, 0, prog(f, W.trajectoire - 4, W.trajectoire + 10, EASE.out))}px)`}}>
        La trajectoire d'une entreprise.
      </div>

      {/* carte postale Toamasina → plein écran */}
      {pToam > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: tr.x,
            top: tr.y,
            width: tr.w,
            height: tr.h,
            borderRadius: lerp(18, 0, ex),
            overflow: 'hidden',
            border: ex < 1 ? `${lerp(6, 0, ex)}px solid ${C3.white}` : undefined,
            transform: f < 234 ? `scale(${pToam})` : undefined,
            transformOrigin: '0% 100%',
            boxShadow: '0 20px 40px rgba(1,38,63,0.45)',
          }}
        >
          <Photo k="arena" geo={geoToam} parallax={lerp(0, 30, prog(f, 214, 300))} blur={4 * overlay} />
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(1,38,63,0.92) 0%, rgba(2,66,110,0.78) 55%, rgba(2,66,110,0.45) 100%)`, opacity: overlay}} />
          {ex < 0.2 ? <div style={{position: 'absolute', left: 12, bottom: 10, fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: C3.white, textShadow: '0 2px 8px rgba(0,0,0,0.5)', opacity: 1 - ex * 5}}>TOAMASINA</div> : null}
        </div>
      ) : null}

      {/* NOUVELLES OPPORTUNITÉS */}
      {f >= 248 ? (
        <>
          <div style={{position: 'absolute', left: 120, top: 300}}>
            <CharRise text="NOUVELLES" spec={{fontFamily: 'Space Grotesk', fontSize: oppSize, fontWeight: 700, letterSpacing: -0.02}} f={f} start={248} stagger={1} dur={13} />
          </div>
          <div style={{position: 'absolute', left: 120, top: 300 + oppSize * 1.02}}>
            <CharRise
              text="OPPORTUNITÉS"
              spec={{fontFamily: 'Space Grotesk', fontSize: oppSize, fontWeight: 700, letterSpacing: -0.02}}
              f={f}
              start={254}
              stagger={1}
              dur={13}
              charStyle={() => ({background: `linear-gradient(90deg, ${C3.amber}, ${C3.flame})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'})}
            />
          </div>
          <div style={{position: 'absolute', left: 124, top: 300 + oppSize * 2.25}}>
            <Tag text="DEVENEZ EXPOSANT" f={f} start={266} size={34} bg={C3.flame} color={C3.white} />
          </div>
        </>
      ) : null}

      <ArcIris f={f} start={290} dur={16} color={C3.white} />
    </div>
  );
};

