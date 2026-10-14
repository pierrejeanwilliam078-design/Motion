import React from 'react';
import {getLength} from '@remotion/paths';
import {COLORS, FONTS} from '../config/theme';
import {W} from '../config/timeline';
import {MADAGASCAR} from '../data/madagascar';
import {FontSpec, Tag, fontStyle, textWidth} from '../components/Typography';
import {Layer} from '../components/Primitives';
import {EASE, clamp01, keys, lerp, prog} from '../lib/motion';
import {M, ROUTE, T, bezier, mapTransform, toScreen} from './mapCamera';

/**
 * SCÈNE 02 — 6 → 12 s — FAIRE NAÎTRE L'OPPORTUNITÉ
 * La ligne de la scène 01 se courbe en trajectoire Antananarivo → Toamasina
 * sur une silhouette exacte de Madagascar (Natural Earth), recul caméra,
 * puis la ligne s'ouvre en lettres monumentales « NOUVELLES OPPORTUNITÉS ».
 */
const COAST_LEN = getLength(MADAGASCAR.path);
const BIG_MAX = 186;

const routeScreenPath = (f: number, morph: number) => {
  const line: [number, number][] = [
    [0, 540],
    [640, 540],
    [1280, 540],
    [1920, 540],
  ];
  const r = ROUTE.map((p) => toScreen(f, p));
  const p = line.map((l, i) => [lerp(l[0], r[i][0], morph), lerp(l[1], r[i][1], morph)]);
  return `M ${p[0][0]} ${p[0][1]} C ${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]} ${p[3][0]} ${p[3][1]}`;
};

export const Scene02_Opportunity: React.FC<{f: number}> = ({f}) => {
  const morph = prog(f, 150, 178, EASE.inOut);
  const routePath = routeScreenPath(f, morph);
  const routeLen = getLength(routePath);
  const comet = prog(f, 180, 213, EASE.inOut);
  const cometPos = bezier(ROUTE.map((p) => toScreen(f, p)) as [number, number][], comet);
  const coastDraw = prog(f, 160, 240, EASE.inOut);
  const fillIn = prog(f, 178, 222, EASE.soft);
  const mapFade = 1 - 0.72 * prog(f, 238, 258, EASE.inOut) - 0.28 * prog(f, 286, 304, EASE.in);
  const routeFade = 1 - prog(f, 240, 256);

  const tS = toScreen(f, T);
  const mS = toScreen(f, M);
  const tPop = prog(f, 168, 182, EASE.overshoot);
  const mPop = prog(f, 212, 226, EASE.overshoot);

  // --- NOUVELLES OPPORTUNITÉS
  const big: FontSpec = {fontFamily: 'Space Grotesk', fontSize: BIG_MAX, fontWeight: 700, letterSpacing: -0.025};
  const wOpp = textWidth('OPPORTUNITÉS', big);
  const fit = Math.min(1, 1640 / wOpp);
  const bigSpec = {...big, fontSize: BIG_MAX * fit};
  const yc = 470;
  const burst = prog(f, 238, 249, EASE.out);
  const h = f < 288 ? lerp(1, 236, prog(f, 247, 266, EASE.out)) : lerp(236, 0, prog(f, 288, 301, EASE.in));
  const burstY = lerp(mS[1], yc, prog(f, 236, 246, EASE.inOut));
  const burstL = lerp(mS[0], 90, burst);
  const burstR = lerp(mS[0], 1830, burst);
  const inner = prog(f, 247, 272, EASE.out);
  const textOut = prog(f, 286, 300, EASE.in);

  return (
    <Layer>
      {f < 284 ? <Layer style={{background: `radial-gradient(ellipse 70% 70% at 70% 50%, ${COLORS.navyMid} 0%, ${COLORS.night} 60%, ${COLORS.nightDeep} 100%)`}} /> : null}

      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s2route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.cyan} />
            <stop offset="1" stopColor={COLORS.amber} />
          </linearGradient>
          <linearGradient id="s2land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0E3B6B" />
            <stop offset="1" stopColor="#072448" />
          </linearGradient>
          <radialGradient id="s2comet">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor={COLORS.amber} stopOpacity="0.9" />
            <stop offset="1" stopColor={COLORS.amber} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* graticule + île */}
        <g opacity={mapFade}>
          <g transform={mapTransform(f)}>
            {Array.from({length: 24}).map((_, i) => (
              <line key={`v${i}`} x1={-600 + i * 60} y1={-400} x2={-600 + i * 60} y2={1400} stroke={COLORS.cyan} strokeOpacity={0.07 * fillIn} vectorEffect="non-scaling-stroke" />
            ))}
            {Array.from({length: 30}).map((_, i) => (
              <line key={`h${i}`} x1={-900} y1={-400 + i * 60} x2={1200} y2={-400 + i * 60} stroke={COLORS.cyan} strokeOpacity={0.07 * fillIn} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={MADAGASCAR.path} fill="url(#s2land)" opacity={fillIn} />
            <path
              d={MADAGASCAR.path}
              fill="none"
              stroke={COLORS.cyan}
              strokeOpacity={0.85}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={COAST_LEN}
              strokeDashoffset={COAST_LEN * (1 - coastDraw)}
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* la ligne devient trajectoire */}
        <g opacity={routeFade}>
          <path d={routePath} stroke={morph < 1 ? COLORS.white : 'url(#s2route)'} strokeOpacity={morph < 1 ? 0.9 : 0.35} strokeWidth={lerp(2.5, 3.5, morph)} fill="none" strokeLinecap="round" />
          {f >= 180 ? (
            <path
              d={routePath}
              stroke="url(#s2route)"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${routeLen * comet} ${routeLen}`}
              style={{filter: `drop-shadow(0 0 10px ${COLORS.amber})`}}
            />
          ) : null}
          {f >= 180 && comet < 1 ? <ellipse cx={cometPos[0]} cy={cometPos[1]} rx={34} ry={34} fill="url(#s2comet)" /> : null}
        </g>

        {/* villes */}
        <g opacity={mapFade * routeFade}>
          {tPop > 0 ? (
            <g>
              <circle cx={tS[0]} cy={tS[1]} r={8 * tPop} fill={COLORS.white} />
              <circle cx={tS[0]} cy={tS[1]} r={8 + 36 * prog(f, 168, 196, EASE.out)} fill="none" stroke={COLORS.white} strokeOpacity={1 - prog(f, 168, 196)} strokeWidth={2} />
            </g>
          ) : null}
          {mPop > 0 ? (
            <g>
              <circle cx={mS[0]} cy={mS[1]} r={10 * mPop} fill={COLORS.amber} />
              {[0, 1].map((k) => {
                const p = ((f - 212 + k * 14) % 28) / 28;
                return <circle key={k} cx={mS[0]} cy={mS[1]} r={10 + 44 * p} fill="none" stroke={COLORS.amber} strokeOpacity={(1 - p) * 0.8} strokeWidth={2} />;
              })}
            </g>
          ) : null}
        </g>
      </svg>

      {/* étiquettes (espace écran, taille constante) */}
      <div
        style={{
          position: 'absolute',
          left: tS[0] - 24,
          top: tS[1] + 18,
          transform: 'translateX(-100%)',
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: `${lerp(0.4, 0.2, tPop)}em`,
          color: COLORS.white,
          opacity: clamp01(tPop) * mapFade * routeFade,
          whiteSpace: 'nowrap',
        }}
      >
        ANTANANARIVO
      </div>
      <div
        style={{
          position: 'absolute',
          left: mS[0] + 26,
          top: mS[1] - 62,
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: `${lerp(0.3, 0.06, mPop)}em`,
          color: COLORS.amber,
          opacity: clamp01(mPop) * mapFade * routeFade,
          whiteSpace: 'nowrap',
        }}
      >
        TOAMASINA
      </div>

      {/* éclat horizontal issu de Toamasina */}
      {f >= 236 && f < 304 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {f < 250 ? (
            <rect x={burstL} y={burstY - 1.5} width={burstR - burstL} height={3} fill={COLORS.amber} opacity={0.95} style={{filter: `drop-shadow(0 0 8px ${COLORS.amber})`}} />
          ) : (
            [-1, 1].map((k) => <rect key={k} x={90} y={yc + k * h - 1} width={1740} height={2} fill={k < 0 ? COLORS.cyan : COLORS.amber} opacity={0.9} />)
          )}
        </svg>
      ) : null}

      {/* lettres monumentales révélées par la ligne ouverte */}
      {f >= 247 && f < 304 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `inset(${yc - h}px 90px ${1080 - yc - h}px 90px)`}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(3,15,36,0.82)'}} />
          <div
            style={{
              position: 'absolute',
              left: 140,
              top: yc - bigSpec.fontSize * 1.06 + lerp(110, 0, inner),
              ...fontStyle({...bigSpec, letterSpacing: lerp(0.08, bigSpec.letterSpacing!, inner)}),
              color: COLORS.white,
              transform: `translateX(${-160 * textOut}px)`,
            }}
          >
            NOUVELLES
          </div>
          <div
            style={{
              position: 'absolute',
              left: 140,
              top: yc + bigSpec.fontSize * 0.02 + lerp(190, 0, inner),
              ...fontStyle({...bigSpec, letterSpacing: lerp(0.1, bigSpec.letterSpacing!, inner)}),
              transform: `translateX(${-260 * textOut}px)`,
              background: `linear-gradient(90deg, ${COLORS.white} 0%, ${COLORS.white} 55%, ${COLORS.amber} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            OPPORTUNITÉS
          </div>
        </div>
      ) : null}

      {/* DEVENEZ EXPOSANT */}
      {f >= 262 && f < 306 ? (
        <div style={{position: 'absolute', left: 140, top: yc + 268, transform: `translateX(${keys(f, [292, 304], [0, -700], EASE.in)}px)`}}>
          <Tag text="DEVENEZ EXPOSANT" f={f} start={264} size={34} bg={COLORS.amber} color={COLORS.night} />
        </div>
      ) : null}

      {/* écho visuel de la diction */}
      <div
        style={{
          position: 'absolute',
          left: 124,
          top: 160,
          fontFamily: FONTS.body,
          fontWeight: 500,
          fontSize: 34,
          color: 'rgba(246,250,255,0.85)',
          opacity: prog(f, W.trajectoire - 4, W.trajectoire + 8) * (1 - prog(f, 232, 242)),
          transform: `translateY(${lerp(16, 0, prog(f, W.trajectoire - 4, W.trajectoire + 10, EASE.out))}px)`,
          maxWidth: 900,
          lineHeight: 1.25,
        }}
      >
        Certaines rencontres peuvent changer
        <br />
        <span style={{color: COLORS.amber}}>la trajectoire</span> d'une entreprise.
      </div>
    </Layer>
  );
};
