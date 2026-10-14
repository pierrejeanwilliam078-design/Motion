import React from 'react';
import {FontSpec, fontStyle, textWidth} from '../../components/Typography';
import {EASE, clamp01, hash, lerp, prog} from '../../lib/motion';
import {C3, Chip, NAVY_BG, PHOTOS, Photo, PinDrop, cover} from '../../v3/kit3';
import {BBOX_C, DOTS, ISLAND_N, Pt, View, mapPts, scaleAbout, toPath, toScreen, viewLerp} from '../island';
import {Burst, FlipChars, Scramble} from '../kit4';
import {V_P} from './V4_S1_S2';
import T from '../timeline.json';

const W = T.words;
const V_Q: View = {s: 0.95, cx: 1430, cy: 540};
export const V5: View = {s: 0.9, cx: 560, cy: 540};

// ------------------------------------------------------------------ SCÈNE 03
/**
 * V4 · SCÈNE 03 — 12 → 19 s — L'île devient une fenêtre : la vraie photo de l'Arena
 * de Toamasina apparaît À L'INTÉRIEUR de la silhouette. « RAYONNER » : l'île émet
 * des ondes à sa propre forme. Sortie : plongée dans l'île jusqu'à l'Arena.
 */
export const V4_Scene03: React.FC<{f: number}> = ({f}) => {
  const base = viewLerp(V_P, V_Q, BBOX_C, prog(f, 286, 322, EASE.inOut));
  const bw = 506.4 * base.s;
  const bh = 1000 * base.s;
  const bx = base.cx - BBOX_C[0] * base.s;
  const by = base.cy - BBOX_C[1] * base.s;
  const geo = cover('arena', bw, bh, lerp(1.25, 1.08, prog(f, 286, 450, EASE.out)), PHOTOS.arena.poi[0] - 0.02, 0.56);
  const pinLocal = geo.at(...PHOTOS.arena.poi);
  const pinS: Pt = [bx + pinLocal[0], by + pinLocal[1]];
  // plongée finale autour de l'Arena
  const dive = prog(f, 448, 482, (t) => t * t * t);
  const k = Math.exp(Math.log(14) * dive);
  const tr = `translate(${pinS[0]}px, ${pinS[1]}px) scale(${k}) translate(${-pinS[0]}px, ${-pinS[1]}px)`;
  const localPath = toPath(mapPts(ISLAND_N, {s: base.s, cx: BBOX_C[0] * base.s, cy: BBOX_C[1] * base.s}));
  const outline = mapPts(ISLAND_N, base);
  const center = toScreen(BBOX_C, base);
  const photoIn = prog(f, 290, 314, EASE.out);
  const navy = prog(f, 468, 482);
  const textOut = 446;
  const head: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 132, fontWeight: 700, letterSpacing: -0.025};
  const hs = {...head, fontSize: Math.min(132, (132 * 1000) / textWidth('VOTRE MARQUE', head))};
  const ray = 'RAYONNER';

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {f >= 296 ? <div style={{position: 'absolute', inset: 0, background: NAVY_BG}} /> : null}
      <div style={{position: 'absolute', inset: 0, transform: tr, transformOrigin: '0 0'}}>
        {/* ondes à la forme de l'île : « rayonner » */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {Array.from({length: 6}).map((_, j) => {
            const st = 334 + j * 20;
            const p = prog(f, st, st + 46, EASE.out);
            if (p <= 0 || p >= 1) return null;
            return <path key={j} d={toPath(scaleAbout(outline, center, 1 + 0.6 * p))} fill="none" stroke={j % 2 ? C3.amber : C3.cyan} strokeWidth={3} opacity={(1 - p) * 0.85} />;
          })}
          <path d={toPath(outline)} fill={C3.cyan} opacity={0.18} />
        </svg>
        {/* photo dans la silhouette */}
        <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, clipPath: `path('${localPath}')`}}>
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(${((1 - photoIn) * 100).toFixed(2)}% 0 0 0)`}}>
            <Photo k="arena" geo={geo} parallax={36 * prog(f, 290, 470, EASE.soft)} />
            <div style={{position: 'absolute', inset: 0, background: C3.navy, opacity: navy}} />
          </div>
        </div>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <path d={toPath(outline)} fill="none" stroke={C3.cyan} strokeWidth={3.5} opacity={1 - navy} />
        </svg>
      </div>
      {dive < 0.05 ? <PinDrop f={f} start={330} x={pinS[0]} y={pinS[1]} label="ARENA TOAMASINA" dark size={56} /> : null}

      {/* texte */}
      <div style={{position: 'absolute', left: 120, top: 268, display: 'flex', alignItems: 'center', gap: 18, opacity: 1 - prog(f, textOut, textOut + 10)}}>
        <div style={{width: 64 * prog(f, W.aToamasina - 4, W.aToamasina + 8, EASE.out), height: 4, background: C3.flame}} />
        <Scramble text="À TOAMASINA" spec={{fontFamily: 'Inter', fontSize: 30, fontWeight: 800, letterSpacing: 0.3}} f={f} start={W.aToamasina} stagger={0.8} settle={6} color={C3.white} lockColor={C3.cyan} />
      </div>
      <div style={{position: 'absolute', left: 116, top: 330}}>
        <FlipChars text="FAITES" spec={hs} f={f} start={W.faites - 16} stagger={1.1} exit={textOut} />
      </div>
      {/* RAYONNER : du centre vers l'extérieur, halo ambre */}
      <div style={{position: 'absolute', left: 116, top: 330 + hs.fontSize * 1.05, display: 'flex', ...fontStyle(hs)}}>
        {[...ray].map((c, i) => {
          const rank = Math.abs(i - (ray.length - 1) / 2);
          const s0 = W.faites - 8 + rank * 2;
          const p = prog(f, s0, s0 + 14, EASE.overshoot);
          const fo = prog(f, textOut + hash(i) * 6, textOut + 14 + hash(i) * 6, (t) => t * t);
          const glowAmt = Math.max(0, Math.sin((f - W.faites) * 0.3 - rank)) * prog(f, W.faites, W.faites + 10) * (1 - prog(f, 400, 420));
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translateY(${900 * fo}px) scale(${lerp(0, 1, Math.min(p, 1.15))}) rotate(${lerp((i - 3.5) * 14, 0, clamp01(p))}deg)`,
                opacity: clamp01(p * 2) * (1 - clamp01((fo - 0.6) * 2.5)),
                color: glowAmt > 0.5 ? C3.amber : C3.cyan,
                textShadow: `0 0 ${30 * glowAmt}px rgba(249,174,47,${0.9 * glowAmt})`,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 116, top: 330 + hs.fontSize * 2.1, display: 'flex', gap: hs.fontSize * 0.26}}>
        <FlipChars text="VOTRE" spec={hs} f={f} start={W.marque - 10} stagger={1.1} exit={textOut} />
        <FlipChars
          text="MARQUE"
          spec={hs}
          f={f}
          start={W.marque - 3}
          stagger={1.1}
          exit={textOut}
          charStyle={(i) => ({color: i < 3 ? C3.flame : C3.amber})}
        />
      </div>
      <div style={{position: 'absolute', left: 120, top: 330 + hs.fontSize * 3.45, display: 'flex', gap: 20, opacity: 1 - prog(f, textOut, textOut + 10)}}>
        <Chip f={f} start={W.idees - 2} text="VOS IDÉES" bg={C3.cyan} color={C3.white} />
        <Chip f={f} start={W.ambitions - 2} text="VOS AMBITIONS" bg={C3.amber} color={C3.navy} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ SCÈNE 04
/**
 * V4 · SCÈNE 04 — 19 → 25 s — RENCONTRES (collision en relief + gerbe de points),
 * VISIBILITÉ (l'iris a la forme de Madagascar), OPPORTUNITÉS (décodage) dont les
 * lettres se dissolvent en points qui reforment l'île.
 */
const BIG: FontSpec = {fontFamily: 'Space Grotesk', fontSize: 250, fontWeight: 700, letterSpacing: -0.035};
const fit = (t: string, max: number) => ({...BIG, fontSize: Math.min(BIG.fontSize, (BIG.fontSize * max) / textWidth(t, BIG))});
const EXTRUDE = Array.from({length: 10}, (_, i) => `${i + 1}px ${i + 1}px 0 ${i < 3 ? '#0F9EDA' : '#01263F'}`).join(', ');

export const V4_Scene04: React.FC<{f: number}> = ({f}) => {
  const H1 = 487;
  const rS = fit('RENCONTRES', 1600);
  const wA = textWidth('RENCON', rS);
  const wAll = textWidth('RENCONTRES', rS);
  const x0 = 960 - wAll / 2;
  const land = prog(f, 474, H1, (t) => t * t);
  const rec = f >= H1 ? 20 * Math.sin(((f - H1) * Math.PI) / 7) * Math.exp(-(f - H1) / 5) : 0;
  const shake = f >= H1 && f < H1 + 12 ? (hash(f) - 0.5) * 22 * Math.exp(-(f - H1) / 3) : 0;
  const top = (s: FontSpec) => 540 - s.fontSize * 0.5;
  const vS = fit('VISIBILITÉ', 1500);
  const vW = textWidth('VISIBILITÉ', vS);
  const oS = fit('OPPORTUNITÉS', 1560);
  const oW = textWidth('OPPORTUNITÉS', oS);
  const irisS = Math.exp(lerp(Math.log(0.02), Math.log(7), prog(f, 518, 532, EASE.in)));
  const irisV: View = {s: irisS, cx: 960, cy: 560};
  const irisPath = toPath(mapPts(ISLAND_N, irisV));
  const oBump = 1 + 0.08 * Math.sin(Math.PI * prog(f, 568, 578));
  const dissolve = prog(f, 592, 602);
  const flood = prog(f, 604, 624, EASE.inOut);
  const floodC = toScreen(BBOX_C, V5);
  const floodR = flood * 1500;

  return (
    <div style={{position: 'absolute', inset: 0, background: NAVY_BG, overflow: 'hidden'}}>
      {/* RENCONTRES */}
      {f < 534 ? (
        <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
          <div style={{position: 'absolute', left: lerp(-wA - 300, x0, land) - rec, top: top(rS), ...fontStyle(rS), color: C3.white, textShadow: EXTRUDE}}>RENCON</div>
          <div style={{position: 'absolute', left: lerp(2200, x0 + wA, land) + rec, top: top(rS), ...fontStyle(rS), color: C3.amber, textShadow: EXTRUDE}}>TRES</div>
          <Burst f={f} at={H1} x={x0 + wA} y={540} n={90} spread={700} />
          <div style={{position: 'absolute', left: 0, right: 0, top: top(rS) + rS.fontSize * 1.18, display: 'flex', justifyContent: 'center'}}>
            <Scramble text="DE NOUVEAUX PUBLICS" spec={{fontFamily: 'Inter', fontSize: 30, fontWeight: 800, letterSpacing: 0.3}} f={f} start={494} stagger={0.5} settle={5} color={C3.cyan} lockColor={C3.white} />
          </div>
        </div>
      ) : null}

      {/* VISIBILITÉ : iris en forme de Madagascar */}
      {f >= 518 ? (
        <div style={{position: 'absolute', inset: 0, background: C3.white, clipPath: f < 532 ? `path('${irisPath}')` : undefined}}>
          {f < 561 ? (
            <>
              <div style={{position: 'absolute', left: 960 - vW / 2, top: top(vS), ...fontStyle({...vS, letterSpacing: lerp(0.08, vS.letterSpacing!, prog(f, 520, 548, EASE.out))}), color: C3.navy, transform: `scale(${lerp(1.15, 1, prog(f, 520, 545, EASE.out))})`, transformOrigin: '50% 50%', width: vW}}>
                VISIBILITÉ
              </div>
              <div style={{position: 'absolute', left: 0, right: 0, top: top(vS) + vS.fontSize * 1.18, display: 'flex', justifyContent: 'center'}}>
                <Scramble text="DES CONNEXIONS QUI COMPTENT" spec={{fontFamily: 'Inter', fontSize: 30, fontWeight: 800, letterSpacing: 0.3}} f={f} start={W.creez} stagger={0.5} settle={5} color={C3.cyan} lockColor={C3.navy} />
              </div>
            </>
          ) : null}
          {/* OPPORTUNITÉS */}
          {f >= 560 ? (
            <div style={{position: 'absolute', left: 960 - oW / 2, top: top(oS), transform: `scale(${oBump})`, transformOrigin: '50% 50%', opacity: 1 - dissolve}}>
              <Scramble text="OPPORTUNITÉS" spec={oS} f={f} start={560} stagger={0.7} settle={6} color={C3.cyan} lockColor={C3.navy} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* inondation marine avant le drop */}
      {flood > 0 ? <div style={{position: 'absolute', inset: 0, background: NAVY_BG, clipPath: `circle(${floodR.toFixed(1)}px at ${floodC[0]}px ${floodC[1]}px)`}} /> : null}

      {/* les lettres se dissolvent en points qui reforment l'île (scène 05) */}
      {f >= 594 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {DOTS.map((d, i) => {
            const o: Pt = [960 - oW / 2 + d.r1 * oW, top(oS) + oS.fontSize * (0.15 + 0.7 * d.r2)];
            const tgt = toScreen(d.p, V5);
            const st = 596 + d.r3 * 8;
            const p = prog(f, st, st + 20, EASE.inOut);
            const arc = Math.sin(Math.PI * p) * (d.r4 - 0.5) * 260;
            const x = lerp(o[0], tgt[0], p);
            const y = lerp(o[1], tgt[1], p) + arc;
            const onNavy = Math.hypot(x - floodC[0], y - floodC[1]) < floodR;
            return <circle key={i} cx={x} cy={y} r={lerp(2.6, 3.1, p)} fill={onNavy ? C3.cyan : C3.navy} />;
          })}
        </svg>
      ) : null}
    </div>
  );
};
