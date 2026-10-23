import React from 'react';
import { clamp, ease, lerp, progress, rand, spring, tween } from '../lib/motion';
import { COLORS, FONT, MONO, gradientText } from '../theme';
import { WhatsAppMark } from '../components/Logos';
import type { SceneProps } from '../scenes/types';
import { VIDEO } from '../timeline';
import { Shockwave, SlamWords } from './fx';
import { CUES2, SIXTEENTH2 } from './timeline2';

const B = CUES2.brand;
const T = CUES2.tip;

/** SCÈNE 6 — Signature : iris nuit, traînées tricolores, logo d'origine qui s'impose. */
export function Brand2({ t, content, assets }: SceneProps) {
  if (t < T.iris - 0.02) return null;
  const c = content.brand;
  const iris = ease.in(progress(t, T.iris, B.logoIn));
  const logoSp = spring(t - B.logoIn, { stiffness: 210, damping: 15 });
  const shine = progress(t, B.shine, B.shine + 0.6);
  const contact = spring(t - B.contactIn, { stiffness: 230, damping: 12 });
  const fade = tween(t, B.fadeOut, VIDEO.duration - B.fadeOut, 0, 1, ease.inOut);
  const pulse = Math.exp(-((t - B.logoIn) % (60 / 114)) / 0.12) * (t > B.logoIn && t < 33.4 ? 1 : 0);
  const mask: React.CSSProperties = { WebkitMaskImage: `url(${assets.logo})`, maskImage: `url(${assets.logo})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' };
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        fontFamily: FONT,
        clipPath: iris < 1 ? `circle(${iris * 1250}px at 540px 960px)` : undefined,
        background: `radial-gradient(ellipse 80% 50% at 50% 42%, #0B1640 0%, ${COLORS.navy} 70%)`,
      }}
    >
      <div style={{ position: 'absolute', left: -200, top: 280, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,217,245,0.26), transparent 65%)', opacity: clamp(logoSp) * (0.75 + 0.25 * pulse) }} />
      <div style={{ position: 'absolute', left: 300, top: 540, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,28,240,0.34), transparent 65%)', opacity: clamp(logoSp) * (0.75 + 0.25 * pulse) }} />
      {/* Traînées tricolores */}
      {[COLORS.cyan, COLORS.blue, COLORS.violet].map((col, i) => {
        const p = ease.inOut(progress(t, B.logoIn - 0.12 + i * 0.05, B.logoIn + 0.38 + i * 0.05));
        if (p <= 0 || p >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: lerp(-1600, 1400, p),
              top: 740 + i * 70,
              width: 1400,
              height: 30,
              borderRadius: 15,
              background: `linear-gradient(90deg, transparent, ${col})`,
              transform: 'rotate(-16deg)',
            }}
          />
        );
      })}
      {Array.from({ length: 30 }, (_, i) => {
        const x = rand(i * 5) * 1080;
        const y = (rand(i * 5 + 1) * 1920 - (t - T.iris) * (60 + rand(i) * 90) + 1920) % 1920;
        const s = 3 + rand(i * 9) * 5;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: i % 2 ? COLORS.cyan : '#B78CFF', opacity: 0.4 * (0.5 + 0.5 * Math.sin(t * 3 + i)) }} />;
      })}
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - fade }}>
        <Shockwave t={t} at={B.logoIn} x={540} y={800} size={1300} color="rgba(0,217,245,0.8)" width={6} />
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 566,
            width: 900,
            height: 467,
            opacity: clamp((t - B.logoIn) / 0.08),
            transform: `scale(${lerp(1.45, 1, logoSp) * (1 + pulse * 0.012)})`,
            filter: logoSp < 0.97 ? `blur(${Math.max(0, 1 - logoSp) * 16}px)` : undefined,
          }}
        >
          <img src={assets.logo} style={{ width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 0 40px rgba(0, 217, 245, 0.3))' }} />
          {shine > 0 && shine < 1 && (
            <div style={{ position: 'absolute', inset: 0, ...mask }}>
              <div style={{ position: 'absolute', top: -100, bottom: -100, width: 260, left: lerp(-300, 1100, ease.inOut(shine)), background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0))', transform: 'skewX(-20deg)' }} />
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 1130 }}>
          <SlamWords
            text={c.tagline}
            t={t}
            start={B.taglineIn}
            step={SIXTEENTH2}
            emphasis={c.taglineEmphasis}
            emphasisGradient={`linear-gradient(120deg, ${COLORS.cyan}, #8FB2FF)`}
            color="#fff"
            style={{ fontSize: 66, fontWeight: 760, letterSpacing: '-0.025em', lineHeight: 1.15 }}
          />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1640, display: 'flex', justifyContent: 'center', opacity: clamp(contact * 2), transform: `translateY(${(1 - contact) * 160}px) scale(${0.8 + 0.2 * contact})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, height: 116, padding: '0 44px 0 22px', borderRadius: 58, background: 'rgba(255,255,255,0.09)', border: '1.5px solid rgba(255,255,255,0.18)', boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)' }}>
            <WhatsAppMark size={74} />
            <span style={{ fontSize: 42, fontWeight: 650, color: '#fff' }}>{c.contact}</span>
            {c.whatsappNumber && (
              <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 500, ...gradientText(`linear-gradient(90deg, ${COLORS.cyan}, #9DB8FF)`) }}>{c.whatsappNumber}</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#02040C', opacity: fade }} />
    </div>
  );
}
