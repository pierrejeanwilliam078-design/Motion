import React from 'react';
import {FONTS} from '../../config/theme';
import {CharRise, FontSpec, textWidth, fontStyle} from '../../components/Typography';
import {Hex, SegmentedArc} from '../../components/Primitives';
import {EASE, lerp, prog} from '../../lib/motion';
import {ArcIris, C3, Chip, NAVY_BG, PHOTOS, Photo, PhotoType, PinDrop, cover} from '../kit3';
import {outlineFilter} from '../../v2/kit';
import {COLORS} from '../../config/theme';
import T from '../timeline.json';

const W = T.words;

// ------------------------------------------------------------------ SCÈNE 03
/**
 * V3 · SCÈNE 03 — 12 → 19 s — Fond blanc. La vraie photo de l'Arena de Toamasina
 * (port, plage, salle) en grand format vertical, épinglée « ARENA TOAMASINA ».
 * Le texte « FAITES RAYONNER VOTRE MARQUE » occupe la colonne de gauche.
 */
const CARD = {x: 1130, y: 118, w: 620, h: 803};
const HEAD: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 132, fontWeight: 700, letterSpacing: -0.025};

export const V3_Scene03: React.FC<{f: number}> = ({f}) => {
  const up = prog(f, 300, 324, EASE.out);
  const push = prog(f, 452, 480, EASE.inOut);
  const card = {
    x: lerp(CARD.x, 0, push),
    y: lerp(CARD.y, 0, push),
    w: lerp(CARD.w, 1920, push),
    h: lerp(CARD.h, 1080, push),
  };
  const zoom = lerp(1.2, 1.04, prog(f, 300, 450, EASE.out)) * lerp(1, 1.1, push);
  const geo = cover('arena', card.w, card.h, zoom, PHOTOS.arena.poi[0], 0.56);
  const par = 40 * prog(f, 300, 470, EASE.soft);
  const pin = geo.at(...PHOTOS.arena.poi);
  const headSize = Math.min(132, (132 * 930) / textWidth('VOTRE MARQUE', HEAD));
  const spec = {...HEAD, fontSize: headSize};
  const textOut = prog(f, 448, 466, EASE.in);
  const navy = prog(f, 462, 480);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* le fond blanc n'apparaît qu'une fois l'iris de la scène 02 refermé */}
      {f >= 306 ? <div style={{position: 'absolute', inset: 0, background: C3.white}} /> : null}

      {/* motif : arc segmenté + hexagones issus du logo */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: 1 - push}}>
        <SegmentedArc cx={CARD.x + 20} cy={CARD.y + CARD.h - 20} r={190} thickness={30} start={95 + f * 0.2} end={265 + f * 0.2} segments={9} reveal={prog(f, 304, 330)} colors={[C3.cyan, C3.navy]} />
        <Hex cx={CARD.x + CARD.w + 40} cy={CARD.y + 60} r={34} rot={f * 0.5} fill={C3.amber} opacity={prog(f, 318, 326)} />
        <Hex cx={CARD.x + CARD.w + 78} cy={CARD.y + 128} r={20} rot={-f * 0.7} stroke={C3.flame} strokeWidth={4} opacity={prog(f, 322, 330)} />
      </svg>

      {/* photo Arena */}
      <div
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          width: card.w,
          height: card.h,
          borderRadius: lerp(30, 0, push),
          overflow: 'hidden',
          clipPath: up < 1 ? `inset(${((1 - up) * 100).toFixed(2)}% 0 0 0 round 30px)` : undefined,
          boxShadow: '0 30px 60px rgba(1,38,63,0.25)',
        }}
      >
        <Photo k="arena" geo={geo} parallax={par} />
        <div style={{position: 'absolute', inset: 0, background: C3.navy, opacity: navy}} />
      </div>
      {f < 452 ? (
        <div style={{position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, overflow: 'hidden', borderRadius: 30}}>
          <PinDrop f={f} start={330} x={pin[0]} y={pin[1]} label="ARENA TOAMASINA" dark size={58} side={pin[0] > CARD.w * 0.55 ? 'left' : 'right'} cw={CARD.w} />
        </div>
      ) : null}

      {/* texte */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - textOut, transform: `translateX(${-140 * textOut}px)`}}>
        <div style={{position: 'absolute', left: 120, top: 190, display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 64 * prog(f, W.aToamasina - 4, W.aToamasina + 8, EASE.out), height: 4, background: C3.flame}} />
          <div style={{fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, letterSpacing: `${lerp(0.5, 0.3, prog(f, W.aToamasina, W.aToamasina + 14, EASE.out))}em`, color: C3.cyan, opacity: prog(f, W.aToamasina, W.aToamasina + 8), whiteSpace: 'nowrap'}}>
            À TOAMASINA
          </div>
        </div>
        <div style={{position: 'absolute', left: 116, top: 250}}>
          <CharRise text="FAITES" spec={spec} f={f} start={W.faites - 16} stagger={1.1} dur={13} color={C3.navy} />
        </div>
        <div style={{position: 'absolute', left: 116, top: 250 + headSize * 1.05}}>
          <CharRise text="RAYONNER" spec={spec} f={f} start={W.faites - 8} stagger={1.1} dur={13} color={C3.cyan} />
        </div>
        <div style={{position: 'absolute', left: 116, top: 250 + headSize * 2.1, display: 'flex', gap: '0.25em', ...fontStyle(spec)}}>
          <CharRise text="VOTRE" spec={spec} f={f} start={W.marque - 10} stagger={1.1} dur={13} color={C3.navy} />
          <CharRise text="MARQUE" spec={spec} f={f} start={W.marque - 3} stagger={1.1} dur={13} charStyle={() => ({background: `linear-gradient(90deg, ${C3.flame}, ${C3.amber})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'})} />
        </div>
        <div style={{position: 'absolute', left: 120, top: 250 + headSize * 3.45, display: 'flex', gap: 20}}>
          <Chip f={f} start={W.idees - 2} text="VOS IDÉES" bg={C3.cyan} color={C3.white} />
          <Chip f={f} start={W.ambitions - 2} text="VOS AMBITIONS" bg={C3.amber} color={C3.navy} />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ SCÈNE 04
/**
 * V3 · SCÈNE 04 — 19 → 25 s — Typographie remplie par les vraies photos.
 * RENCONTRES (photo d'Antananarivo) : deux groupes se percutent.
 * VISIBILITÉ (photo de Toamasina) : iris bordé de l'arc du logo.
 * OPPORTUNITÉS : fond orange GSN, lettres qui grandissent puis rideau photo.
 */
const BIG: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 250, fontWeight: 700, letterSpacing: -0.035};
const fit = (t: string, max: number) => ({...BIG, fontSize: Math.min(BIG.fontSize, (BIG.fontSize * max) / textWidth(t, BIG))});

export const V3_Scene04: React.FC<{f: number}> = ({f}) => {
  const H1 = 487;
  const rS = fit('RENCONTRES', 1640);
  const wA = textWidth('RENCON', rS);
  const wAll = textWidth('RENCONTRES', rS);
  const x0 = 960 - wAll / 2;
  const land = prog(f, 474, H1, (t) => t * t);
  const rec = f >= H1 ? 18 * Math.sin(((f - H1) * Math.PI) / 7) * Math.exp(-(f - H1) / 5) : 0;
  const top = (s: FontSpec) => 540 - s.fontSize * 0.5;
  const flash = f >= H1 ? Math.exp(-(f - H1) / 3) : 0;
  const vS = fit('VISIBILITÉ', 1560);
  const vW = textWidth('VISIBILITÉ', vS);
  const oS = fit('OPPORTUNITÉS', 1640);
  const oW = textWidth('OPPORTUNITÉS', oS);
  const curtain = prog(f, 600, 630, EASE.inOut);

  return (
    <div style={{position: 'absolute', inset: 0, background: NAVY_BG, overflow: 'hidden'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: 0.25}}>
        <defs>
          <pattern id="v3dots4" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.6" fill={C3.cyan} />
          </pattern>
        </defs>
        <rect width={1920} height={1080} fill="url(#v3dots4)" />
      </svg>

      {/* RENCONTRES */}
      {f < 540 ? (
        <>
          <div style={{position: 'absolute', left: lerp(-wA - 200, x0, land) - rec, top: top(rS)}}>
            <div style={{position: 'absolute', left: 0, top: 0, ...fontStyle(rS), color: '#000', filter: outlineFilter(COLORS.cyan)}}>RENCON</div>
            <PhotoType k="tana" text="RENCON" width={wA + 10} height={rS.fontSize * 1.2} style={{...fontStyle(rS), position: 'relative'}} zoom={1.4} tint="rgba(255,255,255,0.12)" />
          </div>
          <div style={{position: 'absolute', left: lerp(2120, x0 + wA, land) + rec, top: top(rS)}}>
            <div style={{position: 'absolute', left: 0, top: 0, ...fontStyle(rS), color: '#000', filter: outlineFilter(COLORS.cyan)}}>TRES</div>
            <PhotoType k="tana" text="TRES" width={wAll - wA + 10} height={rS.fontSize * 1.2} style={{...fontStyle(rS), position: 'relative'}} zoom={1.4} tint="rgba(255,255,255,0.12)" />
          </div>
          <div style={{position: 'absolute', left: x0 + wA - 3, top: top(rS) - 20, width: 6, height: rS.fontSize * 1.2, background: C3.amber, opacity: flash, boxShadow: `0 0 30px ${C3.amber}`}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: top(rS) + rS.fontSize * 1.15, textAlign: 'center', fontFamily: FONTS.body, fontWeight: 700, fontSize: 28, letterSpacing: '0.3em', color: C3.white, opacity: prog(f, 492, 502) * (1 - prog(f, 516, 522))}}>
            DE NOUVEAUX PUBLICS
          </div>
        </>
      ) : null}

      {/* VISIBILITÉ */}
      <ArcIris f={f} start={518} dur={12} color={C3.white}>
        <div style={{position: 'absolute', left: 960 - vW / 2, top: top(vS), transform: `scale(${lerp(1.12, 1, prog(f, 518, 540, EASE.out))})`}}>
          <PhotoType k="arena" text="VISIBILITÉ" width={vW + 10} height={vS.fontSize * 1.2} style={{...fontStyle({...vS, letterSpacing: lerp(0.06, vS.letterSpacing!, prog(f, 520, 545, EASE.out))})}} tint="rgba(2,66,110,0.35)" zoom={1.2} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: top(vS) + vS.fontSize * 1.15, textAlign: 'center', fontFamily: FONTS.body, fontWeight: 700, fontSize: 28, letterSpacing: '0.3em', color: C3.navy, opacity: prog(f, W.creez, W.creez + 10)}}>
          DES CONNEXIONS QUI COMPTENT
        </div>
      </ArcIris>

      {/* OPPORTUNITÉS */}
      <ArcIris f={f} start={558} dur={12} color={C3.flame} ring={[C3.amber, C3.white]}>
        <div style={{position: 'absolute', left: 960 - oW / 2, top: top(oS) - 1080 * curtain, display: 'flex', ...fontStyle(oS), color: C3.white}}>
          {[...'OPPORTUNITÉS'].map((c, i) => {
            const p = prog(f, 563 + i * 0.8, 575 + i * 0.8, EASE.overshoot);
            const grow = 1 + 0.06 * prog(f, 578 + i * 0.6, 598 + i * 0.6, EASE.inOut);
            return (
              <span key={i} style={{display: 'inline-block', transform: `translateY(${lerp(80, 0, p)}px) scale(${lerp(0.5, 1, p) * grow})`, transformOrigin: '50% 100%', opacity: Math.min(1, p * 3)}}>
                {c}
              </span>
            );
          })}
        </div>
      </ArcIris>
    </div>
  );
};
