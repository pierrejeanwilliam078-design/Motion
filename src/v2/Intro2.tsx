import React from 'react';
import { clamp, ease, lerp, progress, spring, tween } from '../lib/motion';
import { COLORS, FONT, GRADIENTS } from '../theme';
import { Backdrop } from '../components/Backdrop';
import { Words, MonoLabel } from '../components/Text';
import { IAGlyph } from '../scenes/Intro';
import type { SceneProps } from '../scenes/types';
import { Burst, Shockwave, Slam } from './fx';
import { CUES2 } from './timeline2';

const I = CUES2.intro;

// Position du point visé par le zoom (barre du « A », zone pleine) sur la scène.
const GLYPH_W = 520;
const GLYPH_LEFT = 540 - GLYPH_W / 2;
const GLYPH_TOP = 300;
const K = GLYPH_W / 700;
const ZX = GLYPH_LEFT + (415 + 20) * K;
const ZY = GLYPH_TOP + (373 + 20) * K;

// --- Grille de tuiles « vie quotidienne » qui défile très vite (ouverture façon moodboard)
const ICONS = [
  'M4 5h16v10H9l-5 4z', // message
  'M5 6h14v13H5zM5 10h14M9 4v4M15 4v4', // calendrier
  'M5 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H5zM19 5h-3a2 2 0 0 0-2 2', // livre
  'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5 20 20', // recherche
  'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4', // image
  'M7 3h7l4 4v14H7zM10 11h6M10 15h6', // document
  'M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z', // étincelle
  'M5 12.5l4.5 4.5L19 7.5', // validation
];
const TILE_BG = [GRADIENTS.brand, '#FFFFFF', GRADIENTS.brandWarm, '#FFFFFF', `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.blue})`, '#FFFFFF'];
const HEIGHTS = [300, 380, 260, 340, 420, 300, 360];

function TileGrid({ t }: { t: number }) {
  const zoom = lerp(1.45, 1.12, ease.out(progress(t, 0, I.circle + 0.5)));
  return (
    <div style={{ position: 'absolute', inset: -300, transform: `rotate(-9deg) scale(${zoom})` }}>
      {[0, 1, 2, 3].map((col) => {
        const dir = col % 2 ? 1 : -1;
        const speed = 1350 + col * 150;
        const offset = ((t * speed * dir) % 2400) - 1200;
        return (
          <div key={col} style={{ position: 'absolute', left: 120 + col * 400, top: offset - 600, width: 360, display: 'flex', flexDirection: 'column', gap: 36 }}>
            {Array.from({ length: 14 }, (_, i) => {
              const idx = (i + col * 3) % 14;
              const bg = TILE_BG[idx % TILE_BG.length];
              const white = bg === '#FFFFFF';
              return (
                <div
                  key={i}
                  style={{
                    height: HEIGHTS[idx % HEIGHTS.length],
                    borderRadius: 44,
                    background: bg,
                    boxShadow: '0 24px 60px rgba(31, 91, 255, 0.14)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <svg width={120} height={120} viewBox="0 0 24 24" fill="none" stroke={white ? COLORS.blue : '#fff'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICONS[idx % ICONS.length]} />
                  </svg>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Ligne de titre qui remplit la largeur (taille selon le nombre de caractères). */
const lineSize = (w: string) => Math.min(158, Math.round(930 / (w.length * 0.69)));

export function Intro2({ t, content, assets }: SceneProps) {
  if (t > I.zoomEnd + 0.05) return null;
  const c = content.intro;
  const r = lerp(0, 1350, ease.in(progress(t, I.circle, I.circle + 0.42)));
  const grow = spring(t - (I.circle + 0.08), { stiffness: 300, damping: 20 });
  const m = ease.inOut(progress(t, I.morphStart, I.morphEnd));
  const bar = ease.out(progress(t, I.morphEnd - 0.05, I.morphEnd + 0.2));
  const shine = progress(t, I.morphEnd + 0.1, I.morphEnd + 0.75);
  const z = ease.in(progress(t, I.zoomStart, I.zoomEnd));
  const zs = lerp(1, 22, z * z);
  const words = c.title.split(/\s+/).filter(Boolean);
  let y = 750;
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT, overflow: 'hidden' }}>
      {t < I.circle + 0.45 && (
        <div style={{ position: 'absolute', inset: 0, background: COLORS.paper }}>
          <TileGrid t={t} />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: r < 1340 ? `circle(${r}px at 540px 760px)` : undefined,
          transformOrigin: `${ZX}px ${ZY}px`,
          transform: `translate(${(540 - ZX) * z}px, ${(960 - ZY) * z}px) scale(${zs})`,
        }}
      >
        <Backdrop t={t} variant="intro" />
        <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, opacity: tween(t, I.circle + 0.2, 0.3) }}>
          <img src={assets.icon} width={60} height={60} style={{ display: 'block' }} />
          <MonoLabel style={{ color: COLORS.ink }}>DIGITALSUB</MonoLabel>
        </div>
        <div style={{ position: 'absolute', left: GLYPH_LEFT, top: GLYPH_TOP, transform: `scale(${1 + 0.06 * Math.exp(-Math.max(0, t - I.morphEnd) * 8) * (t >= I.morphEnd ? 1 : 0)})` }}>
          {grow > 0.001 && <IAGlyph grow={grow} m={m} bar={bar} shine={shine} width={GLYPH_W} />}
        </div>
        <Shockwave t={t} at={I.morphEnd} x={540} y={510} size={1100} color={COLORS.blue} width={8} />
        <Burst t={t} at={I.morphEnd} x={540} y={510} count={12} r0={300} r1={520} />
        {words.map((w, i) => {
          const size = lineSize(w);
          const top = y;
          y += size * 0.98;
          return (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center' }}>
              <Slam
                text={w}
                t={t}
                at={I.words[Math.min(i, I.words.length - 1)] + Math.max(0, i - 2) * 0.13}
                style={{ fontSize: size, fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1, color: COLORS.ink }}
              />
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 110, right: 110, top: y + 50 }}>
          <Words text={c.subtitle} t={t} start={I.subtitleIn} stagger={0.035} dur={0.4} mode="blur" emphasis={['IA?']} style={{ fontSize: 50, fontWeight: 560, lineHeight: 1.25, color: COLORS.inkSoft }} />
        </div>
      </div>
      {/* Remplissage final par la couleur du « A » pendant le zoom */}
      {z > 0.6 && <div style={{ position: 'absolute', inset: 0, background: GRADIENTS.brand, opacity: clamp((z - 0.6) / 0.35) }} />}
    </div>
  );
}
