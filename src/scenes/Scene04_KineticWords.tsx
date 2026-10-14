import React from 'react';
import {COLORS} from '../config/theme';
import {FontSpec, charOffsets, fontStyle, textWidth} from '../components/Typography';
import {DirBlur, Layer} from '../components/Primitives';
import {EASE, clamp01, keys, lerp, prog} from '../lib/motion';
import {Easing} from 'remotion';

/**
 * SCÈNE 04 — 19 → 25 s — LE MOMENT MOTION DESIGN
 * RENCONTRES : deux groupes de lettres se percutent au centre.
 * VISIBILITÉ : la ligne de jonction devient une fente qui s'ouvre et repousse
 *              « RENCONTRES » hors cadre, dévoilant le mot en pleine lumière.
 * OPPORTUNITÉS : lettres qui s'agrandissent, puis plongée caméra dans le « O »
 *              dont le contre-poinçon devient le portail de la scène 05.
 */
const BASE: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 240, fontWeight: 700, letterSpacing: -0.03};
const fitSpec = (text: string, max = 1640): FontSpec => {
  const w = textWidth(text, BASE);
  return {...BASE, fontSize: Math.min(BASE.fontSize, (BASE.fontSize * max) / w)};
};
const CY = 540;
const topFor = (spec: FontSpec) => CY - spec.fontSize * 0.5;

const HIT1 = 487;
const SLIT: [number, number] = [519, 541];
const HIT3 = 568;
const ZOOM: [number, number] = [597, 624];

const approach = Easing.bezier(0.5, 0, 0.92, 0.55);

export const Scene04_KineticWords: React.FC<{f: number}> = ({f}) => {
  // ---------- RENCONTRES
  const rSpec = fitSpec('RENCONTRES', 1560);
  const wA = textWidth('RENCON', rSpec);
  const wAll = textWidth('RENCONTRES', rSpec);
  const xA = 960 - wAll / 2;
  const xJ = xA + wA;
  const posA = (fr: number) => lerp(-wA - 220, xA, prog(fr, 473, HIT1, approach));
  const posB = (fr: number) => lerp(1920 + 220, xJ, prog(fr, 473, HIT1, approach));
  const recoil = f >= HIT1 ? 22 * Math.sin((Math.PI * (f - HIT1)) / 7) * Math.exp(-(f - HIT1) / 5) : 0;
  const hw = keys(f, SLIT, [0, 1100], EASE.snap);
  const contact = f >= HIT1 ? Math.exp(-(f - HIT1) / 4) : 0;
  const vA = Math.abs(posA(f + 0.5) - posA(f - 0.5));

  // ---------- VISIBILITÉ
  const vSpec = fitSpec('VISIBILITÉ', 1500);
  const vW = textWidth('VISIBILITÉ', vSpec);
  const vScale = lerp(1.1, 1, prog(f, SLIT[0], SLIT[1] + 10, EASE.out)) * lerp(1, 1.03, prog(f, 541, 566, EASE.soft));
  const vOff = charOffsets('VISIBILITÉ', vSpec);

  // ---------- OPPORTUNITÉS
  const oSpec = fitSpec('OPPORTUNITÉS', 1580);
  const oW = textWidth('OPPORTUNITÉS', oSpec);
  const oX = 960 - oW / 2;
  const oOff = charOffsets('OPPORTUNITÉS', oSpec);
  const S = oSpec.fontSize;
  const oCenter: [number, number] = [oX + 0.338 * S, topFor(oSpec) + 0.496 * S];
  const grow = lerp(1, 1.03, prog(f, 574, ZOOM[0], EASE.soft));
  const zoomT = prog(f, ZOOM[0], ZOOM[1], EASE.in);
  const zoom = grow * Math.exp(lerp(0, Math.log(46), zoomT));
  const hole = prog(f, ZOOM[0], ZOOM[0] + 6, EASE.out);

  const showNavy = f < SLIT[1] + 2;
  const slitL = xJ - hw;
  const slitR = xJ + hw;

  return (
    <Layer>
      {/* fond marine (issu de la fenêtre de la scène 03) */}
      {showNavy ? <Layer style={{background: `radial-gradient(ellipse 70% 70% at 50% 50%, #0A4F82 0%, ${COLORS.navy} 50%, #012B4A 100%)`}} /> : null}

      {/* RENCONTRES */}
      {f < SLIT[1] + 2 ? (
        <>
          <DirBlur id="s4-a" x={vA * 0.3} style={{position: 'absolute', left: posA(f) - recoil - hw, top: topFor(rSpec)}}>
            <div style={{...fontStyle(rSpec), color: COLORS.white}}>RENCON</div>
          </DirBlur>
          <DirBlur id="s4-b" x={vA * 0.3} style={{position: 'absolute', left: posB(f) + recoil + hw, top: topFor(rSpec)}}>
            <div style={{...fontStyle(rSpec), color: COLORS.cyan}}>TRES</div>
          </DirBlur>
        </>
      ) : null}

      {/* éclat de jonction + ondes de choc */}
      {f >= HIT1 && f < SLIT[0] + 4 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <rect x={xJ - 2} y={CY - rSpec.fontSize * 0.55} width={4} height={rSpec.fontSize * 1.1} fill={COLORS.white} opacity={0.35 + 0.65 * contact} style={{filter: `drop-shadow(0 0 16px ${COLORS.cyan})`}} />
          {[-0.42, -0.2, 0.18, 0.4].map((dy, i) => {
            const p = prog(f, HIT1, HIT1 + 14, EASE.out);
            const len = 520 * p;
            return [-1, 1].map((k) => (
              <rect key={`${i}${k}`} x={k < 0 ? xJ - 40 - len : xJ + 40} y={CY + dy * rSpec.fontSize - 1} width={len * (0.6 + 0.4 * Math.abs(dy))} height={2} fill={COLORS.cyan} opacity={(1 - p) * 0.8} />
            ));
          })}
        </svg>
      ) : null}

      {/* fente lumineuse puis plan blanc percé (portail du « O ») */}
      {f >= SLIT[0] ? (
        <Layer
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${oCenter[0]}px ${oCenter[1]}px`,
            clipPath: f < SLIT[1] ? `inset(-10px ${1920 - slitR}px -10px ${slitL}px)` : undefined,
          }}
        >
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <defs>
              <mask id="s4hole" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={5000}>
                <rect x={-2000} y={-2000} width={6000} height={5000} fill="white" />
                {hole > 0 ? <ellipse cx={oCenter[0]} cy={oCenter[1]} rx={0.15 * S * hole} ry={0.235 * S * hole} fill="black" /> : null}
              </mask>
            </defs>
            <rect x={-2000} y={-2000} width={6000} height={5000} fill={COLORS.white} mask="url(#s4hole)" />
          </svg>

          {/* VISIBILITÉ */}
          {f < 574 ? (
            <div style={{position: 'absolute', left: 960 - vW / 2, top: topFor(vSpec), transform: `scale(${vScale})`, transformOrigin: '50% 50%', width: vW, height: vSpec.fontSize}}>
              {[...'VISIBILITÉ'].map((c, i) => {
                const pe = prog(f, 555 + i * 0.5, 563 + i * 0.5, EASE.in);
                return (
                  <div key={i} style={{position: 'absolute', left: vOff[i], top: 0, overflow: 'hidden', paddingTop: '0.12em', marginTop: '-0.12em', height: '1.12em', ...fontStyle(vSpec)}}>
                    <span style={{display: 'inline-block', transform: `translateY(${-140 * pe}%)`, color: COLORS.navy}}>{c}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* OPPORTUNITÉS */}
          {f >= 559 ? (
            <div style={{position: 'absolute', left: oX, top: topFor(oSpec), width: oW, height: S}}>
              {[...'OPPORTUNITÉS'].map((c, i) => {
                const s0 = 562 + i * 0.8;
                const p = prog(f, s0, s0 + 12, EASE.out);
                const pop = prog(f, s0, s0 + 14, EASE.overshoot);
                return (
                  <div key={i} style={{position: 'absolute', left: oOff[i], top: 0, overflow: 'hidden', paddingTop: '0.12em', marginTop: '-0.12em', height: '1.14em', ...fontStyle(oSpec)}}>
                    <span
                      style={{
                        display: 'inline-block',
                        transform: `translateY(${lerp(140, 0, p)}%) scale(${lerp(0.82, 1, pop)})`,
                        transformOrigin: '50% 100%',
                        color: COLORS.navy,
                      }}
                    >
                      {c}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Layer>
      ) : null}

      {/* arêtes de la fente */}
      {f >= SLIT[0] && f < SLIT[1] ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {[slitL, slitR].map((x, i) => (
            <rect key={i} x={x - 2} y={0} width={4} height={1080} fill={COLORS.cyan} style={{filter: `drop-shadow(0 0 14px ${COLORS.cyan})`}} />
          ))}
        </svg>
      ) : null}

      {/* reflet de vitesse pendant la plongée */}
      {zoomT > 0 ? <Layer style={{background: `radial-gradient(circle at ${oCenter[0]}px ${oCenter[1]}px, rgba(5,200,247,${0.25 * clamp01(zoomT * 2)}) 0%, transparent 40%)`}} /> : null}
    </Layer>
  );
};

export const S4_HITS = {HIT1, HIT2: SLIT[0] + 9, HIT3};
