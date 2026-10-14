import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {W} from '../config/timeline';
import {CharRise, FontSpec, WordSync, fontStyle, textWidth} from '../components/Typography';
import {DirBlur, Layer} from '../components/Primitives';
import {TanaSkyline} from '../components/illustrations/TanaSkyline';
import {MediaSlot} from '../components/MediaSlot';
import {EASE, keys, lerp, prog} from '../lib/motion';

/**
 * SCÈNE 01 — 0 → 6 s — CAPTER L'ATTENTION
 * Ligne de lumière qui accélère → la ligne devient masque et révèle Antananarivo
 * → « AU-DELÀ » franchit une frontière verticale → « D'ANTANANARIVO ? ».
 */
const Y = 540;
const AUD: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 300, fontWeight: 700, letterSpacing: -0.035};
const ANT: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 118, fontWeight: 700, letterSpacing: -0.01};
const EYEBROW: FontSpec = {fontFamily: 'Inter', fontSize: 38, fontWeight: 500};
const FX = 112; // abscisse de la « frontière »
const TEXT_X = 124;

/** Demi-hauteur de la fenêtre (masque) ouverte par la ligne. */
export const s1BandHalf = (f: number) => {
  if (f < 19) return 0;
  if (f < 134) return lerp(1.5, 452, prog(f, 19, 60, EASE.out));
  return lerp(452, 0.8, prog(f, 134, 152, EASE.snap));
};

export const Scene01_Hook: React.FC<{f: number}> = ({f}) => {
  // --- ligne d'ouverture
  const head = keys(f, [2, 18], [210, 2000], EASE.in);
  const tail = keys(f, [5, 21], [210, -10], EASE.out);
  const lineOn = prog(f, 0, 4);
  const flash = Math.exp(-Math.max(0, f - 18) / 5) * (f >= 16 ? 1 : 0);
  const h = s1BandHalf(f);
  const bandOpen = f >= 19;

  // --- caméra (push-in) et parallaxe
  const push = prog(f, 19, 150, EASE.soft);
  const imgScale = 1.03 + 0.07 * push;
  const camX = 70 * push;

  // --- « AU-DELÀ » : franchissement de frontière
  const audW = textWidth('AU-DELÀ', AUD);
  const frontier = prog(f, 90, 99, EASE.out) * (1 - prog(f, 118, 130, EASE.in));
  const enter = prog(f, 97, 119, EASE.out);
  const exitX = keys(f, [131, 150], [0, 2100], EASE.in);
  const audX = lerp(-audW - 40, TEXT_X - FX, enter) + exitX;
  const audVel = Math.abs(lerp(-audW - 40, TEXT_X - FX, prog(f + 0.5, 97, 119, EASE.out)) - lerp(-audW - 40, TEXT_X - FX, prog(f - 0.5, 97, 119, EASE.out))) + Math.abs(keys(f + 0.5, [131, 150], [0, 2100], EASE.in) - keys(f - 0.5, [131, 150], [0, 2100], EASE.in));
  const tracking = lerp(-0.16, AUD.letterSpacing!, prog(f, 97, 124, EASE.out));

  const eyebrowWords = [
    {text: 'Et', at: W.etSi},
    {text: 'si', at: W.etSi + 5},
    {text: 'vos', at: W.vos},
    {text: 'prochaines', at: W.prochaines},
    {text: 'grandes', at: W.grandes},
    {text: 'opportunités', at: W.opportunites, color: COLORS.amber},
    {text: 'se', at: W.se},
    {text: 'trouvaient…', at: W.trouvaient},
  ];

  return (
    <Layer>
      {/* fond nuit */}
      <Layer style={{background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${COLORS.navyMid} 0%, ${COLORS.night} 55%, ${COLORS.nightDeep} 100%)`}} />

      {/* fenêtre ouverte par la ligne : Antananarivo */}
      {bandOpen ? (
        <Layer style={{clipPath: `inset(${(Y - h).toFixed(2)}px 0px ${(1080 - Y - h).toFixed(2)}px 0px)`}}>
          <Layer style={{transform: `scale(${imgScale})`, transformOrigin: '62% 55%'}}>
            <MediaSlot name="antananarivo" scale={1} fallback={<TanaSkyline frame={f} camX={camX} />} />
          </Layer>
          <Layer style={{background: 'linear-gradient(90deg, rgba(6,27,58,0.75) 0%, rgba(6,27,58,0.25) 55%, rgba(6,27,58,0) 100%)'}} />
        </Layer>
      ) : null}

      {/* arêtes lumineuses : la ligne scindée en deux */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s1line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.cyan} stopOpacity="0" />
            <stop offset="0.25" stopColor={COLORS.cyan} />
            <stop offset="0.6" stopColor={COLORS.white} />
            <stop offset="0.85" stopColor={COLORS.amber} />
            <stop offset="1" stopColor={COLORS.flame} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="s1head">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.3" stopColor={COLORS.cyan} stopOpacity="0.8" />
            <stop offset="1" stopColor={COLORS.cyan} stopOpacity="0" />
          </radialGradient>
        </defs>
        {!bandOpen ? (
          <g opacity={lineOn}>
            <rect x={tail} y={Y - 1.5} width={Math.max(0, head - tail)} height={3} fill="url(#s1line)" />
            <ellipse cx={Math.min(head, 1940)} cy={Y} rx={70} ry={10} fill="url(#s1head)" />
          </g>
        ) : (
          [-1, 1].map((k) => (
            <rect key={k} x={0} y={Y + k * h - 1} width={1920} height={2} fill="url(#s1line)" opacity={0.55 + 0.45 * flash} />
          ))
        )}
        {flash > 0.01 ? <rect x={0} y={Y - 40 * flash} width={1920} height={80 * flash} fill={COLORS.white} opacity={0.25 * flash} /> : null}
      </svg>

      {/* question en accroche, mot à mot sur la diction */}
      <div style={{position: 'absolute', left: TEXT_X + 4, top: 196}}>
        <WordSync words={eyebrowWords} spec={EYEBROW} f={f} color="rgba(246,250,255,0.9)" fadeOut={[128, 140]} />
      </div>

      {/* frontière verticale */}
      <div
        style={{
          position: 'absolute',
          left: FX - 2,
          top: 470,
          width: 4,
          height: 330,
          background: `linear-gradient(180deg, transparent, ${COLORS.cyan}, transparent)`,
          boxShadow: `0 0 24px ${COLORS.cyan}`,
          transform: `scaleY(${frontier})`,
          opacity: frontier,
        }}
      />

      {/* AU-DELÀ : émerge de derrière la frontière, s'élargit en la dépassant */}
      <div style={{position: 'absolute', left: FX, top: 455, width: 1920 - FX, height: 340, overflow: 'hidden'}}>
        <DirBlur id="s1-audela" x={Math.min(26, audVel * 0.2)} style={{position: 'absolute', left: audX, top: 18}}>
          <div style={{...fontStyle({...AUD, letterSpacing: tracking}), color: COLORS.white}}>
            AU-DEL<span style={{color: COLORS.white}}>À</span>
          </div>
        </DirBlur>
      </div>

      {/* D'ANTANANARIVO ? */}
      <div style={{position: 'absolute', left: TEXT_X + 6, top: 790}}>
        <CharRise
          text="D'ANTANANARIVO ?"
          spec={ANT}
          f={f}
          start={W.dAntananarivo - 2}
          stagger={1.1}
          dur={15}
          exit={{start: 132, stagger: 0.6, dur: 12, to: -115}}
          charStyle={(i) => (i === 15 ? {color: COLORS.amber} : {})}
        />
      </div>

      {/* filet de crédit discret */}
      <div
        style={{
          position: 'absolute',
          right: 124,
          top: 196,
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: '0.32em',
          color: COLORS.mist,
          opacity: prog(f, 40, 60) * (1 - prog(f, 126, 136)),
        }}
      >
        GSN 2.0 — MADAGASCAR
      </div>
    </Layer>
  );
};
