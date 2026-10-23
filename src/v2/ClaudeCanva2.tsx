import React from 'react';
import { clamp, ease, lerp, progress, spring } from '../lib/motion';
import { COLORS, FONT, GRADIENTS } from '../theme';
import { Words } from '../components/Text';
import { CanvaMark, ClaudeMark } from '../components/Logos';
import { Artboard, DocLines, OFFSETS, STACK } from '../scenes/ClaudeCanva';
import type { SceneProps } from '../scenes/types';
import { Burst, Shockwave, Slam } from './fx';
import { TITLE2 } from './Tools2';
import { CUES2 } from './timeline2';

const L = CUES2.claude;
const V = CUES2.canva;

// Feuilles lancées depuis 5 directions : [x, y, rotation]
const FROM = [
  [260, 2300, 12],
  [-900, -700, -40],
  [1400, -600, 36],
  [-1000, 1150, -28],
  [1500, 1250, 30],
];
const ORDER = [4, 3, 2, 1, 0]; // la feuille du dessus (0) arrive en dernier
const PALETTES = [GRADIENTS.brandWarm, `linear-gradient(135deg, ${COLORS.cyan} 0%, ${COLORS.blue} 100%)`, `linear-gradient(135deg, ${COLORS.violet} 0%, ${COLORS.magenta} 100%)`, GRADIENTS.brandWarm];

export function ClaudeCanva2({ t, content }: SceneProps) {
  if (t < CUES2.gemini.wipeSwitch - 0.02 || t > V.cut + 0.02) return null;
  const c = content.claude;
  const v = content.canva;
  const cond = ease.inOut(progress(t, L.condense, L.condense + 0.4));
  const label = spring(t - L.summaryPop, { stiffness: 320, damping: 17 });
  const flipMid = (L.flipStart + L.flipEnd) / 2;
  const flipA = ease.in(progress(t, L.flipStart, flipMid)); // feuille → tranche
  const flipB = ease.out(progress(t, flipMid, L.flipEnd)); // tranche → logo Canva
  const claudeOut = ease.in(progress(t, L.flipStart, L.flipStart + 0.3));
  const sp = spring(t - L.logoIn, { stiffness: 260, damping: 14 });
  const settle = ease.inOut(progress(t, V.settle, V.settle + 0.4));
  const varIdx = V.variations.filter((x) => t >= x).length;
  const varPunch = varIdx ? Math.exp(-(t - V.variations[varIdx - 1]) / 0.09) : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      {/* En-tête Claude */}
      {t < L.flipStart + 0.35 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - claudeOut, transform: `translateY(${-claudeOut * 90}px)` }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 330 - 85, display: 'flex', justifyContent: 'center' }}>
            <ClaudeMark size={170} style={{ transform: `scale(${Math.max(0, sp)}) rotate(${(1 - sp) * -220}deg)`, opacity: clamp(sp * 3) }} />
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 455, display: 'flex', justifyContent: 'center', transform: 'scale(0.72)', transformOrigin: 'center top' }}>
            <Slam text={c.name} t={t} at={L.titleIn} style={TITLE2} echoColor="rgba(217, 119, 87, 0.6)" />
          </div>
          <div style={{ position: 'absolute', left: 110, right: 110, top: 590 }}>
            <Words text={c.text} t={t} start={L.subtitleIn} stagger={0.04} mode="blur" dur={0.35} style={{ fontSize: 46, fontWeight: 560, color: COLORS.inkSoft, lineHeight: 1.22 }} />
          </div>
        </div>
      )}
      <Shockwave t={t} at={L.logoIn} x={540} y={330} size={600} color={COLORS.claude} width={5} />

      {/* Feuilles lancées qui s'empilent */}
      {t < flipMid + 0.02 &&
        [4, 3, 2, 1, 0].map((i) => {
          const at = L.papers[ORDER.indexOf(i)] - 0.18;
          const g = spring(t - at, { stiffness: 190, damping: 17 });
          if (t < at) return null;
          const [fx, fy, fr] = FROM[i];
          const off = OFFSETS[i];
          const tx = STACK.x + off.dx * (1 - cond);
          const ty = STACK.y + off.dy * (1 - cond);
          const tr = off.rot * (1 - cond);
          const fade = i === 0 ? 1 : 1 - cond;
          if (fade <= 0.01) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: lerp(fx, tx, g),
                top: lerp(fy, ty, g),
                width: STACK.w,
                height: STACK.h,
                borderRadius: STACK.r,
                background: '#fff',
                boxShadow: `0 ${30 + i * 4}px 80px rgba(31, 91, 255, ${0.13 + 0.02 * i}), 0 0 0 1.5px rgba(10,15,44,0.05)`,
                transform: `perspective(1600px) rotate(${lerp(fr, tr, g)}deg) rotateY(${i === 0 ? flipA * 90 : 0}deg) scale(${i === 0 ? 1 - flipA * 0.25 : 1})`,
                opacity: fade,
                overflow: 'hidden',
              }}
            >
              <DocLines t={i === 0 ? t : 0} opacity={1} cues={L} />
              {i === 0 && t >= L.summaryPop && (
                <div
                  style={{
                    position: 'absolute',
                    left: 48,
                    top: 70,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: 70,
                    padding: '0 26px',
                    borderRadius: 35,
                    background: GRADIENTS.brand,
                    color: '#fff',
                    fontSize: 32,
                    fontWeight: 700,
                    transform: `scale(${0.4 + 0.6 * label})`,
                    transformOrigin: 'left center',
                    opacity: clamp(label * 2),
                  }}
                >
                  <svg width={30} height={30} viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="#fff" />
                  </svg>
                  {c.summaryLabel}
                </div>
              )}
            </div>
          );
        })}

      {/* Flip 3D : la feuille se retourne en logo Canva, qui rejoint l'en-tête */}
      {t >= flipMid && (
        <div
          style={{
            position: 'absolute',
            left: 540 - lerp(300, 170, settle) / 2,
            top: lerp(1260, 330, settle) - lerp(300, 170, settle) / 2,
            transform: `perspective(1600px) rotateY(${(1 - flipB) * -90}deg)`,
          }}
        >
          <CanvaMark size={lerp(300, 170, settle)} />
        </div>
      )}
      <Shockwave t={t} at={L.flipEnd} x={540} y={1260} size={900} color={COLORS.cyan} />
      <Burst t={t} at={L.flipEnd} x={540} y={1260} r0={200} r1={380} color={COLORS.violet} />
      {t >= V.titleIn - 0.02 && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 455, display: 'flex', justifyContent: 'center', transform: 'scale(0.72)', transformOrigin: 'center top' }}>
            <Slam text={v.name} t={t} at={V.titleIn} style={TITLE2} echoColor="rgba(0, 196, 204, 0.6)" />
          </div>
          <div style={{ position: 'absolute', left: 110, right: 110, top: 590 }}>
            <Words text={v.text} t={t} start={V.subtitleIn} stagger={0.05} mode="blur" dur={0.35} style={{ fontSize: 46, fontWeight: 560, color: COLORS.inkSoft }} />
          </div>
        </>
      )}
      {t >= V.artboardIn - 0.05 && (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + varPunch * 0.05})`, transformOrigin: '540px 1160px' }}>
          <Artboard t={t} title={v.posterTitle} cues={V} background={PALETTES[varIdx]} />
        </div>
      )}
    </div>
  );
}
