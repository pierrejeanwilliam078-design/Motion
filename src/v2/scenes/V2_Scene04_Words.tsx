import React from 'react';
import {fontStyle, textWidth} from '../../components/Typography';
import {EASE, clamp01, lerp, prog} from '../../lib/motion';
import {Abs, BlindsWipe, P2, WIDE, fitSize, shake} from '../kit';

/**
 * V2 · SCÈNE 04 — 19 → 25 s — Trois mots, trois impacts, trois couleurs.
 * RENCONTRES : « RENCON » tombe du haut, « TRES » monte du bas, ils se percutent.
 * VISIBILITÉ : iris circulaire cyan + ondes radar.
 * OPPORTUNITÉS : vague de lettres, puis anneau 3D en rotation qui fonce vers la caméra.
 */
const H1 = 486;
const H2 = 527;
const H3 = 567;

export const V2_Scene04_Words: React.FC<{f: number}> = ({f}) => {
  const [sx, sy] = (() => {
    const a = shake(f, H1, 16);
    const b = shake(f, H2, 12);
    const c = shake(f, H3, 16);
    return [a[0] + b[0] + c[0], a[1] + b[1] + c[1]];
  })();

  // RENCONTRES
  const rSize = fitSize('RENCONTRES', 1720, 200);
  const rSpec = WIDE(rSize);
  const wA = textWidth('RENCON', rSpec);
  const wAll = textWidth('RENCONTRES', rSpec);
  const x0 = 960 - wAll / 2;
  const land = prog(f, 476, H1, (t) => t * t * t);
  const bounce = f >= H1 ? -Math.sin((f - H1) * 0.9) * 26 * Math.exp(-(f - H1) / 4) : 0;
  const yTop = lerp(-700, 0, land) + bounce;
  const yBot = lerp(700, 0, land) - bounce;
  const flash = f >= H1 ? Math.exp(-(f - H1) / 2.5) : 0;

  // VISIBILITÉ
  const iris = prog(f, H2 - 6, H2 + 6, EASE.out);
  const vSize = fitSize('VISIBILITÉ', 1640, 200);

  // OPPORTUNITÉS (plat)
  const oSize = fitSize('OPPORTUNITÉS', 1700, 190);
  const oSpec = WIDE(oSize);

  // anneau 3D
  const ringOn = f >= 584;
  const ringText = 'OPPORTUNITÉS • '.repeat(3);
  const glyph = oSize * 0.95;
  const R = (ringText.length * glyph) / (2 * Math.PI);
  const spin = -prog(f, 584, 626, (t) => t * t) * 150 - (f - 584) * 0.8;
  const push = prog(f, 606, 626, (t) => t * t * t);

  return (
    <Abs style={{background: P2.orange, overflow: 'hidden'}}>
      <Abs style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* lignes de vitesse */}
        {f < H1 + 6
          ? Array.from({length: 7}).map((_, i) => {
              const p = prog(f, 474 + i, H1 + 2, EASE.in);
              return <div key={i} style={{position: 'absolute', left: 120 + i * 250, top: lerp(-300, 1200, p) + (i % 2 ? 0 : -200), width: 6, height: 260, background: P2.white, opacity: 0.5 * (1 - p)}} />;
            })
          : null}
        <div style={{position: 'absolute', left: x0, top: 540 - rSize * 0.5 + yTop, ...fontStyle(rSpec), color: P2.ink}}>RENCON</div>
        <div style={{position: 'absolute', left: x0 + wA, top: 540 - rSize * 0.5 + yBot, ...fontStyle(rSpec), color: P2.white}}>TRES</div>
        {flash > 0.02 ? <Abs style={{background: P2.white, opacity: 0.55 * flash}} /> : null}
      </Abs>

      {/* VISIBILITÉ */}
      {f >= H2 - 6 ? (
        <Abs style={{clipPath: iris < 1 ? `circle(${(iris * 1150).toFixed(1)}px at 960px 540px)` : undefined, background: P2.cyan}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {[0, 1, 2, 3].map((k) => {
              const p = ((f - H2 + k * 9) % 36) / 36;
              return f >= H2 ? <circle key={k} cx={960} cy={540} r={120 + p * 1000} fill="none" stroke={P2.white} strokeWidth={4} opacity={(1 - p) * 0.45} /> : null;
            })}
          </svg>
          <Abs style={{display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translate(${sx}px, ${sy}px)`}}>
            <div style={{...fontStyle(WIDE(vSize, 900, lerp(0.12, -0.02, prog(f, H2 - 4, H2 + 12, EASE.out)))), color: P2.white, transform: `scale(${lerp(0.8, 1, prog(f, H2 - 6, H2 + 8, EASE.out))})`}}>VISIBILITÉ</div>
          </Abs>
        </Abs>
      ) : null}

      {/* OPPORTUNITÉS */}
      <BlindsWipe f={f} start={H3 - 8} color={P2.ink} n={10} dur={7} stagger={0.5} />
      {f >= H3 - 2 && !ringOn ? (
        <Abs style={{display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translate(${sx}px, ${sy}px)`}}>
          <div style={{display: 'flex', ...fontStyle(oSpec)}}>
            {[...'OPPORTUNITÉS'].map((c, i) => {
              const p = prog(f, H3 - 2 + i * 0.8, H3 + 8 + i * 0.8, EASE.overshoot);
              const wave = Math.sin((f - H3) * 0.5 - i * 0.6) * 10 * prog(f, H3 + 8, H3 + 14);
              return (
                <span key={i} style={{display: 'inline-block', transform: `translateY(${lerp(140, 0, p) + wave}px) scale(${lerp(0.4, 1, p)})`, opacity: clamp01(p * 3), color: i % 2 ? P2.electric : P2.white}}>
                  {c}
                </span>
              );
            })}
          </div>
        </Abs>
      ) : null}
      {ringOn ? (
        <Abs style={{perspective: 1300}}>
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 540,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${lerp(-R + 200, 1100, push)}px) rotateX(${lerp(-10, 6, push)}deg) rotateY(${spin}deg)`,
            }}
          >
            {[...ringText].map((c, i) => {
              const a = (i / ringText.length) * 360;
              const facing = Math.cos(((a + spin) * Math.PI) / 180);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: -glyph / 2,
                    top: -oSize * 0.5,
                    width: glyph,
                    textAlign: 'center',
                    ...fontStyle(oSpec),
                    color: facing > 0 ? P2.white : P2.electric,
                    opacity: facing > 0 ? 1 : 0.28,
                    transform: `rotateY(${a}deg) translateZ(${R}px)`,
                  }}
                >
                  {c}
                </div>
              );
            })}
          </div>
        </Abs>
      ) : null}
    </Abs>
  );
};
