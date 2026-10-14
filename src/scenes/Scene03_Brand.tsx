import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {W} from '../config/timeline';
import {CharRise, FontSpec, WordSync, fontStyle, textWidth} from '../components/Typography';
import {Layer} from '../components/Primitives';
import {MediaSlot} from '../components/MediaSlot';
import {BusinessMeeting, ExpoStand, StagePitch} from '../components/illustrations/ExpoScenes';
import {EASE, hexPoints, keys, lerp, morphPts, polygonClip, prog, rect6} from '../lib/motion';
import {M, toScreen} from './mapCamera';

/**
 * SCÈNE 03 — 12 → 19 s — SE PROJETER
 * Le point « Toamasina » devient un hexagone (motif du logo) qui se déploie
 * en fenêtre : stand, présentation, rencontre. Typographie « FAITES RAYONNER
 * VOTRE MARQUE » à gauche, images à droite (jamais superposées).
 */
const WIN = {x: 1010, y: 150, w: 790, h: 720};
const HEAD: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 112, fontWeight: 700, letterSpacing: -0.02};
const RAY: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 132, fontWeight: 700, letterSpacing: -0.02};
const SUB: FontSpec = {fontFamily: 'Inter', fontSize: 34, fontWeight: 500};

const hexIris = (cx: number, cy: number, p: number) => polygonClip(hexPoints(cx, cy, 1100 * p, 30 * (1 - p)));

export const Scene03_Brand: React.FC<{f: number}> = ({f}) => {
  // --- fenêtre : point → hexagone → rectangle
  const seed = toScreen(284, M);
  const c1: [number, number] = [WIN.x + WIN.w / 2, WIN.y + WIN.h / 2];
  const grow = prog(f, 288, 316, EASE.out);
  const center: [number, number] = [lerp(seed[0], c1[0], prog(f, 288, 312, EASE.inOut)), lerp(seed[1], c1[1], prog(f, 288, 312, EASE.inOut))];
  const r = lerp(11, 420, grow);
  const toRect = prog(f, 312, 334, EASE.inOut);
  const hex = hexPoints(center[0], center[1], r, 30 * (1 - grow));
  const rect = rect6(WIN.x, WIN.y, WIN.w, WIN.h);
  // poussée caméra finale à travers la fenêtre
  const push = prog(f, 452, 480, EASE.in);
  const winRect = {
    x: lerp(WIN.x, -60, push),
    y: lerp(WIN.y, -60, push),
    w: lerp(WIN.w, 2040, push),
    h: lerp(WIN.h, 1200, push),
  };
  const radius = keys(f, [334, 342, 452, 470], [0, 22, 22, 0]);
  const clip =
    f < 334
      ? polygonClip(morphPts(hex, rect, toRect))
      : `inset(${winRect.y}px ${1920 - winRect.x - winRect.w}px ${1080 - winRect.y - winRect.h}px ${winRect.x}px round ${radius}px)`;
  const hexFill = 1 - prog(f, 300, 318);

  // --- parallaxe (profondeur)
  const drift = prog(f, 300, 452, EASE.soft);
  const contentScale = lerp(1.14, 1.0, prog(f, 300, 452, EASE.out)) * lerp(1, 1.7, push);

  // --- contenus successifs de la fenêtre, transitions par iris hexagonal
  const irisA = prog(f, 368, 382, EASE.inOut);
  const irisB = prog(f, 394, 408, EASE.inOut);
  const navyIn = prog(f, 458, 477, EASE.inOut);

  // --- fenêtres arrière (profondeur de champ)
  const back = prog(f, 318, 344, EASE.out) * (1 - prog(f, 448, 466, EASE.in));
  const backFly = prog(f, 448, 472, EASE.in);

  // --- typographie
  const textOut = prog(f, 446, 464, EASE.in);
  const rayW = textWidth('RAYONNER', RAY);
  const rays = prog(f, 336, 356, EASE.out) * (1 - 0.75 * prog(f, 372, 410));
  const raysRot = f * 0.25;

  return (
    <Layer>
      {f < 473 ? <Layer style={{background: `radial-gradient(ellipse 60% 70% at 72% 50%, #0B3463 0%, ${COLORS.night} 58%, ${COLORS.nightDeep} 100%)`}} /> : null}

      {/* fenêtres arrière, floues, parallaxe plus lente */}
      {[
        {x: 1560, y: 64, w: 330, h: 230, node: <StagePitch f={f - 300} />, blur: 5, dx: 40},
        {x: 860, y: 736, w: 300, h: 250, node: <BusinessMeeting f={f - 300} />, blur: 4, dx: 26},
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x + b.dx * drift + (i ? -1 : 1) * 500 * backFly,
            top: b.y + (i ? 1 : -1) * 300 * backFly,
            width: b.w,
            height: b.h,
            borderRadius: 16,
            overflow: 'hidden',
            opacity: back * 0.6,
            filter: `blur(${b.blur + 10 * backFly}px)`,
            transform: `scale(${lerp(0.85, 1, back) * lerp(1, 2.2, backFly)})`,
          }}
        >
          {b.node}
        </div>
      ))}

      {/* fenêtre principale */}
      {f >= 286 ? (
        <Layer style={{clipPath: clip}}>
          <div
            style={{
              position: 'absolute',
              left: center[0] - WIN.w / 2,
              top: center[1] - WIN.h / 2,
              width: WIN.w,
              height: WIN.h,
              transform: `translateX(${-24 * drift}px) scale(${contentScale})`,
            }}
          >
            <MediaSlot name="stand" fallback={<ExpoStand f={f - 300} />} />
            <div style={{position: 'absolute', inset: 0, clipPath: hexIris(WIN.w / 2, WIN.h / 2, irisA)}}>
              <MediaSlot name="presentation" fallback={<StagePitch f={f - 368} />} />
            </div>
            <div style={{position: 'absolute', inset: 0, clipPath: hexIris(WIN.w / 2, WIN.h / 2, irisB)}}>
              <MediaSlot name="rencontre" fallback={<BusinessMeeting f={f - 394} />} />
            </div>
          </div>
          <Layer style={{background: `linear-gradient(135deg, ${COLORS.amber}, ${COLORS.flame})`, opacity: hexFill}} />
          <Layer style={{background: COLORS.navy, opacity: navyIn}} />
        </Layer>
      ) : null}

      {/* cadre lumineux de la fenêtre */}
      {f >= 334 && f < 452 ? (
        <div
          style={{
            position: 'absolute',
            left: WIN.x - 1,
            top: WIN.y - 1,
            width: WIN.w + 2,
            height: WIN.h + 2,
            borderRadius: 23,
            border: `2px solid rgba(5,200,247,${0.35 * prog(f, 334, 350)})`,
          }}
        />
      ) : null}

      {/* typographie */}
      <div style={{position: 'absolute', left: 124 - 30 * drift - 160 * textOut, top: 0, opacity: 1 - textOut, filter: textOut > 0 ? `blur(${10 * textOut}px)` : undefined}}>
        {/* À TOAMASINA */}
        <div style={{position: 'absolute', left: 0, top: 262, display: 'flex', alignItems: 'center', gap: 18, width: 600}}>
          <div style={{width: 64 * prog(f, W.aToamasina - 4, W.aToamasina + 10, EASE.out), height: 3, background: COLORS.amber}} />
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: `${lerp(0.6, 0.3, prog(f, W.aToamasina, W.aToamasina + 16, EASE.out))}em`,
              color: COLORS.cyan,
              opacity: prog(f, W.aToamasina, W.aToamasina + 10),
              whiteSpace: 'nowrap',
            }}
          >
            À TOAMASINA
          </div>
        </div>

        <div style={{position: 'absolute', left: 0, top: 330}}>
          <CharRise text="FAITES" spec={HEAD} f={f} start={W.faites - 18} stagger={1.3} dur={14} />
        </div>

        {/* RAYONNER : du centre vers l'extérieur, rayons de lumière */}
        <div style={{position: 'absolute', left: 0, top: 452, width: rayW, height: RAY.fontSize}}>
          <svg width={1200} height={1200} style={{position: 'absolute', left: rayW / 2 - 600, top: RAY.fontSize / 2 - 600, opacity: rays * 0.22, WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 62%)'}}>
            <defs>
              <radialGradient id="s3ray">
                <stop offset="0.15" stopColor={COLORS.amber} stopOpacity="0.9" />
                <stop offset="1" stopColor={COLORS.amber} stopOpacity="0" />
              </radialGradient>
            </defs>
            <g transform={`rotate(${raysRot} 600 600)`}>
              {Array.from({length: 18}).map((_, i) => (
                <polygon key={i} points="600,600 1200,585 1200,615" fill="url(#s3ray)" transform={`rotate(${i * 20} 600 600)`} />
              ))}
            </g>
          </svg>
          <CharRise
            text="RAYONNER"
            spec={RAY}
            f={f}
            start={W.faites - 8}
            stagger={1.8}
            dur={16}
            order="center"
            from={0}
            charStyle={(i, p) => ({
              transform: `scale(${lerp(0.4, 1, p)})`,
              transformOrigin: '50% 60%',
              opacity: p,
              filter: p < 1 ? `blur(${lerp(14, 0, p)}px)` : undefined,
              textShadow: `0 0 ${lerp(40, 0, prog(f, W.faites + 6, W.faites + 40))}px rgba(249,174,47,0.9)`,
            })}
            color={COLORS.white}
          />
        </div>

        <div style={{position: 'absolute', left: 0, top: 604, display: 'flex', gap: '0.26em', ...fontStyle(HEAD)}}>
          <CharRise text="VOTRE" spec={HEAD} f={f} start={W.marque - 12} stagger={1.2} dur={14} />
          <CharRise
            text="MARQUE"
            spec={HEAD}
            f={f}
            start={W.marque - 4}
            stagger={1.2}
            dur={14}
            charStyle={() => ({
              background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.orange} 60%, ${COLORS.flame})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            })}
          />
        </div>

        <div style={{position: 'absolute', left: 4, top: 772, width: 820}}>
          <WordSync
            words={[
              {text: 'Vos', at: W.idees - 3},
              {text: 'idées.', at: W.idees},
              {text: 'Vos', at: W.ambitions - 4},
              {text: 'ambitions.', at: W.ambitions, color: COLORS.cyan},
            ]}
            spec={SUB}
            f={f}
            color="rgba(246,250,255,0.85)"
          />
        </div>
      </div>
    </Layer>
  );
};
