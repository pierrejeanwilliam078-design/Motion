import React from 'react';
import { CUES } from '../timeline';
import { clamp, ease, lerp, progress, rand, spring } from '../lib/motion';
import { COLORS, FONT, GRADIENTS } from '../theme';
import { Letters, Words } from '../components/Text';
import { CanvaMark, ClaudeMark } from '../components/Logos';
import { CARD_TOPS, ResultCardContent, TITLE_STYLE } from './Tools';
import type { SceneProps } from './types';

const L = CUES.claude;
const V = CUES.canva;

export type Rect = { x: number; y: number; w: number; h: number; r: number; rot: number };
export const STACK: Rect = { x: 260, y: 900, w: 560, h: 720, r: 28, rot: 0 };
export const OFFSETS = [
  { dx: 0, dy: 0, rot: 0 },
  { dx: -34, dy: 16, rot: -6 },
  { dx: 30, dy: -12, rot: 5 },
  { dx: -18, dy: 26, rot: -3 },
  { dx: 26, dy: -20, rot: 8 },
];
const STARTS: Rect[] = [
  ...CARD_TOPS.map((y) => ({ x: 90, y, w: 900, h: 160, r: 40, rot: 0 })),
  { x: -760, y: 1000, w: 560, h: 720, r: 28, rot: -25 },
  { x: 1280, y: 1080, w: 560, h: 720, r: 28, rot: 22 },
];
const DELAYS = [0.42, 0.3, 0.2, 0, 0.1];
const LINE_W = [92, 86, 95, 70, 88, 93, 64, 90, 84, 96, 72, 55];
const KEEP = [1, 4, 8];
const KEEP_W = [82, 70, 76];
const CANVA_DISC: Rect = { x: 390, y: 1110, w: 300, h: 300, r: 150, rot: 0 };

export const mixRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
  r: lerp(a.r, b.r, p),
  rot: lerp(a.rot, b.rot, p),
});

/** Lignes du document : lecture (balayage) puis condensation en 3 points clés. */
export function DocLines({ t, opacity, cues = L }: { t: number; opacity: number; cues?: { scanStart: number; scanEnd: number; condense: number } }) {
  const L = cues;
  const scan = progress(t, L.scanStart, L.scanEnd);
  const bandY = lerp(40, 660, ease.inOut(scan));
  const cond = ease.inOut(progress(t, L.condense, L.condense + 0.55));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      {scan > 0 && scan < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: bandY - 36,
            height: 72,
            background: 'linear-gradient(180deg, rgba(107,28,240,0) 0%, rgba(107,28,240,0.16) 50%, rgba(107,28,240,0) 100%)',
            borderBottom: `3px solid ${COLORS.violet}`,
          }}
        />
      )}
      {LINE_W.map((w, i) => {
        const y0 = 70 + i * 50;
        const k = KEEP.indexOf(i);
        const scanned = scan > 0 && y0 < bandY;
        const color = scanned ? 'rgba(107, 28, 240, 0.32)' : COLORS.skeleton;
        if (k >= 0) {
          const y = lerp(y0, 200 + k * 92, cond);
          return (
            <div key={i} style={{ position: 'absolute', left: 48, top: y, display: 'flex', alignItems: 'center', gap: lerp(0, 18, cond), width: 'calc(100% - 96px)' }}>
              <span style={{ width: 22 * cond, height: 22 * cond, borderRadius: 11, background: GRADIENTS.brand, flex: 'none' }} />
              <span
                style={{
                  height: lerp(14, 20, cond),
                  width: `${lerp(w, KEEP_W[k], cond)}%`,
                  borderRadius: 10,
                  background: cond > 0.05 ? `linear-gradient(90deg, rgba(31,91,255,${0.55 * cond}), rgba(107,28,240,${0.45 * cond}))` : color,
                }}
              />
            </div>
          );
        }
        const target = 200 + (i < 3 ? 0 : i < 7 ? 1 : 2) * 92;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 48,
              top: lerp(y0, target, cond),
              height: 14,
              width: `${w * (1 - cond * 0.6)}%`,
              maxWidth: 'calc(100% - 96px)',
              borderRadius: 7,
              background: color,
              opacity: 1 - cond,
            }}
          />
        );
      })}
    </div>
  );
}

export function ClaudeCanvaScene({ t, content }: SceneProps) {
  if (t < L.gather - 0.05 || t > V.fadeOut + 0.9) return null;
  const c = content.claude;
  const v = content.canva;
  const morph = ease.inOut(progress(t, L.morph, L.morph + 0.83));
  const morphEnd = L.morph + 0.83;
  const claudeOut = ease.in(progress(t, L.morph, L.morph + 0.5));
  const canvaOut = ease.inOut(progress(t, V.fadeOut, V.fadeOut + 0.8));
  const sp = spring(t - L.logoIn, { stiffness: 140, damping: 13 });
  const cond = ease.inOut(progress(t, L.condense, L.condense + 0.55));
  const label = spring(t - L.summaryPop, { stiffness: 260, damping: 18 });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        fontFamily: FONT,
        opacity: 1 - canvaOut,
        transform: `scale(${1 - canvaOut * 0.06})`,
        filter: canvaOut > 0 ? `blur(${canvaOut * 14}px)` : undefined,
      }}
    >
      {/* En-tête Claude */}
      {t < L.morph + 0.6 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - claudeOut, transform: `translateY(${-claudeOut * 60}px)` }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 330 - 85, display: 'flex', justifyContent: 'center' }}>
            <ClaudeMark size={170} style={{ transform: `scale(${Math.max(0, sp)}) rotate(${(1 - sp) * -140}deg)`, opacity: clamp(sp * 3) }} />
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 455, transform: 'scale(0.72)', transformOrigin: 'center top' }}>
            <Letters text={c.name} t={t} start={L.titleIn} style={TITLE_STYLE} />
          </div>
          <div style={{ position: 'absolute', left: 110, right: 110, top: 590 }}>
            <Words text={c.text} t={t} start={L.subtitleIn} stagger={0.07} mode="blur" dur={0.6} style={{ fontSize: 46, fontWeight: 560, color: COLORS.inkSoft, lineHeight: 1.22 }} />
          </div>
        </div>
      )}

      {/* Feuilles de documents qui se regroupent */}
      {t < morphEnd + 0.05 &&
        [4, 3, 2, 1, 0].map((i) => {
          const g = spring(t - (L.gather + DELAYS[i]), { stiffness: 105, damping: 17 });
          const off = OFFSETS[i];
          const target = { ...STACK, x: STACK.x + off.dx * (1 - cond), y: STACK.y + off.dy * (1 - cond), rot: off.rot * (1 - cond) };
          let r = mixRect(STARTS[i], target, g);
          if (i === 0 && morph > 0) r = mixRect(r, CANVA_DISC, morph);
          const behindFade = i === 0 ? 1 : 1 - cond;
          if (behindFade <= 0.01) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: r.x,
                top: r.y,
                width: r.w,
                height: r.h,
                borderRadius: r.r,
                background: '#fff',
                transform: `rotate(${r.rot}deg)`,
                boxShadow: `0 ${30 + i * 4}px 80px rgba(31, 91, 255, ${0.12 + 0.02 * i}), 0 0 0 1.5px rgba(10,15,44,0.05)`,
                opacity: behindFade,
                overflow: 'hidden',
              }}
            >
              {i < 3 && clamp(1 - g * 3) > 0 && (
                <div style={{ position: 'absolute', left: 0, top: 0, width: 900, height: 160, opacity: clamp(1 - g * 3) }}>
                  <ResultCardContent title={content.gemini.results[i]} i={i} />
                </div>
              )}
              <DocLines t={i === 0 ? t : 0} opacity={clamp((g - 0.35) * 2) * (1 - clamp(morph * 2.5))} />
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
                    transform: `scale(${0.5 + 0.5 * label})`,
                    transformOrigin: 'left center',
                    opacity: clamp(label * 2) * (1 - clamp(morph * 2.5)),
                  }}
                >
                  <svg width={30} height={30} viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="#fff" />
                  </svg>
                  {c.summaryLabel}
                </div>
              )}
              {i === 0 && morph > 0 && <div style={{ position: 'absolute', inset: 0, background: GRADIENTS.canva, opacity: morph }} />}
            </div>
          );
        })}

      {/* Logo Canva (fin du morphing), puis installation dans l'en-tête */}
      {t >= morphEnd - 0.15 && <CanvaHeader t={t} name={v.name} text={v.text} morphEnd={morphEnd} />}
      {t >= V.artboardIn - 0.05 && <Artboard t={t} title={v.posterTitle} />}
    </div>
  );
}

function CanvaHeader({ t, name, text, morphEnd }: { t: number; name: string; text: string; morphEnd: number }) {
  const settle = ease.inOut(progress(t, V.settle, V.settle + 0.6));
  const cy = lerp(1260, 330, settle);
  const size = lerp(300, 170, settle);
  const appear = clamp((t - (morphEnd - 0.15)) / 0.15);
  return (
    <>
      <div style={{ position: 'absolute', left: 540 - size / 2, top: cy - size / 2, opacity: appear }}>
        <CanvaMark size={size} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 455, transform: 'scale(0.72)', transformOrigin: 'center top' }}>
        <Letters text={name} t={t} start={V.titleIn} style={TITLE_STYLE} />
      </div>
      <div style={{ position: 'absolute', left: 110, right: 110, top: 590 }}>
        <Words text={text} t={t} start={V.subtitleIn} stagger={0.08} mode="blur" dur={0.6} style={{ fontSize: 46, fontWeight: 560, color: COLORS.inkSoft }} />
      </div>
    </>
  );
}

// Mini-composition graphique qui se construit sur la grille rythmique (croches).
const ART = { x: 240, y: 740, w: 600, h: 840 };
const SEL = [
  { x: 0, y: 0, w: 600, h: 840 },
  { x: 318, y: 22, w: 250, h: 250 },
  { x: 36, y: 286, w: 470, h: 128 },
  { x: 36, y: 432, w: 410, h: 70 },
  { x: 36, y: 520, w: 528, h: 200 },
  { x: 36, y: 742, w: 252, h: 74 },
];

export function Artboard({
  t,
  title,
  cues = V,
  background = GRADIENTS.brandWarm,
}: {
  t: number;
  title: string;
  cues?: { artboardIn: number; elements: readonly number[] };
  background?: string;
}) {
  const V = cues;
  const E = V.elements;
  const appear = spring(t - V.artboardIn, { stiffness: 150, damping: 18 });
  const on = (i: number, k = { stiffness: 260, damping: 19 }) => spring(t - E[i], k);
  // Cadre de sélection : suit l'élément courant
  let cur = 0;
  E.forEach((et, i) => {
    if (t >= et - 0.12) cur = i;
  });
  const prev = Math.max(0, cur - 1);
  const mv = spring(t - (E[cur] - 0.12), { stiffness: 300, damping: 26 });
  const sel = {
    x: lerp(SEL[prev].x, SEL[cur].x, mv),
    y: lerp(SEL[prev].y, SEL[cur].y, mv),
    w: lerp(SEL[prev].w, SEL[cur].w, mv),
    h: lerp(SEL[prev].h, SEL[cur].h, mv),
  };
  const selO = clamp((t - (E[0] - 0.15)) * 5) * (1 - clamp((t - (E[5] + 0.35)) * 4));
  const bg = ease.inOut(progress(t, E[0], E[0] + 0.45));
  const headline = on(2);
  return (
    <div
      style={{
        position: 'absolute',
        left: ART.x,
        top: ART.y,
        width: ART.w,
        height: ART.h,
        opacity: clamp(appear * 2),
        transform: `translateY(${(1 - appear) * 80}px) scale(${0.92 + 0.08 * appear})`,
      }}
    >
      {/* Éclats « IA » à l'ouverture */}
      {Array.from({ length: 10 }, (_, i) => {
        const p = progress(t, V.artboardIn + i * 0.03, V.artboardIn + 0.9 + i * 0.03);
        if (p <= 0 || p >= 1) return null;
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const d = 330 + rand(i) * 140 + p * 80;
        const s = 26 + rand(i + 4) * 22;
        return (
          <svg
            key={i}
            width={s}
            height={s}
            viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 300 + Math.cos(a) * d * 0.9 - s / 2, top: 420 + Math.sin(a) * d * 1.25 - s / 2, opacity: Math.sin(p * Math.PI), transform: `scale(${Math.sin(p * Math.PI)}) rotate(${p * 90}deg)` }}
          >
            <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill={i % 2 ? COLORS.violet : COLORS.cyan} />
          </svg>
        );
      })}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: '#fff', boxShadow: '0 50px 120px rgba(107, 28, 240, 0.18), 0 0 0 1.5px rgba(10,15,44,0.06)', overflow: 'hidden' }}>
        {/* e0 : fond dégradé qui se propage depuis un coin */}
        <div style={{ position: 'absolute', inset: 0, background, clipPath: `circle(${bg * 150}% at 0% 100%)` }} />
        {/* e1 : formes */}
        <div style={{ position: 'absolute', left: 318, top: 22, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', transform: `scale(${on(1)})` }} />
        <div style={{ position: 'absolute', left: 420, top: 150, width: 90, height: 90, borderRadius: '50%', background: COLORS.cyan, transform: `scale(${spring(t - E[1] - 0.08, { stiffness: 260, damping: 15 })})` }} />
        {/* e2 : titre */}
        <div style={{ position: 'absolute', left: 44, top: 290, overflow: 'hidden', padding: '0 6px' }}>
          <div style={{ fontSize: 104, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.12, transform: `translateY(${(1 - headline) * 110}%)` }}>{title}</div>
        </div>
        {/* e3 : lignes de texte */}
        {[380, 260].map((w, i) => (
          <div key={i} style={{ position: 'absolute', left: 48, top: 440 + i * 36, width: w, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.7)', transform: `scaleX(${on(3)})`, transformOrigin: 'left' }} />
        ))}
        {/* e4 : visuel */}
        <div style={{ position: 'absolute', left: 36, top: 520, width: 528, height: 200, borderRadius: 26, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', transform: `scale(${on(4)})`, transformOrigin: 'left top' }}>
          <div style={{ position: 'absolute', left: 390, top: 36, width: 70, height: 70, borderRadius: '50%', background: '#fff', opacity: 0.85 }} />
          <svg width={528} height={200} viewBox="0 0 528 200" style={{ position: 'absolute', inset: 0 }}>
            <path d="M0 200 L140 80 L240 160 L330 100 L528 200 Z" fill="rgba(255,255,255,0.75)" />
          </svg>
        </div>
        {/* e5 : bouton */}
        <div style={{ position: 'absolute', left: 36, top: 742, width: 252, height: 74, borderRadius: 37, background: '#fff', display: 'grid', placeItems: 'center', transform: `scale(${on(5)})`, transformOrigin: 'left center' }}>
          <svg width={40} height={40} viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke={COLORS.violet} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {/* Cadre de sélection + poignées */}
      {selO > 0 && (
        <div style={{ position: 'absolute', left: sel.x - 6, top: sel.y - 6, width: sel.w + 12, height: sel.h + 12, border: `3px solid ${COLORS.cyan}`, borderRadius: 8, opacity: selO }}>
          {[
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ].map(([hx, hy], i) => (
            <span key={i} style={{ position: 'absolute', left: `calc(${hx * 100}% - 9px)`, top: `calc(${hy * 100}% - 9px)`, width: 18, height: 18, borderRadius: 4, background: '#fff', border: `3px solid ${COLORS.cyan}` }} />
          ))}
        </div>
      )}
      {/* Curseur */}
      {selO > 0 && (
        <svg width={56} height={56} viewBox="0 0 24 24" style={{ position: 'absolute', left: sel.x + sel.w - 10, top: sel.y + sel.h - 6, opacity: selO, transform: `scale(${1 - 0.15 * Math.max(0, 1 - Math.abs(t - E[cur]) * 10)})`, filter: 'drop-shadow(0 4px 8px rgba(10,15,44,0.25))' }}>
          <path d="M4 2l15 9-6.5 1.6L16 20l-3 1.4-3.4-7.3L4 18z" fill={COLORS.ink} stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
