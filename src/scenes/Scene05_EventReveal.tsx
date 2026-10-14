import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {W} from '../config/timeline';
import {CharRise, FontSpec, Tag, WipeText, fontStyle, textWidth} from '../components/Typography';
import {GsnLogo, Hex, LOGO_RATIO, Layer, SegmentedArc} from '../components/Primitives';
import {EASE, hash, hexPoints, keys, lerp, morphPts, polygonClip, prog, rect6} from '../lib/motion';

/**
 * SCÈNE 05 — 25 → 33 s — RÉVÉLER LE GSN 2.0
 * Le portail du « O » s'ouvre sur la nuit ; l'arc segmenté (motif du logo)
 * fond sur le cadre ; les dates roulent sur la diction ; un hexagone ambre
 * devient la carte blanche qui accueille le logo officiel (intact).
 */
export const CARD = {x: 150, y: 250, w: 620, h: 470};
export const CARD_LOGO_W = 520;
const RX = 880; // colonne d'informations
const DATE_FINAL = {x: RX, y: 572, size: 58};
const HERO = {size: 300, cy: 452};
const DATE_TRACK = 0.02;

const NUM: FontSpec = {fontFamily: 'Space Grotesk', fontSize: HERO.size, fontWeight: 700, letterSpacing: -0.02};
const MONTH_HERO = 80;
const MONTH: FontSpec = {fontFamily: 'Space Grotesk', fontSize: MONTH_HERO, fontWeight: 700, letterSpacing: DATE_TRACK};

export const Scene05_EventReveal: React.FC<{f: number}> = ({f}) => {
  // ---------- profondeur : halos & hexagones flottants
  const t = f - 620;
  const floaters = Array.from({length: 9}).map((_, i) => {
    const d = 0.25 + hash(i + 3) * 0.9;
    return {
      x: 100 + hash(i * 7 + 1) * 1720 - t * 0.5 * d,
      y: 120 + hash(i * 13 + 2) * 840 + Math.sin(t * 0.02 + i) * 10 * d,
      r: 30 + 70 * d,
      rot: t * 0.15 * (i % 2 ? 1 : -1),
      o: 0.08 + 0.18 * d,
      blur: (1.2 - d) * 4,
      amber: i % 4 === 0,
    };
  });

  // ---------- arc segmenté
  const arcIn = prog(f, 618, 648, EASE.out);
  const toCard = prog(f, 700, 738, EASE.inOut);
  const arcOut = prog(f, 806, 828, EASE.in);
  const cardC: [number, number] = [CARD.x + CARD.w / 2, CARD.y + CARD.h / 2];
  const arcC: [number, number] = [lerp(960, cardC[0], toCard), lerp(470, cardC[1], toCard)];
  const arcR = lerp(lerp(1500, 450, arcIn), 405, toCard) * lerp(1, 4, arcOut);
  const arcRot = lerp(-140, 0, arcIn) + 0.22 * (f - 648);
  const arcTh = lerp(30, 20, toCard);

  // ---------- dates : héros puis rangement dans la colonne
  const numStr = '3 – 5';
  const numW = textWidth(numStr, NUM);
  const monthStr = 'DÉCEMBRE 2026';
  const monthW = textWidth(monthStr, MONTH);
  const heroNumX = 960 - numW / 2;
  const heroNumY = HERO.cy - HERO.size * 0.5 - 40;
  const heroMonthX = 960 - monthW / 2;
  const heroMonthY = heroNumY + HERO.size * 0.98;
  const kNum = DATE_FINAL.size / HERO.size;
  const kMonth = DATE_FINAL.size / MONTH_HERO;
  const finalNumW = numW * kNum;
  const space = textWidth(' ', {...MONTH, fontSize: DATE_FINAL.size});
  const move = prog(f, 700, 734, EASE.inOut);
  const numX = lerp(heroNumX, DATE_FINAL.x, move);
  const numY = lerp(heroNumY, DATE_FINAL.y, move);
  const numK = lerp(1, kNum, move);
  const monX = lerp(heroMonthX, DATE_FINAL.x + finalNumW + space, move);
  const monY = lerp(heroMonthY, DATE_FINAL.y, move);
  const monK = lerp(1, kMonth, move);
  const roll = (start: number) => prog(f, start, start + 12, EASE.overshoot);

  // ---------- carte blanche du logo : hexagone ambre → carte
  const cardGrow = prog(f, 702, 716, EASE.out);
  const cardMorph = prog(f, 712, 730, EASE.inOut);
  const hex = hexPoints(cardC[0], cardC[1], lerp(0, 330, cardGrow), 30 * (1 - cardGrow));
  const rect = rect6(CARD.x, CARD.y, CARD.w, CARD.h);
  const cardClip = f < 730 ? polygonClip(morphPts(hex, rect, cardMorph)) : `inset(${CARD.y}px ${1920 - CARD.x - CARD.w}px ${1080 - CARD.y - CARD.h}px ${CARD.x}px round ${keys(f, [730, 738], [0, 26])}px)`;
  const cardColorMix = prog(f, 710, 726);
  const logoReveal = prog(f, 718, 744, EASE.out);
  const logoW = CARD_LOGO_W * lerp(0.94, 1, prog(f, 718, 750, EASE.out));

  // ---------- colonne d'informations
  const head: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 92, fontWeight: 700, letterSpacing: -0.02};
  const headFit = {...head, fontSize: Math.min(92, (92 * 900) / textWidth('DU NUMÉRIQUE 2.0', head))};
  const colOut = prog(f, 802, 818, EASE.in);
  const twoPop = prog(f, W.deuxPointZero - 2, W.deuxPointZero + 12, EASE.overshoot);
  const glow = 0.5 + 0.5 * Math.sin(f * 0.08);

  return (
    <Layer>
      <Layer style={{background: `radial-gradient(ellipse 80% 80% at 50% 45%, #0A3260 0%, ${COLORS.night} 55%, ${COLORS.nightDeep} 100%)`}} />
      <Layer style={{background: `radial-gradient(circle at ${20 + 3 * Math.sin(t * 0.01)}% 25%, rgba(15,158,218,0.22), transparent 38%), radial-gradient(circle at 85% 85%, rgba(249,174,47,${0.08 + 0.04 * glow}), transparent 35%)`}} />

      {/* hexagones flottants (parallaxe) */}
      {floaters.map((h, i) => (
        <svg key={i} width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: h.blur > 0.6 ? `blur(${h.blur.toFixed(1)}px)` : undefined}}>
          <Hex cx={h.x} cy={h.y} r={h.r} rot={h.rot} stroke={h.amber ? COLORS.amber : COLORS.cyan} strokeWidth={2} opacity={h.o * prog(f, 626, 660)} />
        </svg>
      ))}

      {/* arc segmenté + anneau fin */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: 1 - arcOut}}>
        <circle cx={arcC[0]} cy={arcC[1]} r={arcR + 46} fill="none" stroke={COLORS.cyan} strokeOpacity={0.18} strokeWidth={1.5} />
        <SegmentedArc
          cx={arcC[0]}
          cy={arcC[1]}
          r={arcR}
          thickness={arcTh}
          start={70 + arcRot}
          end={300 + arcRot}
          segments={13}
          colors={[COLORS.brandCyan, '#0B5D96']}
          gap={1.6}
        />
        <path
          d={`M ${arcC[0] + arcR * Math.cos(((62 + arcRot) * Math.PI) / 180)} ${arcC[1] + arcR * Math.sin(((62 + arcRot) * Math.PI) / 180)} A ${arcR} ${arcR} 0 0 0 ${arcC[0] + arcR * Math.cos(((20 + arcRot) * Math.PI) / 180)} ${arcC[1] + arcR * Math.sin(((20 + arcRot) * Math.PI) / 180)}`}
          stroke={COLORS.flame}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          opacity={prog(f, 640, 660)}
        />
      </svg>

      {/* dates */}
      {f >= 634 ? (
        <div style={{opacity: 1 - colOut, filter: colOut > 0 ? `blur(${8 * colOut}px)` : undefined, transform: `translateX(${200 * colOut}px)`}}>
          <div style={{position: 'absolute', left: numX, top: numY, transform: `scale(${numK})`, transformOrigin: '0 0', display: 'flex', ...fontStyle(NUM)}}>
            {[...numStr].map((c, i) => {
              const start = i === 0 ? W.du3au5 + 2 : i === 4 ? W.du3au5 + 16 : W.du3au5 + 9;
              const p = roll(start);
              return (
                <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingTop: '0.1em', marginTop: '-0.1em', paddingBottom: '0.06em', marginBottom: '-0.06em'}}>
                  <span style={{display: 'inline-block', transform: `translateY(${lerp(140, 0, p)}%)`, color: i === 2 ? COLORS.amber : COLORS.white}}>{c === ' ' ? ' ' : c}</span>
                </span>
              );
            })}
          </div>
          <div style={{position: 'absolute', left: monX, top: monY, transform: `scale(${monK})`, transformOrigin: '0 0'}}>
            <CharRise text={monthStr} spec={MONTH} f={f} start={W.decembre2026 - 6} stagger={0.9} dur={12} color={COLORS.white} />
          </div>
        </div>
      ) : null}

      {/* carte blanche + logo officiel (jamais déformé : seule l'échelle uniforme varie) */}
      {f >= 702 && f < 812 ? (
        <Layer style={{clipPath: cardClip}}>
          <Layer style={{background: COLORS.white}} />
          <Layer style={{background: `linear-gradient(135deg, ${COLORS.amber}, ${COLORS.flame})`, opacity: 1 - cardColorMix}} />
          <div
            style={{
              position: 'absolute',
              left: cardC[0] - logoW / 2,
              top: cardC[1] - (logoW * LOGO_RATIO) / 2,
              clipPath: `circle(${(logoReveal * 75).toFixed(2)}% at 35% 55%)`,
            }}
          >
            <GsnLogo width={logoW} />
          </div>
        </Layer>
      ) : null}

      {/* colonne d'informations */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - colOut, filter: colOut > 0 ? `blur(${8 * colOut}px)` : undefined, transform: `translateX(${200 * colOut}px)`}}>
        {f >= W.devenezExposant - 2 ? (
          <div style={{position: 'absolute', left: RX, top: 236}}>
            <Tag text="DEVENEZ EXPOSANT" f={f} start={W.devenezExposant - 2} size={26} bg={COLORS.cyan} color={COLORS.night} />
          </div>
        ) : null}
        <div style={{position: 'absolute', left: RX, top: 314}}>
          <CharRise text="GRAND SALON" spec={headFit} f={f} start={W.grandSalon - 4} stagger={1} dur={13} />
        </div>
        <div style={{position: 'absolute', left: RX, top: 314 + headFit.fontSize * 1.04, display: 'flex', gap: '0.24em', ...fontStyle(headFit)}}>
          <CharRise text="DU NUMÉRIQUE" spec={headFit} f={f} start={W.grandSalon + 6} stagger={1} dur={13} />
          <div
            style={{
              ...fontStyle(headFit),
              transform: `scale(${twoPop})`,
              transformOrigin: '0% 80%',
              opacity: Math.min(1, twoPop * 2),
              background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.brandCyan})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: `drop-shadow(0 0 ${18 * glow}px rgba(5,200,247,0.45))`,
            }}
          >
            2.0
          </div>
        </div>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="s5sw" x1="0" x2="1">
              <stop offset="0" stopColor={COLORS.amber} />
              <stop offset="1" stopColor={COLORS.flame} />
            </linearGradient>
          </defs>
          <rect x={RX} y={542} width={420 * prog(f, 734, 756, EASE.out)} height={4} rx={2} fill="url(#s5sw)" />
        </svg>
        <div style={{position: 'absolute', left: RX, top: 662}}>
          <WipeText f={f} start={W.arenaToamasina - 2} dur={16} edgeColor={COLORS.cyan}>
            <div style={{...fontStyle({fontFamily: 'Space Grotesk', fontSize: 58, fontWeight: 700, letterSpacing: 0.01}), color: COLORS.cyan}}>ARENA TOAMASINA</div>
          </WipeText>
        </div>
        <div
          style={{
            position: 'absolute',
            left: RX + 2,
            top: 742,
            fontFamily: FONTS.body,
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: '0.34em',
            color: COLORS.mist,
            opacity: prog(f, W.arenaToamasina + 8, W.arenaToamasina + 20),
          }}
        >
          MADAGASCAR
        </div>
      </div>
    </Layer>
  );
};
