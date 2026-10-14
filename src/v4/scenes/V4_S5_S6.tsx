import React from 'react';
import {FONTS} from '../../config/theme';
import {FontSpec, Tag, fontStyle, textWidth} from '../../components/Typography';
import {GsnLogo, LOGO_RATIO} from '../../components/Primitives';
import {EASE, clamp01, hash, lerp, prog} from '../../lib/motion';
import {MailIcon, PhoneIcon, PinIcon} from '../../v2/kit';
import {C3, NAVY_BG, PHOTOS, Photo, PinDrop, cover} from '../../v3/kit3';
import {BBOX_C, DOTS, ISLAND_N, ISLAND_SMOOTH, Pt, TOAM, View, align, circlePts, mapPts, morph, scaleAbout, toPath, toScreen} from '../island';
import {FlipChars, Scramble} from '../kit4';
import {V5} from './V4_S3_S4';
import T from '../timeline.json';

const W = T.words;

// ------------------------------------------------------------------ SCÈNE 05
/**
 * V4 · SCÈNE 05 — 25 → 33 s — Drop : l'île de points s'illumine en ondes depuis
 * Toamasina ; le nom du salon court le long des côtes (texte sur le contour) ;
 * dates qui roulent, logo, titre décodé, puis un trait relie Toamasina à
 * « ARENA TOAMASINA » et à sa photo. Sortie : l'île se transforme en cercle blanc.
 */
const RX = 1010;
const CARD = {x: RX, y: 160, w: 560, h: 360};
const NUM: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 230, fontWeight: 700, letterSpacing: -0.02};
const MON: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 70, fontWeight: 700, letterSpacing: 0.01};
const DATE_F = {y: 732, size: 46};
const RING_TEXT = 'GRAND SALON DU NUMÉRIQUE 2.0  •  3 – 5 DÉCEMBRE 2026  •  ARENA TOAMASINA  •  ';

export const V4_Scene05: React.FC<{f: number}> = ({f}) => {
  const t = f - 626;
  const toamS = toScreen(TOAM, V5);
  const center = toScreen(BBOX_C, V5);
  const flash = t >= 0 ? Math.exp(-t / 4) : 0;
  const exitP = prog(f, 802, 808);
  const morphP = prog(f, 806, 818, EASE.inOut);
  const grow = prog(f, 818, 832, EASE.in);
  const islandPts = mapPts(ISLAND_N, V5);
  const circ = align(islandPts, circlePts(center, 300));
  const shape = morph(islandPts, circ, morphP);
  const shapeFinal = grow > 0 ? circlePts(center, lerp(300, 2300, grow)) : shape;
  const ringPath = toPath(mapPts(ISLAND_SMOOTH, {...V5, s: V5.s * 1.08}));
  const unit = textWidth(RING_TEXT, {fontFamily: 'Inter', fontSize: 19, fontWeight: 700, letterSpacing: 0.1});
  const ringOffset = -(((f - 640) * 2.4) % unit);
  const panelOut = prog(f, 802, 816, EASE.in);

  // dates
  const numStr = '3 – 5';
  const numW = textWidth(numStr, NUM);
  const kN = DATE_F.size / NUM.fontSize;
  const kM = DATE_F.size / MON.fontSize;
  const space = textWidth(' ', {...MON, fontSize: DATE_F.size});
  const mv = prog(f, 702, 730, EASE.inOut);
  const nY = lerp(150, DATE_F.y, mv);
  const mX = lerp(RX + 6, RX + numW * kN + space, mv);
  const mY = lerp(150 + NUM.fontSize * 1.0, DATE_F.y, mv);
  const logoP = prog(f, 712, 732, EASE.overshoot);
  const title: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 64, fontWeight: 700, letterSpacing: -0.015};
  // trait de rappel Toamasina → libellé
  const call = prog(f, W.arenaToamasina - 4, W.arenaToamasina + 10, EASE.inOut);
  const callPts: Pt[] = [toamS, [toamS[0] + 120, toamS[1]], [toamS[0] + 120, 838], [RX - 16, 838]];
  const thumb = prog(f, W.arenaToamasina + 6, W.arenaToamasina + 20, EASE.overshoot);
  const thumbGeo = cover('arena', 230, 150, 1.4, PHOTOS.arena.poi[0], PHOTOS.arena.poi[1]);

  return (
    <div style={{position: 'absolute', inset: 0, background: NAVY_BG}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <path id="v4ring" d={ringPath} />
        </defs>
        {/* texte qui court sur le contour de l'île */}
        <text fontFamily="Inter" fontWeight={700} fontSize={19} letterSpacing="1.9" fill={C3.cyan} opacity={prog(f, 640, 660) * (1 - exitP)}>
          <textPath href="#v4ring" startOffset={ringOffset}>
            {RING_TEXT.repeat(4)}
          </textPath>
        </text>
        {/* points */}
        {exitP < 1
          ? DOTS.map((d, i) => {
              const wave = Math.exp(-(((d.dToam - (t % 50) * 26) / 26) ** 2)) * (t >= 0 ? 1 : 0);
              const glow = Math.exp(-d.dToam / 45);
              const tw = 0.85 + 0.15 * Math.sin(f * 0.15 + d.r4 * 20);
              const tgt = toScreen(d.p, V5);
              const r = 3.1 * tw * (1 + 0.9 * wave + 0.6 * glow);
              const col = glow > 0.35 ? C3.amber : wave > 0.5 ? C3.white : d.r4 > 0.9 ? C3.white : C3.cyan;
              return <circle key={i} cx={tgt[0]} cy={tgt[1]} r={r} fill={col} opacity={1 - exitP} />;
            })
          : null}
        {/* Toamasina */}
        {[0, 1, 2].map((k) => {
          const p = (((t + k * 9) % 27) + 27) % 27 / 27;
          return <circle key={k} cx={toamS[0]} cy={toamS[1]} r={10 + 60 * p} fill="none" stroke={C3.flame} strokeWidth={3} opacity={(1 - p) * (1 - exitP)} />;
        })}
        <circle cx={toamS[0]} cy={toamS[1]} r={11} fill={C3.flame} opacity={1 - exitP} />
        {/* trait de rappel */}
        {call > 0 ? <polyline points={callPts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C3.flame} strokeWidth={3} pathLength={1} strokeDasharray={`${call} 1`} opacity={1 - panelOut} /> : null}
        {/* sortie : île → cercle blanc */}
        {exitP > 0 ? <path d={toPath(shapeFinal)} fill={C3.white} opacity={exitP} /> : null}
      </svg>
      {flash > 0.02 ? <div style={{position: 'absolute', inset: 0, background: C3.white, opacity: 0.45 * flash}} /> : null}

      {/* colonne d'informations */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - panelOut, transform: `translateX(${260 * panelOut}px)`}}>
        {f >= W.devenezExposant - 2 ? (
          <div style={{position: 'absolute', left: RX, top: 84}}>
            <Tag text="DEVENEZ EXPOSANT" f={f} start={W.devenezExposant - 2} size={30} bg={C3.flame} color={C3.white} />
          </div>
        ) : null}
        <div style={{position: 'absolute', left: RX, top: nY, transform: `scale(${lerp(1, kN, mv)})`, transformOrigin: '0 0', display: 'flex', ...fontStyle(NUM), color: C3.white}}>
          {[...numStr].map((c, i) => {
            const st = i === 0 ? W.du3au5 + 1 : i === 4 ? W.du3au5 + 15 : W.du3au5 + 8;
            const p = prog(f, st, st + 11, EASE.overshoot);
            const rolling = f < st + 6 && /\d/.test(c);
            const ch = rolling ? String(Math.floor(hash(f * 7 + i) * 10)) : c;
            return (
              <span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0.12em 0 0.08em', margin: '-0.12em 0 -0.08em'}}>
                <span style={{display: 'inline-block', transform: `translateY(${lerp(150, 0, p)}%)`, color: i === 2 ? C3.amber : C3.white}}>{ch === ' ' ? ' ' : ch}</span>
              </span>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: mX, top: mY, transform: `scale(${lerp(1, kM, mv)})`, transformOrigin: '0 0'}}>
          <FlipChars text="DÉCEMBRE 2026" spec={MON} f={f} start={W.decembre2026 - 6} stagger={0.8} color={C3.amber} />
        </div>
        {f >= 712 ? (
          <div style={{position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 28, background: C3.white, transform: `scale(${logoP})`, transformOrigin: '0% 50%', opacity: clamp01(logoP * 3), boxShadow: '0 24px 48px rgba(1,38,63,0.4)'}}>
            <div style={{position: 'absolute', left: (CARD.w - 430) / 2, top: (CARD.h - 430 * LOGO_RATIO) / 2}}>
              <GsnLogo width={430} />
            </div>
          </div>
        ) : null}
        <div style={{position: 'absolute', left: RX, top: 562}}>
          <Scramble text="GRAND SALON DU" spec={title} f={f} start={W.grandSalon - 4} stagger={0.7} settle={6} color={C3.cyan} lockColor={C3.white} />
        </div>
        <div style={{position: 'absolute', left: RX, top: 562 + 72, display: 'flex', gap: 18}}>
          <Scramble text="NUMÉRIQUE" spec={title} f={f} start={W.grandSalon + 6} stagger={0.7} settle={6} color={C3.cyan} lockColor={C3.white} />
          <Scramble text="2.0" spec={title} f={f} start={W.deuxPointZero - 4} stagger={1.5} settle={6} color={C3.white} lockColor={C3.cyan} />
        </div>
        {/* ARENA TOAMASINA + vignette photo */}
        <div style={{position: 'absolute', left: RX, top: 812, display: 'flex', alignItems: 'center', gap: 14, opacity: prog(f, W.arenaToamasina + 4, W.arenaToamasina + 12), transform: `translateX(${lerp(-40, 0, prog(f, W.arenaToamasina + 4, W.arenaToamasina + 16, EASE.out))}px)`}}>
          <PinIcon size={50} color={C3.flame} dot={C3.white} />
          <div style={{...fontStyle({fontFamily: 'Space Grotesk', fontSize: 46, fontWeight: 700, letterSpacing: 0}), color: C3.cyan}}>ARENA TOAMASINA</div>
        </div>
        {thumb > 0 ? (
          <div style={{position: 'absolute', left: 1560, top: 768, width: 230, height: 150, borderRadius: 18, overflow: 'hidden', border: `4px solid ${C3.white}`, transform: `scale(${thumb}) rotate(${lerp(-8, 3, clamp01(thumb))}deg)`, boxShadow: '0 16px 32px rgba(1,38,63,0.45)'}}>
            <Photo k="arena" geo={thumbGeo} parallax={6} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ SCÈNE 06
/**
 * V4 · SCÈNE 06 — 33 → 40 s — Fond blanc. Des points-opportunités défilent ;
 * l'un d'eux quitte le flux et se pose sur Toamasina au mot « place ».
 * « RÉSERVEZ VOTRE STAND » domine ; coordonnées jusqu'à la fin.
 */
const PHONE = '+261 34 40 302 89';
const EMAIL = 'gsn@elitecommunication.mg';
const V6: View = {s: 0.4, cx: 1470, cy: 300};

export const V4_Scene06: React.FC<{f: number}> = ({f}) => {
  const headBase: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 168, fontWeight: 700, letterSpacing: -0.03};
  const head = {...headBase, fontSize: Math.min(168, (168 * 1060) / textWidth('VOTRE STAND', headBase))};
  const l1 = 206;
  const l2 = l1 + head.fontSize * 0.98;
  const wVotre = textWidth('VOTRE ', head);
  const wStand = textWidth('STAND', head);
  const sw = prog(f, W.reservezVotreStand - 2, W.reservezVotreStand + 14, EASE.out);
  const isl = prog(f, 840, 858, EASE.overshoot);
  const islandD = toPath(mapPts(ISLAND_N, V6));
  const toamS = toScreen(TOAM, V6);
  const place = W.prenezVotrePlace;
  // le point choisi : quitte le flux à droite et se pose sur Toamasina
  const chosen = prog(f, place - 16, place, EASE.inOut);
  const cStart: Pt = [1900, 470];
  const cPos: Pt = [lerp(cStart[0], toamS[0], chosen), lerp(cStart[1], toamS[1], chosen) - Math.sin(Math.PI * chosen) * 120];
  const stream = 1 - prog(f, place - 2, place + 12);
  const row = (st: number) => prog(f, st, st + 14, EASE.out);

  return (
    <div style={{position: 'absolute', inset: 0, background: C3.white}}>
      {/* flux d'opportunités */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {f >= 836
          ? Array.from({length: 34}).map((_, i) => {
              const sp = 10 + hash(i + 5) * 14;
              const x = 2050 - (((f - 836) * sp + hash(i + 9) * 2200) % 2300);
              const y = 120 + hash(i + 17) * 470;
              const vis = clamp01((x - 1180) / 120) * stream;
              return vis > 0 ? <circle key={i} cx={x} cy={y} r={4 + 5 * hash(i + 3)} fill={i % 3 ? C3.cyan : C3.amber} opacity={0.55 * vis} /> : null;
            })
          : null}
        {/* ondes à la forme de l'île après « prenez votre place » */}
        {Array.from({length: 4}).map((_, j) => {
          const st = place + 4 + j * 24;
          const p = prog(f, st, st + 44, EASE.out);
          if (p <= 0 || p >= 1) return null;
          return <path key={`e${j}`} d={toPath(scaleAbout(mapPts(ISLAND_N, V6), toScreen(BBOX_C, V6), 1 + 0.5 * p))} fill="none" stroke={j % 2 ? C3.amber : C3.cyan} strokeWidth={2.5} opacity={(1 - p) * 0.8} />;
        })}
        {/* mini-île */}
        <g transform={`translate(${toamS[0]} ${toamS[1]}) scale(${isl}) translate(${-toamS[0]} ${-toamS[1]})`} opacity={clamp01(isl * 3)}>
          <path d={islandD} fill={C3.navy} />
          <path d={islandD} fill="none" stroke={C3.cyan} strokeWidth={2.5} />
        </g>
        {f >= place - 16 && f < place ? <circle cx={cPos[0]} cy={cPos[1]} r={11} fill={C3.amber} style={{filter: `drop-shadow(0 0 10px ${C3.amber})`}} /> : null}
      </svg>
      <PinDrop f={f} start={place} x={toamS[0]} y={toamS[1]} label="ARENA TOAMASINA" size={52} />

      {/* PRENEZ VOTRE PLACE */}
      <div style={{position: 'absolute', left: 120, top: 140, display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{width: 64 * prog(f, place - 2, place + 10, EASE.out), height: 4, background: C3.flame}} />
        <Scramble text="PRENEZ VOTRE PLACE" spec={{fontFamily: 'Inter', fontSize: 30, fontWeight: 800, letterSpacing: 0.3}} f={f} start={place} stagger={0.6} settle={5} color={C3.amber} lockColor={C3.cyan} />
      </div>

      {/* titre */}
      <div style={{position: 'absolute', left: 116, top: l1}}>
        <FlipChars text="RÉSERVEZ" spec={head} f={f} start={830} stagger={1.2} dur={13} color={C3.navy} />
      </div>
      <div style={{position: 'absolute', left: 116, top: l2}}>
        <FlipChars text="VOTRE STAND" spec={head} f={f} start={838} stagger={1} dur={13} color={C3.navy} charStyle={(i) => (i >= 6 && sw > 0.6 ? {color: C3.navy} : {})} />
      </div>
      <svg width={1300} height={70} style={{position: 'absolute', left: 116, top: l2 + head.fontSize * 0.9}}>
        <defs>
          <linearGradient id="v4sw" x1="0" x2="1">
            <stop offset="0" stopColor={C3.flame} />
            <stop offset="1" stopColor={C3.amber} />
          </linearGradient>
        </defs>
        <path d={`M ${wVotre} 34 Q ${wVotre + wStand * 0.5} 54 ${wVotre + wStand + 8} 16`} stroke="url(#v4sw)" strokeWidth={12} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - sw} />
      </svg>

      {/* coordonnées */}
      {[
        {st: 872, bg: C3.cyan, icon: <PhoneIcon size={38} />, text: PHONE, spec: {fontFamily: 'Space Grotesk' as const, fontSize: 68, fontWeight: 700, letterSpacing: 0}, top: 646},
        {st: 880, bg: C3.flame, icon: <MailIcon size={38} />, text: EMAIL, spec: {fontFamily: 'Space Grotesk' as const, fontSize: 52, fontWeight: 600, letterSpacing: -0.005}, top: 764},
      ].map((r) => {
        const p = row(r.st);
        return (
          <div key={r.text} style={{position: 'absolute', left: 120, top: r.top, display: 'flex', alignItems: 'center', gap: 24, opacity: clamp01(p * 2), transform: `translateX(${lerp(-60, 0, p)}px)`}}>
            <div style={{width: 80, height: 80, borderRadius: 40, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${prog(f, r.st, r.st + 10, EASE.overshoot)})`}}>{r.icon}</div>
            <div style={{...fontStyle(r.spec), color: C3.navy}}>{r.text}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 122, top: 932, fontFamily: FONTS.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.12em', color: 'rgba(2,66,110,0.75)', opacity: prog(f, 890, 904), whiteSpace: 'nowrap'}}>
        GRAND SALON DU NUMÉRIQUE 2.0 · 3 – 5 DÉCEMBRE 2026 · ARENA TOAMASINA
      </div>

      {/* logo officiel */}
      <div style={{position: 'absolute', left: 1330, top: 600, transform: `scale(${prog(f, 862, 878, EASE.overshoot)})`, transformOrigin: '50% 50%'}}>
        <GsnLogo width={460} />
      </div>
    </div>
  );
};
