import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {W} from '../config/timeline';
import {CharRise, FontSpec, fontStyle, textWidth} from '../components/Typography';
import {GsnLogo, Hex, LOGO_RATIO, Layer} from '../components/Primitives';
import {EASE, hash, keys, lerp, prog} from '../lib/motion';
import {CARD, CARD_LOGO_W} from './Scene05_EventReveal';

/**
 * SCÈNE 06 — 33 → 40 s — CONVERTIR
 * La carte blanche du logo s'étend à tout le cadre : fond épuré.
 * « RÉSERVEZ VOTRE STAND » = priorité visuelle absolue, coordonnées
 * affichées dès 35,2 s et maintenues jusqu'à la dernière frame.
 */
const PHONE = '+261 34 40 302 89';
const EMAIL = 'gsn@elitecommunication.mg';
const LOGO_FINAL = {x: 1296, y: 600, w: 490};
const HEAD_BASE: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 178, fontWeight: 700, letterSpacing: -0.03};
const PLACE = {x: 1590, y: 300, r: 86};

const PhoneIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"
      fill={COLORS.white}
    />
  </svg>
);

const MailIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="3" y="5.5" width="18" height="13" rx="2" fill="none" stroke={COLORS.white} strokeWidth="2" />
    <path d="M3.8 7l8.2 6 8.2-6" fill="none" stroke={COLORS.white} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const ContactRow: React.FC<{f: number; start: number; icon: React.ReactNode; bg: string; text: string; spec: FontSpec; top: number}> = ({f, start, icon, bg, text, spec, top}) => {
  const pIcon = prog(f, start, start + 12, EASE.overshoot);
  const pText = prog(f, start + 3, start + 18, EASE.out);
  const d = 70;
  return (
    <div style={{position: 'absolute', left: 124, top, display: 'flex', alignItems: 'center', gap: 26}}>
      <div style={{width: d, height: d, borderRadius: d / 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pIcon})`}}>{icon}</div>
      <div style={{overflow: 'hidden', paddingBottom: '0.08em'}}>
        <div style={{...fontStyle(spec), color: COLORS.navy, transform: `translateY(${lerp(140, 0, pText)}%)`}}>{text}</div>
      </div>
    </div>
  );
};

export const Scene06_CTA: React.FC<{f: number}> = ({f}) => {
  // ---------- la carte devient le fond
  const exp = prog(f, 806, 834, EASE.inOut);
  const rx = lerp(CARD.x, 0, exp);
  const ry = lerp(CARD.y, 0, exp);
  const rw = lerp(CARD.w, 1920, exp);
  const rh = lerp(CARD.h, 1080, exp);
  const radius = lerp(26, 0, exp);
  const lf = prog(f, 812, 846, EASE.inOut);
  const cardLogoX = CARD.x + CARD.w / 2 - CARD_LOGO_W / 2;
  const cardLogoY = CARD.y + CARD.h / 2 - (CARD_LOGO_W * LOGO_RATIO) / 2;
  const logoX = lerp(cardLogoX, LOGO_FINAL.x, lf);
  const logoY = lerp(cardLogoY, LOGO_FINAL.y, lf) - 30 * Math.sin(Math.PI * lf);
  const logoW = lerp(CARD_LOGO_W, LOGO_FINAL.w, lf);

  // ---------- titre
  const wStand = textWidth('VOTRE STAND', HEAD_BASE);
  const head = {...HEAD_BASE, fontSize: Math.min(HEAD_BASE.fontSize, (HEAD_BASE.fontSize * 1290) / wStand)};
  const line1Top = 196;
  const line2Top = line1Top + head.fontSize * 0.98;
  const wVotre = textWidth('VOTRE ', head);
  const wStandOnly = textWidth('STAND', head);
  const swoosh = prog(f, W.reservezVotreStand - 2, W.reservezVotreStand + 16, EASE.out);
  const pulse = 1 + 0.018 * Math.sin(Math.PI * prog(f, W.reservezVotreStand, W.reservezVotreStand + 14));
  const sheen = prog(f, 958, 990, EASE.inOut);

  // ---------- « Ne regardez pas les opportunités passer » → « Prenez votre place »
  const passing = Array.from({length: 8}).map((_, i) => {
    const speed = 9 + hash(i + 40) * 10;
    const x0 = 2000 + hash(i + 11) * 900;
    return {
      x: x0 - (f - 836) * speed,
      y: 110 + hash(i + 21) * 420,
      r: 26 + hash(i + 31) * 44,
      o: 0.18 + 0.2 * hash(i + 51),
    };
  });
  const lock = prog(f, W.prenezVotrePlace - 14, W.prenezVotrePlace + 1, EASE.out);
  const placeX = lerp(2050, PLACE.x, lock);
  const fill = prog(f, W.prenezVotrePlace, W.prenezVotrePlace + 8, EASE.out);
  const lockPulse = 1 + 0.12 * Math.sin(Math.PI * prog(f, W.prenezVotrePlace, W.prenezVotrePlace + 8));
  const passingFade = 1 - prog(f, W.prenezVotrePlace - 4, W.prenezVotrePlace + 10);

  if (f < 806) return null;

  return (
    <Layer>
      {/* fond blanc issu de la carte */}
      <Layer style={{clipPath: `inset(${ry}px ${1920 - rx - rw}px ${1080 - ry - rh}px ${rx}px round ${radius}px)`}}>
        <Layer style={{background: COLORS.white}} />
        <Layer style={{background: `radial-gradient(circle at 88% 18%, rgba(15,158,218,${0.1 * exp}), transparent 40%), radial-gradient(circle at 10% 100%, rgba(249,174,47,${0.08 * exp}), transparent 40%)`}} />

        {/* opportunités qui passent */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="s6amber" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={COLORS.amber} />
              <stop offset="1" stopColor={COLORS.flame} />
            </linearGradient>
          </defs>
          {f >= 836
            ? passing.map((p, i) =>
                p.x > 980 && p.x < 2100 ? (
                  <Hex key={i} cx={p.x} cy={p.y} r={p.r} stroke={COLORS.brandCyan} strokeWidth={2.5} opacity={p.o * passingFade * prog(p.x, 980, 1200)} />
                ) : null,
              )
            : null}
          {f >= W.prenezVotrePlace - 14 ? (
            <g transform={`translate(${placeX} ${PLACE.y}) scale(${lockPulse}) rotate(${0.2 * (f - 900)})`}>
              <Hex cx={0} cy={0} r={PLACE.r} fill="url(#s6amber)" opacity={fill} />
              <Hex cx={0} cy={0} r={PLACE.r} stroke={COLORS.flame} strokeWidth={3} opacity={1 - fill * 0.6} />
              <Hex cx={0} cy={0} r={PLACE.r + 22 * fill} stroke={COLORS.amber} strokeWidth={2} opacity={(1 - prog(f, W.prenezVotrePlace, W.prenezVotrePlace + 16)) * fill} />
            </g>
          ) : null}
        </svg>

        {/* PRENEZ VOTRE PLACE */}
        <div style={{position: 'absolute', left: 124, top: 140, display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 64 * prog(f, W.prenezVotrePlace - 2, W.prenezVotrePlace + 10, EASE.out), height: 3, background: COLORS.flame}} />
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: `${lerp(0.55, 0.3, prog(f, W.prenezVotrePlace, W.prenezVotrePlace + 16, EASE.out))}em`,
              color: COLORS.brandCyan,
              opacity: prog(f, W.prenezVotrePlace, W.prenezVotrePlace + 8),
              whiteSpace: 'nowrap',
            }}
          >
            PRENEZ VOTRE PLACE
          </div>
        </div>

        {/* RÉSERVEZ VOTRE STAND */}
        <div style={{position: 'absolute', left: 124, top: 0, transform: `scale(${pulse})`, transformOrigin: '0 50%'}}>
          <div style={{position: 'absolute', left: 0, top: line1Top}}>
            <CharRise text="RÉSERVEZ" spec={head} f={f} start={838} stagger={1.3} dur={15} color={COLORS.navy} rotate={8} from={165} />
          </div>
          <div style={{position: 'absolute', left: 0, top: line2Top, display: 'flex'}}>
            <CharRise text="VOTRE STAND" spec={head} f={f} start={847} stagger={1.1} dur={15} color={COLORS.navy} rotate={8} from={165} />
          </div>
          {/* reflet signature */}
          {sheen > 0 && sheen < 1 ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: line1Top,
                ...fontStyle(head),
                lineHeight: 0.98,
                whiteSpace: 'pre',
                background: `linear-gradient(105deg, transparent ${lerp(-30, 110, sheen) - 12}%, rgba(255,255,255,0.75) ${lerp(-30, 110, sheen)}%, transparent ${lerp(-30, 110, sheen) + 12}%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {'RÉSERVEZ\nVOTRE STAND'}
            </div>
          ) : null}
          <svg width={1700} height={60} style={{position: 'absolute', left: 0, top: line2Top + head.fontSize * 0.93}}>
            <defs>
              <linearGradient id="s6sw" x1="0" x2="1">
                <stop offset="0" stopColor={COLORS.amber} />
                <stop offset="1" stopColor={COLORS.flame} />
              </linearGradient>
            </defs>
            <path
              d={`M ${wVotre + 6} 30 Q ${wVotre + wStandOnly * 0.5} ${44} ${wVotre + wStandOnly + 10} 14`}
              stroke="url(#s6sw)"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - swoosh}
            />
          </svg>
        </div>

        {/* coordonnées : visibles de 35,2 s jusqu'à la fin */}
        <ContactRow f={f} start={872} bg={COLORS.brandCyan} icon={<PhoneIcon size={36} />} text={PHONE} top={650} spec={{fontFamily: 'Space Grotesk', fontSize: 70, fontWeight: 700, letterSpacing: 0}} />
        <ContactRow f={f} start={880} bg={COLORS.flame} icon={<MailIcon size={36} />} text={EMAIL} top={756} spec={{fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 500, letterSpacing: -0.005}} />
        <div
          style={{
            position: 'absolute',
            left: 126,
            top: 930,
            fontFamily: FONTS.body,
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: '0.1em',
            color: 'rgba(2,66,110,0.75)',
            opacity: prog(f, 892, 906),
            whiteSpace: 'nowrap',
          }}
        >
          GRAND SALON DU NUMÉRIQUE 2.0 · 3 – 5 DÉCEMBRE 2026 · ARENA TOAMASINA
        </div>

        {/* badge d'édition, séparé du logo */}
        <div
          style={{
            position: 'absolute',
            right: 1920 - (LOGO_FINAL.x + LOGO_FINAL.w),
            top: LOGO_FINAL.y - 56,
            whiteSpace: 'nowrap',
            padding: '9px 20px',
            borderRadius: 30,
            background: COLORS.navy,
            color: COLORS.white,
            fontFamily: FONTS.body,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: '0.2em',
            opacity: prog(f, 850, 864),
            transform: `translateY(${keys(f, [850, 864], [14, 0], EASE.out)}px)`,
          }}
        >
          ÉDITION 2.0
        </div>
      </Layer>

      {/* logo officiel : translation + échelle uniforme uniquement */}
      <div style={{position: 'absolute', left: logoX, top: logoY}}>
        <GsnLogo width={logoW} />
      </div>
    </Layer>
  );
};
