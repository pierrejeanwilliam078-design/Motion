import React from 'react';
import { CUES } from '../timeline';
import { clamp, ease, interp, lerp, progress, spring, tween } from '../lib/motion';
import { COLORS, FONT, GRADIENTS } from '../theme';
import { Chip, Letters, MonoLabel, Typewriter } from '../components/Text';
import { ChatGPTMark, GeminiMark } from '../components/Logos';
import type { Content, SceneProps } from './types';

const C = CUES.chatgpt;
const G = CUES.gemini;
const L = CUES.claude;
const V = CUES.canva;

const abs = (top: number, extra?: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', left: 0, right: 0, top, ...extra });

/** Mise en page « héros → compacte » commune aux outils : le logo et le titre remontent pour laisser place à la démo. */
export function heroLayout(t: number, shiftAt: number) {
  const s = ease.inOut(progress(t, shiftAt, shiftAt + 0.7));
  return {
    s,
    logoY: lerp(700, 330, s),
    logoScale: lerp(1, 0.6, s),
    titleY: lerp(880, 455, s),
    titleScale: lerp(1, 0.72, s),
    chipsY: lerp(1070, 592, s),
    chipsScale: lerp(1, 0.86, s),
  };
}

export const TITLE_STYLE: React.CSSProperties = { fontSize: 132, fontWeight: 820, letterSpacing: '-0.04em', color: COLORS.ink, lineHeight: 1 };

/** En-tête persistant des scènes outils : symbole DigitalSub + compteur « FITAOVANA 0X / 04 ». */
export function ToolHeader({ t, content, assets }: SceneProps) {
  const o = Math.min(tween(t, C.logoIn - 0.1, 0.5), 1 - tween(t, V.fadeOut, 0.7, 0, 1, ease.in));
  if (o <= 0) return null;
  const idx = t < G.logoIn - 0.15 ? 1 : t < L.logoIn - 0.1 ? 2 : t < L.morph + 0.4 ? 3 : 4;
  const changes = [G.logoIn - 0.15, L.logoIn - 0.1, L.morph + 0.4];
  const last = changes.filter((c) => t >= c).pop();
  const roll = last === undefined ? 1 : ease.out(progress(t, last, last + 0.45));
  return (
    <div style={{ position: 'absolute', left: 72, right: 72, top: 96, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={assets.icon} width={60} height={60} style={{ display: 'block' }} />
        <span style={{ fontFamily: FONT, fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.ink }}>{content.brand.name}</span>
      </div>
      <MonoLabel style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {content.toolLabel}
        <span style={{ display: 'inline-block', overflow: 'hidden', height: '1.2em', lineHeight: '1.2em' }}>
          <span style={{ display: 'inline-block', transform: `translateY(${(1 - roll) * 100}%)`, color: COLORS.blue, fontWeight: 600 }}>
            0{idx}
          </span>
        </span>
        / 04
      </MonoLabel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SCÈNE 2 — ChatGPT

function ChatCard({ t, c }: { t: number; c: Content['chatgpt'] }) {
  const appear = spring(t - C.shift - 0.12, { stiffness: 120, damping: 17 });
  const sent = t >= C.send;
  const bubble = spring(t - C.send, { stiffness: 260, damping: 22 });
  const dots = t >= C.send + 0.12 && t < C.dotsEnd;
  const reply = spring(t - C.replyTitle, { stiffness: 200, damping: 22 });
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 730,
        width: 900,
        height: 960,
        borderRadius: 56,
        background: '#FFFFFF',
        boxShadow: '0 50px 120px rgba(31, 91, 255, 0.16), 0 0 0 1.5px rgba(10, 15, 44, 0.05)',
        opacity: clamp(appear * 1.4),
        transform: `translateY(${(1 - appear) * 160}px) scale(${0.94 + 0.06 * appear})`,
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      {/* Barre de titre */}
      <div style={{ height: 112, display: 'flex', alignItems: 'center', gap: 18, padding: '0 40px', borderBottom: `1.5px solid ${COLORS.line}` }}>
        <ChatGPTMark size={56} style={{ boxShadow: 'inset 0 0 0 1.5px rgba(10,15,44,0.08)' }} />
        <span style={{ fontSize: 36, fontWeight: 700, color: COLORS.ink }}>{'ChatGPT'}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: '#C9CFE3' }} />
          ))}
        </span>
      </div>
      {/* Bulle utilisateur */}
      {sent && (
        <div
          style={{
            position: 'absolute',
            right: 40,
            top: 150,
            maxWidth: 640,
            padding: '26px 34px',
            borderRadius: '40px 40px 10px 40px',
            background: GRADIENTS.brand,
            color: '#fff',
            fontSize: 38,
            fontWeight: 550,
            lineHeight: 1.3,
            transformOrigin: 'right bottom',
            transform: `translateY(${(1 - bubble) * 520}px) scale(${0.7 + 0.3 * bubble})`,
            opacity: clamp(bubble * 2),
          }}
        >
          {c.prompt}
        </div>
      )}
      {/* Indicateur de saisie */}
      {dots && (
        <div style={{ position: 'absolute', left: 40, top: 360, display: 'flex', gap: 12, padding: '28px 32px', borderRadius: 36, background: COLORS.paper }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: COLORS.inkSoft,
                transform: `translateY(${Math.sin((t - C.send) * 14 - i * 0.9) * -6}px)`,
                opacity: 0.5 + 0.5 * Math.max(0, Math.sin((t - C.send) * 14 - i * 0.9)),
              }}
            />
          ))}
        </div>
      )}
      {/* Réponse structurée */}
      {t >= C.replyTitle && (
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 340,
            width: 720,
            padding: '34px 38px',
            borderRadius: 40,
            background: COLORS.paper,
            border: `1.5px solid ${COLORS.line}`,
            opacity: clamp(reply * 1.5),
            transform: `translateY(${(1 - reply) * 40}px)`,
            transformOrigin: 'left top',
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 750, color: COLORS.ink, letterSpacing: '-0.01em' }}>{c.replyTitle}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 28 }}>
            {c.replyItems.map((item, i) => {
              const p = ease.out(progress(t, C.items[i], C.items[i] + 0.45));
              const check = ease.inOut(progress(t, C.items[i] + 0.08, C.items[i] + 0.4));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
                  <svg width={46} height={46} viewBox="0 0 46 46">
                    <circle cx="23" cy="23" r="23" fill={i === 0 ? COLORS.cyan : i === 1 ? COLORS.blue : COLORS.violet} opacity={0.14} />
                    <path
                      d="M14 24 L20.5 30 L32 17"
                      fill="none"
                      stroke={i === 0 ? '#00A9C2' : i === 1 ? COLORS.blue : COLORS.violet}
                      strokeWidth={4.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={30}
                      strokeDashoffset={30 * (1 - check)}
                    />
                  </svg>
                  <span style={{ fontSize: 36, fontWeight: 550, color: COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Champ de saisie */}
      <div
        style={{
          position: 'absolute',
          left: 32,
          right: 32,
          bottom: 32,
          height: 116,
          borderRadius: 58,
          background: COLORS.paper,
          border: `1.5px solid ${COLORS.line}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px 0 38px',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0, fontSize: 31, color: COLORS.ink, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {sent ? '' : <Typewriter text={c.prompt} t={t} start={C.typingStart} end={C.typingEnd} />}
        </div>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            display: 'grid',
            placeItems: 'center',
            background: t > C.typingStart && !sent ? COLORS.ink : '#C9CFE3',
            transform: `scale(${1 - 0.18 * Math.max(0, 1 - Math.abs(t - C.send) * 8)})`,
          }}
        >
          <svg width={36} height={36} viewBox="0 0 24 24">
            <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function ChatGPTScene({ t, content }: SceneProps) {
  if (t < C.logoIn - 0.2 || t > C.flashPeak + 0.05) return null;
  const c = content.chatgpt;
  const L0 = heroLayout(t, C.shift);
  const sp = spring(t - C.logoIn, { stiffness: 140, damping: 14 });
  const spin = lerp(-200, 0, ease.out(progress(t, C.logoIn, C.logoIn + 1.4)));
  const out = ease.in(progress(t, C.flashPeak - 0.5, C.flashPeak));
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT, opacity: 1 - out * 0.6, transform: `scale(${1 + out * 0.04})` }}>
      <div style={abs(L0.logoY - 140, { display: 'flex', justifyContent: 'center', perspective: 1000 })}>
        <div style={{ transform: `scale(${L0.logoScale * (0.4 + 0.6 * sp)}) rotateY(${(1 - sp) * -110}deg)`, transformOrigin: 'center', opacity: clamp(sp * 2.5) }}>
          <ChatGPTMark size={280} spin={spin} />
        </div>
      </div>
      <div style={abs(L0.titleY, { transform: `scale(${L0.titleScale})`, transformOrigin: 'center top' })}>
        <Letters text={c.name} t={t} start={C.titleIn} style={TITLE_STYLE} />
      </div>
      <div style={abs(L0.chipsY, { display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', padding: '0 60px', transform: `scale(${L0.chipsScale})`, transformOrigin: 'center top' })}>
        {c.uses.map((u, i) => (
          <Chip key={u} label={u} t={t} at={C.chips[i]} dot={[COLORS.cyan, COLORS.blue, COLORS.violet][i % 3]} />
        ))}
      </div>
      {t >= C.shift && <ChatCard t={t} c={c} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SCÈNE 3 — Gemini

const CARD_TOPS = [920, 1110, 1300];
const CARD_TINTS = [GRADIENTS.brand, GRADIENTS.gemini, `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.blue})`];

/** Contenu d'une carte de résultat (réutilisé par la transition vers les feuilles de Claude). */
export function ResultCardContent({ title, i }: { title: string; i: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 30, padding: '0 36px', fontFamily: FONT }}>
      <div style={{ width: 96, height: 96, borderRadius: 28, background: CARD_TINTS[i % 3], display: 'grid', placeItems: 'center', flex: 'none' }}>
        <svg width={50} height={50} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {i === 0 && <path d="M5 6h14M5 11h14M5 16h9" />}
          {i === 1 && (
            <>
              <rect x="4" y="5" width="16" height="15" rx="3" />
              <path d="M4 10h16M9 3v4M15 3v4" />
            </>
          )}
          {i === 2 && (
            <>
              <circle cx="12" cy="12" r="8.5" />
              <path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.8v.2" />
            </>
          )}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: COLORS.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <span style={{ height: 14, width: `${58 - i * 8}%`, borderRadius: 7, background: COLORS.skeleton }} />
          <span style={{ height: 14, width: `${22 + i * 6}%`, borderRadius: 7, background: COLORS.skeleton }} />
        </div>
      </div>
    </div>
  );
}

export function GeminiScene({ t, content }: SceneProps) {
  if (t < G.logoIn - 0.1 || t > G.out + 0.9) return null;
  const c = content.gemini;
  const L0 = heroLayout(t, G.shift);
  const sp = spring(t - G.logoIn, { stiffness: 120, damping: 12 });
  const out = ease.inOut(progress(t, G.out, G.out + 0.6));
  const glow = 0.55 + 0.25 * Math.sin((t - G.logoIn) * 3);
  const bar = spring(t - G.searchIn, { stiffness: 150, damping: 20 });
  const barW = interp(t, [G.searchIn, G.searchIn + 0.55], [120, 900], ease.inOut);
  const headOut: React.CSSProperties = { opacity: 1 - out, transform: `translateY(${-out * 80}px)`, filter: out > 0 ? `blur(${out * 8}px)` : undefined };
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, ...headOut }}>
        <div style={abs(L0.logoY - 150, { display: 'flex', justifyContent: 'center' })}>
          <div style={{ position: 'relative', width: 300, height: 300, transform: `scale(${L0.logoScale})` }}>
            <div
              style={{
                position: 'absolute',
                inset: -170,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124, 92, 255, 0.45) 0%, rgba(59, 130, 246, 0.25) 35%, transparent 68%)',
                opacity: clamp(sp) * glow,
                transform: `scale(${0.6 + 0.4 * clamp(sp)})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -40,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, rgba(59,130,246,0), rgba(59,130,246,0.55), rgba(181,124,246,0.6), rgba(224,115,154,0.4), rgba(59,130,246,0))',
                WebkitMaskImage: 'radial-gradient(circle, transparent 62%, #000 64%, #000 66%, transparent 70%)',
                maskImage: 'radial-gradient(circle, transparent 62%, #000 64%, #000 66%, transparent 70%)',
                transform: `rotate(${(t - G.logoIn) * 140}deg) scale(${0.4 + 0.6 * clamp(sp)})`,
                opacity: clamp(sp) * 0.9,
              }}
            />
            <GeminiMark size={300} style={{ position: 'absolute', inset: 0, transform: `scale(${Math.max(0, sp)}) rotate(${(1 - sp) * 90}deg)` }} />
          </div>
        </div>
        <div style={abs(L0.titleY, { transform: `scale(${L0.titleScale})`, transformOrigin: 'center top' })}>
          <Letters text={c.name} t={t} start={G.titleIn} style={TITLE_STYLE} />
        </div>
        <div style={abs(L0.chipsY, { display: 'flex', justifyContent: 'center', gap: 16, transform: `scale(${L0.chipsScale})`, transformOrigin: 'center top' })}>
          {c.uses.map((u, i) => (
            <Chip key={u} label={u} t={t} at={G.chips[i]} dot={i ? COLORS.violet : COLORS.blue} />
          ))}
        </div>
        {/* Barre de recherche : un cercle qui s'étire en champ */}
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
              boxShadow: '0 30px 80px rgba(107, 28, 240, 0.14), 0 0 0 1.5px rgba(10,15,44,0.05)',
              opacity: clamp(bar * 2),
              transform: `scale(${0.85 + 0.15 * bar})`,
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '0 36px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <GeminiMark size={48} style={{ flex: 'none' }} />
            <span style={{ fontSize: 36, color: COLORS.ink, fontWeight: 500 }}>
              <Typewriter text={c.query} t={t} start={G.typingStart} end={G.typingEnd} caret={t < G.notify} />
            </span>
          </div>
        )}
      </div>
      {/* Cartes de résultats (relayées par les feuilles de Claude à partir de L.gather) */}
      {t < L.gather &&
        c.results.map((title, i) => {
          const p = spring(t - G.cards[i], { stiffness: 170, damping: 19 });
          if (t < G.cards[i]) return null;
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
                boxShadow: '0 24px 60px rgba(31, 91, 255, 0.10), 0 0 0 1.5px rgba(10,15,44,0.05)',
                opacity: clamp(p * 2),
                transform: `translateY(${(1 - p) * 70}px) scale(${0.95 + 0.05 * p})`,
              }}
            >
              <ResultCardContent title={title} i={i} />
            </div>
          );
        })}
    </div>
  );
}

export { CARD_TOPS };
