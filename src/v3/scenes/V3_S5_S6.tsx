import React from 'react';
import {FONTS} from '../../config/theme';
import {CharRise, FontSpec, Tag, fontStyle, textWidth} from '../../components/Typography';
import {GsnLogo, LOGO_RATIO} from '../../components/Primitives';
import {EASE, clamp01, lerp, prog} from '../../lib/motion';
import {MailIcon, PhoneIcon, PinIcon} from '../../v2/kit';
import {ArcIris, C3, PHOTOS, Photo, PinDrop, cover} from '../kit3';
import T from '../timeline.json';

const W = T.words;

// ------------------------------------------------------------------ SCÈNE 05
/**
 * V3 · SCÈNE 05 — 25 → 33 s — Rideau photo : l'Arena de Toamasina occupe l'écran,
 * une colonne marine glisse à gauche. Dates en héros, puis logo officiel sur carte
 * blanche, titre, date, lieu ; une épingle tombe sur la salle au mot « Arena ».
 */
const COL = 760;
const LOGO_CARD = {x: 110, y: 120, w: 580, h: 390};
const LOGO_W = 440;
const DATE_FINAL = {x: 110, y: 760, size: 44};
const NUM: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 230, fontWeight: 700, letterSpacing: -0.02};
const MONTH_HERO = 66;
const MONTH: FontSpec = {fontFamily: 'Space Grotesk', fontSize: MONTH_HERO, fontWeight: 700, letterSpacing: 0.01};

export const V3_Scene05: React.FC<{f: number}> = ({f}) => {
  const rise = prog(f, 600, 630, EASE.inOut);
  const panelY = lerp(1080, 0, rise);
  const zoom = lerp(1, 1.08, prog(f, 630, 825, EASE.soft));
  // la photo remplit la zone à droite de la colonne ; la salle reste en place pendant le zoom
  const PW = 1920 - COL;
  const s = (PW / PHOTOS.arena.w) * zoom;
  const iw = PHOTOS.arena.w * s;
  const ih = PHOTOS.arena.h * s;
  const target: [number, number] = [COL + PHOTOS.arena.poi[0] * PW, 700];
  const geo = {s, iw, ih, x: target[0] - PHOTOS.arena.poi[0] * iw, y: target[1] - PHOTOS.arena.poi[1] * ih, at: () => [0, 0] as [number, number]};
  geo.x = Math.min(COL, Math.max(1920 - iw, geo.x));
  geo.y = Math.min(0, Math.max(1080 - ih, geo.y));
  const pin: [number, number] = [geo.x + PHOTOS.arena.poi[0] * iw, geo.y + PHOTOS.arena.poi[1] * ih];
  const colIn = prog(f, 604, 630, EASE.out);

  // dates héros → ligne finale
  const numStr = '3 – 5';
  const numW = textWidth(numStr, NUM);
  const kNum = DATE_FINAL.size / NUM.fontSize;
  const kMon = DATE_FINAL.size / MONTH_HERO;
  const space = textWidth(' ', {...MONTH, fontSize: DATE_FINAL.size});
  const mv = prog(f, 704, 732, EASE.inOut);
  const heroY = 200;
  const numX = lerp(110, DATE_FINAL.x, mv);
  const numY = lerp(heroY, DATE_FINAL.y, mv);
  const monX = lerp(116, DATE_FINAL.x + numW * kNum + space, mv);
  const monY = lerp(heroY + NUM.fontSize * 1.02, DATE_FINAL.y, mv);
  const logoP = prog(f, 714, 734, EASE.overshoot);
  const logoReveal = prog(f, 716, 738, EASE.out);
  const title: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 64, fontWeight: 700, letterSpacing: -0.015};

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', transform: `translateY(${panelY}px)`}}>
      <div style={{position: 'absolute', inset: 0, background: C3.deep}}>
        <Photo k="arena" geo={geo as ReturnType<typeof cover>} parallax={lerp(0, 36, prog(f, 630, 825))} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(1,38,63,0.25) 0%, rgba(1,38,63,0) 30%, rgba(1,38,63,0) 70%, rgba(1,38,63,0.35) 100%)'}} />
      </div>

      {f >= W.arenaToamasina - 2 ? <PinDrop f={f} start={W.arenaToamasina - 2} x={pin[0]} y={pin[1]} label="ARENA TOAMASINA" size={70} /> : null}
      {f >= W.devenezExposant - 2 ? (
        <div style={{position: 'absolute', left: COL + 70, top: 100}}>
          <Tag text="DEVENEZ EXPOSANT" f={f} start={W.devenezExposant - 2} size={34} bg={C3.flame} color={C3.white} />
        </div>
      ) : null}

      {/* colonne marine */}
      <div style={{position: 'absolute', left: 0, top: 0, width: COL, height: 1080, background: C3.navy, transform: `translateX(${lerp(-COL, 0, colIn)}px)`, boxShadow: '20px 0 60px rgba(1,38,63,0.35)'}}>
        <div style={{position: 'absolute', right: 0, top: 0, width: 8, height: 1080, background: `linear-gradient(180deg, ${C3.cyan}, ${C3.amber}, ${C3.flame})`}} />
        {/* dates */}
        <div style={{position: 'absolute', left: numX, top: numY, transform: `scale(${lerp(1, kNum, mv)})`, transformOrigin: '0 0', display: 'flex', ...fontStyle(NUM), color: C3.white}}>
          {[...numStr].map((c, i) => {
            const st = i === 0 ? W.du3au5 + 1 : i === 4 ? W.du3au5 + 15 : W.du3au5 + 8;
            const p = prog(f, st, st + 11, EASE.overshoot);
            return (
              <span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0.12em 0 0.08em', margin: '-0.12em 0 -0.08em'}}>
                <span style={{display: 'inline-block', transform: `translateY(${lerp(150, 0, p)}%)`, color: i === 2 ? C3.amber : C3.white}}>{c === ' ' ? ' ' : c}</span>
              </span>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: monX, top: monY, transform: `scale(${lerp(1, kMon, mv)})`, transformOrigin: '0 0'}}>
          <CharRise text="DÉCEMBRE 2026" spec={MONTH} f={f} start={W.decembre2026 - 6} stagger={0.8} dur={11} color={C3.amber} />
        </div>

        {/* carte logo */}
        {f >= 712 ? (
          <div
            style={{
              position: 'absolute',
              left: LOGO_CARD.x,
              top: LOGO_CARD.y,
              width: LOGO_CARD.w,
              height: LOGO_CARD.h,
              borderRadius: 26,
              background: C3.white,
              transform: `scale(${logoP})`,
              opacity: clamp01(logoP * 3),
              boxShadow: '0 20px 40px rgba(1,38,63,0.35)',
            }}
          >
            <div style={{position: 'absolute', left: (LOGO_CARD.w - LOGO_W) / 2, top: (LOGO_CARD.h - LOGO_W * LOGO_RATIO) / 2, clipPath: `circle(${(logoReveal * 75).toFixed(2)}% at 35% 55%)`}}>
              <GsnLogo width={LOGO_W} />
            </div>
          </div>
        ) : null}

        <div style={{position: 'absolute', left: 110, top: 552}}>
          <CharRise text="GRAND SALON DU" spec={title} f={f} start={W.grandSalon - 4} stagger={0.8} dur={12} />
        </div>
        <div style={{position: 'absolute', left: 110, top: 552 + 72, display: 'flex', gap: '0.25em', ...fontStyle(title)}}>
          <CharRise text="NUMÉRIQUE" spec={title} f={f} start={W.grandSalon + 6} stagger={0.8} dur={12} />
          <CharRise text="2.0" spec={title} f={f} start={W.deuxPointZero - 3} stagger={1.5} dur={12} color={C3.cyan} />
        </div>
        <div style={{position: 'absolute', left: 110, top: 836, display: 'flex', alignItems: 'center', gap: 14, opacity: prog(f, W.arenaToamasina, W.arenaToamasina + 8), transform: `translateX(${lerp(-30, 0, prog(f, W.arenaToamasina, W.arenaToamasina + 12, EASE.out))}px)`}}>
          <PinIcon size={46} color={C3.cyan} dot={C3.navy} />
          <div style={{...fontStyle({fontFamily: 'Space Grotesk', fontSize: 44, fontWeight: 700, letterSpacing: 0}), color: C3.cyan}}>ARENA TOAMASINA</div>
        </div>
      </div>

      <ArcIris f={f} start={802} dur={16} x={LOGO_CARD.x + LOGO_CARD.w / 2} y={LOGO_CARD.y + LOGO_CARD.h / 2} color={C3.white} />
    </div>
  );
};

// ------------------------------------------------------------------ SCÈNE 06
/**
 * V3 · SCÈNE 06 — 33 → 40 s — CTA sur blanc : « RÉSERVEZ VOTRE STAND » domine,
 * coordonnées dès 35 s jusqu'à la fin, photo de l'Arena et logo officiel à droite.
 */
const PHONE = '+261 34 40 302 89';
const EMAIL = 'gsn@elitecommunication.mg';
const RIGHT = {x: 1330, w: 480};

export const V3_Scene06: React.FC<{f: number}> = ({f}) => {
  if (f < 818) return null;
  const headBase: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 168, fontWeight: 700, letterSpacing: -0.03};
  const head = {...headBase, fontSize: Math.min(168, (168 * 1100) / textWidth('VOTRE STAND', headBase))};
  const l1 = 214;
  const l2 = l1 + head.fontSize * 0.98;
  const wVotre = textWidth('VOTRE ', head);
  const wStand = textWidth('STAND', head);
  const sw = prog(f, W.reservezVotreStand - 2, W.reservezVotreStand + 14, EASE.out);
  const pulse = 1 + 0.02 * Math.sin(Math.PI * prog(f, W.reservezVotreStand, W.reservezVotreStand + 12));
  const photoIn = prog(f, 856, 874, EASE.out);
  const logoIn = prog(f, 866, 882, EASE.overshoot);
  const geo = cover('arena', RIGHT.w, 380, lerp(1.25, 1.12, prog(f, 856, 1000, EASE.out)), PHOTOS.arena.poi[0], 0.62);
  const row = (start: number) => prog(f, start, start + 14, EASE.out);
  const end = prog(f, 962, 990, EASE.inOut);

  return (
    <div style={{position: 'absolute', inset: 0, background: C3.white}}>
      {/* PRENEZ VOTRE PLACE */}
      <div style={{position: 'absolute', left: 120, top: 150, display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{width: 64 * prog(f, W.prenezVotrePlace - 2, W.prenezVotrePlace + 10, EASE.out), height: 4, background: C3.flame}} />
        <div style={{fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, letterSpacing: `${lerp(0.5, 0.3, prog(f, W.prenezVotrePlace, W.prenezVotrePlace + 14, EASE.out))}em`, color: C3.cyan, opacity: prog(f, W.prenezVotrePlace, W.prenezVotrePlace + 8), whiteSpace: 'nowrap'}}>
          PRENEZ VOTRE PLACE
        </div>
      </div>

      {/* titre */}
      <div style={{position: 'absolute', left: 116, top: 0, transform: `scale(${pulse})`, transformOrigin: '0 40%'}}>
        <div style={{position: 'absolute', left: 0, top: l1}}>
          <CharRise text="RÉSERVEZ" spec={head} f={f} start={826} stagger={1.2} dur={14} color={C3.navy} from={160} />
        </div>
        <div style={{position: 'absolute', left: 0, top: l2}}>
          <CharRise text="VOTRE STAND" spec={head} f={f} start={834} stagger={1} dur={14} color={C3.navy} from={160} />
        </div>
        <svg width={1300} height={70} style={{position: 'absolute', left: 0, top: l2 + head.fontSize * 0.9}}>
          <defs>
            <linearGradient id="v3sw" x1="0" x2="1">
              <stop offset="0" stopColor={C3.flame} />
              <stop offset="1" stopColor={C3.amber} />
            </linearGradient>
          </defs>
          <path d={`M ${wVotre} 34 Q ${wVotre + wStand * 0.5} 52 ${wVotre + wStand + 8} 16`} stroke="url(#v3sw)" strokeWidth={12} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - sw} />
        </svg>
      </div>

      {/* coordonnées */}
      {[
        {start: 872, bg: C3.cyan, icon: <PhoneIcon size={38} />, text: PHONE, spec: {fontFamily: 'Space Grotesk' as const, fontSize: 68, fontWeight: 700, letterSpacing: 0}, top: 650},
        {start: 880, bg: C3.flame, icon: <MailIcon size={38} />, text: EMAIL, spec: {fontFamily: 'Space Grotesk' as const, fontSize: 52, fontWeight: 600, letterSpacing: -0.005}, top: 768},
      ].map((r) => {
        const p = row(r.start);
        return (
          <div key={r.text} style={{position: 'absolute', left: 120, top: r.top, display: 'flex', alignItems: 'center', gap: 24, opacity: clamp01(p * 2), transform: `translateX(${lerp(-60, 0, p)}px)`}}>
            <div style={{width: 80, height: 80, borderRadius: 40, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${prog(f, r.start, r.start + 10, EASE.overshoot)})`}}>{r.icon}</div>
            <div style={{...fontStyle(r.spec), color: C3.navy}}>{r.text}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 122, top: 930, fontFamily: FONTS.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.12em', color: 'rgba(2,66,110,0.75)', opacity: prog(f, 890, 904), whiteSpace: 'nowrap'}}>
        GRAND SALON DU NUMÉRIQUE 2.0 · 3 – 5 DÉCEMBRE 2026 · ARENA TOAMASINA
      </div>

      {/* photo + logo */}
      <div style={{position: 'absolute', left: RIGHT.x, top: 110, width: RIGHT.w, height: 380, borderRadius: 26, overflow: 'hidden', clipPath: `inset(${((1 - photoIn) * 100).toFixed(1)}% 0 0 0 round 26px)`, boxShadow: '0 24px 48px rgba(1,38,63,0.25)'}}>
        <Photo k="arena" geo={geo} parallax={14 * prog(f, 856, 1000)} />
        <div style={{position: 'absolute', left: 18, bottom: 18, display: 'flex', alignItems: 'center', gap: 8, background: C3.white, borderRadius: 30, padding: '8px 16px 8px 10px', fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: C3.navy, opacity: prog(f, 878, 888)}}>
          <PinIcon size={28} color={C3.flame} dot={C3.white} />
          ARENA TOAMASINA
        </div>
      </div>
      <div style={{position: 'absolute', left: RIGHT.x, top: 540, transform: `scale(${logoIn * lerp(1, 1.03, Math.sin(Math.PI * end))})`, transformOrigin: '50% 50%', opacity: clamp01(logoIn * 3)}}>
        <GsnLogo width={RIGHT.w} />
      </div>
    </div>
  );
};
