import React from 'react';
import { clamp, ease, interp, lerp, progress, rand, spring, tween } from '../lib/motion';
import { COLORS, FONT, GRADIENTS } from '../theme';
import { Chip, MonoLabel, Typewriter } from '../components/Text';
import { ChatGPTMark, GeminiMark } from '../components/Logos';
import { ChatCard, ResultCardContent, CARD_TOPS } from '../scenes/Tools';
import type { SceneProps } from '../scenes/types';
import { Burst, Shockwave, Slam } from './fx';
import { CUES2 } from './timeline2';

const C = CUES2.chatgpt;
const G = CUES2.gemini;
const L = CUES2.claude;
const V = CUES2.canva;

const abs = (top: number, extra?: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', left: 0, right: 0, top, ...extra });
export const TITLE2: React.CSSProperties = { fontSize: 136, fontWeight: 880, letterSpacing: '-0.045em', color: COLORS.ink, lineHeight: 1 };

/** Mise en page héros → compacte, en 0,45 s. */
export function hero2(t: number, shiftAt: number) {
  const s = ease.inOut(progress(t, shiftAt, shiftAt + 0.45));
  return {
    logoY: lerp(690, 330, s),
    logoScale: lerp(1, 0.6, s),
    titleY: lerp(880, 455, s),
    titleScale: lerp(1, 0.72, s),
    chipsY: lerp(1070, 592, s),
    chipsScale: lerp(1, 0.86, s),
  };
}

/** Bande de texte géant en contour qui défile derrière la scène. */
function Marquee({ t, text, top, dir, speed = 260 }: { t: number; text: string; top: number; dir: 1 | -1; speed?: number }) {
  const unit = `${text} • `;
  const x = ((t * speed * dir) % 1600) - 1600;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        whiteSpace: 'nowrap',
        transform: `translateX(${x}px)`,
        fontSize: 240,
        fontWeight: 900,
        letterSpacing: '-0.04em',
        color: 'transparent',
        WebkitTextStroke: '2.5px rgba(31, 91, 255, 0.10)',
        lineHeight: 1,
      }}
    >
      {unit.repeat(6)}
    </div>
  );
}

/** En-tête : symbole DigitalSub + compteur « FITAOVANA 0X / 04 » qui défile. */
export function Header2({ t, content, assets }: SceneProps) {
  const o = Math.min(tween(t, C.logoIn - 0.1, 0.3), 1 - tween(t, V.glitchStart, 0.2, 0, 1, ease.in));
  if (o <= 0) return null;
  const changes = [G.logoIn - 0.1, L.logoIn - 0.1, L.flipEnd];
  const idx = 1 + changes.filter((c) => t >= c).length;
  const last = changes.filter((c) => t >= c).pop();
  const roll = last === undefined ? 1 : spring(t - last, { stiffness: 380, damping: 22 });
  return (
    <div style={{ position: 'absolute', left: 72, right: 72, top: 96, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={assets.icon} width={60} height={60} style={{ display: 'block' }} />
        <span style={{ fontFamily: FONT, fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.ink }}>{content.brand.name}</span>
      </div>
      <MonoLabel style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {content.toolLabel}
        <span style={{ display: 'inline-block', overflow: 'hidden', height: '1.2em', lineHeight: '1.2em' }}>
          <span style={{ display: 'inline-block', transform: `translateY(${(1 - roll) * 100}%)`, color: COLORS.blue, fontWeight: 600 }}>0{idx}</span>
        </span>
        / 04
      </MonoLabel>
    </div>
  );
}

/** Barre de progression des 4 outils (segments qui se remplissent). */
export function ToolProgress2({ t }: { t: number }) {
  const segs: [number, number][] = [
    [C.logoIn, G.logoIn],
    [G.logoIn, L.logoIn],
    [L.logoIn, L.flipEnd],
    [L.flipEnd, V.cut],
  ];
  const o = Math.min(tween(t, C.logoIn, 0.3), 1 - tween(t, V.glitchStart, 0.2));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 72, right: 72, top: 188, display: 'flex', gap: 10, opacity: o }}>
      {segs.map(([a, b], i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(10,15,44,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress(t, a, b) * 100}%`, background: GRADIENTS.brand }} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatGPT

const CHAT_CUES = { ...C, dotsEnd: C.replyTitle - 0.04 };

export function ChatGPT2({ t, content }: SceneProps) {
  if (t < CUES2.intro.zoomEnd - 0.05 || t > C.whipMid + 0.02) return null;
  const c = content.chatgpt;
  const H = hero2(t, C.shift);
  const entry = ease.out(progress(t, CUES2.intro.zoomEnd, CUES2.intro.zoomEnd + 0.5));
  const sp = spring(t - C.logoIn, { stiffness: 260, damping: 15 });
  const spin = lerp(-300, 0, ease.out(progress(t, C.logoIn, C.logoIn + 0.8)));
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT, transform: `scale(${lerp(1.3, 1, entry)})` }}>
      <Marquee t={t} text={c.name} top={1180} dir={-1} />
      <Marquee t={t} text={c.name} top={1440} dir={1} />
      <div style={abs(H.logoY - 140, { display: 'flex', justifyContent: 'center', perspective: 1000 })}>
        <div style={{ transform: `scale(${H.logoScale * Math.max(0, sp)}) rotateY(${(1 - sp) * -160}deg)`, opacity: clamp(sp * 3) }}>
          <ChatGPTMark size={280} spin={spin} />
        </div>
      </div>
      <Shockwave t={t} at={C.logoIn} x={540} y={690} size={1000} color={COLORS.blue} />
      <Burst t={t} at={C.logoIn} x={540} y={690} r0={190} r1={380} />
      <div style={abs(H.titleY, { display: 'flex', justifyContent: 'center', transform: `scale(${H.titleScale})`, transformOrigin: 'center top' })}>
        <Slam text={c.name} t={t} at={C.titleIn} style={TITLE2} />
      </div>
      <div style={abs(H.chipsY, { display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', padding: '0 60px', transform: `scale(${H.chipsScale})`, transformOrigin: 'center top' })}>
        {c.uses.map((u, i) => (
          <Chip key={u} label={u} t={t} at={C.chips[i]} dot={[COLORS.cyan, COLORS.blue, COLORS.violet][i % 3]} />
        ))}
      </div>
      {t >= C.shift && <ChatCard t={t} c={c} cues={CHAT_CUES} tilt={-7} snappy />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gemini

export function Gemini2({ t, content }: SceneProps) {
  if (t < G.logoIn - 0.02 || t > G.wipeSwitch + 0.02) return null;
  const c = content.gemini;
  const H = hero2(t, G.shift);
  const sp = spring(t - G.logoIn, { stiffness: 200, damping: 12 });
  const barSp = spring(t - G.searchIn, { stiffness: 260, damping: 20 });
  const barW = interp(t, [G.searchIn, G.searchIn + 0.35], [120, 900], ease.inOut);
  const rays = clamp(sp) * (0.7 + 0.3 * Math.sin((t - G.logoIn) * 6));
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      <div style={abs(H.logoY - 150, { display: 'flex', justifyContent: 'center' })}>
        <div style={{ position: 'relative', width: 300, height: 300, transform: `scale(${H.logoScale})` }}>
          {/* Rayons lumineux tournants */}
          <div
            style={{
              position: 'absolute',
              inset: -320,
              borderRadius: '50%',
              background: 'repeating-conic-gradient(from 0deg, rgba(124,92,255,0.22) 0deg 6deg, rgba(124,92,255,0) 6deg 24deg)',
              WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
              maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
              transform: `rotate(${(t - G.logoIn) * 40}deg) scale(${0.3 + 0.7 * clamp(sp)})`,
              opacity: rays,
            }}
          />
          <div style={{ position: 'absolute', inset: -170, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.45) 0%, rgba(59,130,246,0.22) 38%, transparent 68%)', opacity: clamp(sp) }} />
          <GeminiMark size={300} style={{ position: 'absolute', inset: 0, transform: `scale(${Math.max(0, sp)}) rotate(${(1 - sp) * 180}deg)` }} />
          {/* Étoiles qui jaillissent */}
          {Array.from({ length: 8 }, (_, i) => {
            const p = progress(t, G.logoIn + i * 0.02, G.logoIn + 0.7 + i * 0.02);
            if (p <= 0 || p >= 1) return null;
            const a = (i / 8) * Math.PI * 2 + 0.4;
            const d = 160 + ease.out(p) * (180 + rand(i) * 120);
            const s = 30 + rand(i + 9) * 26;
            return (
              <div key={i} style={{ position: 'absolute', left: 150 + Math.cos(a) * d - s / 2, top: 150 + Math.sin(a) * d - s / 2, opacity: Math.sin(p * Math.PI), transform: `rotate(${p * 120}deg)` }}>
                <GeminiMark size={s} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={abs(H.titleY, { display: 'flex', justifyContent: 'center', transform: `scale(${H.titleScale})`, transformOrigin: 'center top' })}>
        <Slam text={c.name} t={t} at={G.titleIn} style={TITLE2} echoColor="rgba(124, 92, 255, 0.6)" />
      </div>
      <div style={abs(H.chipsY, { display: 'flex', justifyContent: 'center', gap: 16, transform: `scale(${H.chipsScale})`, transformOrigin: 'center top' })}>
        {c.uses.map((u, i) => (
          <Chip key={u} label={u} t={t} at={G.chips[i]} dot={i ? COLORS.violet : COLORS.blue} />
        ))}
      </div>
      {t >= G.searchIn && (
        <div
          style={{
            position: 'absolute',
            top: 760,
            left: 540 - barW / 2,
            width: barW,
            height: 120,
            borderRadius: 60,
            background: '#fff',
            boxShadow: '0 30px 80px rgba(107, 28, 240, 0.16), 0 0 0 1.5px rgba(10,15,44,0.05)',
            opacity: clamp(barSp * 2),
            transform: `scale(${0.8 + 0.2 * barSp})`,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: '0 36px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <GeminiMark size={48} style={{ flex: 'none', transform: `rotate(${(t - G.searchIn) * 90}deg)` }} />
          <span style={{ fontSize: 36, color: COLORS.ink, fontWeight: 500 }}>
            <Typewriter text={c.query} t={t} start={G.typingStart} end={G.typingEnd} caret={t < G.notify} />
          </span>
        </div>
      )}
      {c.results.map((title, i) => {
        if (t < G.cards[i] - 0.15) return null;
        const p = spring(t - (G.cards[i] - 0.12), { stiffness: 240, damping: 17 });
        const side = i % 2 ? 1 : -1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 90,
              top: CARD_TOPS[i],
              width: 900,
              height: 160,
              borderRadius: 40,
              background: '#fff',
              boxShadow: '0 24px 60px rgba(31, 91, 255, 0.12), 0 0 0 1.5px rgba(10,15,44,0.05)',
              transform: `translateX(${(1 - p) * 1150 * side}px) rotate(${(1 - p) * 14 * side}deg)`,
            }}
          >
            <ResultCardContent title={title} i={i} />
          </div>
        );
      })}
    </div>
  );
}
