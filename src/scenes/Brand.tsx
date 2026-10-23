import React from 'react';
import { CUES, VIDEO } from '../timeline';
import { clamp, ease, lerp, progress, rand, spring, tween } from '../lib/motion';
import { COLORS, FONT, MONO, gradientText } from '../theme';
import { Words } from '../components/Text';
import { WhatsAppMark } from '../components/Logos';
import type { SceneProps } from './types';

const B = CUES.brand;
const T = CUES.tip;

/** SCÈNE 6 — Signature DigitalSub sur fond nuit, pour respecter le logotype blanc d'origine. */
export function BrandScene({ t, content, assets }: SceneProps) {
  if (t < T.darkIn - 0.02) return null;
  const c = content.brand;
  const reveal = ease.inOut(progress(t, T.darkIn, T.darkIn + 0.7));
  const logo = ease.inOut(progress(t, B.logoIn, B.logoIn + 0.95));
  const logoSp = spring(t - B.logoIn, { stiffness: 90, damping: 16 });
  const shine = progress(t, B.shine, B.shine + 0.9);
  const contact = spring(t - B.contactIn, { stiffness: 140, damping: 18 });
  const fade = tween(t, B.fadeOut, VIDEO.duration - B.fadeOut, 0, 1, ease.inOut);
  const glow = 0.75 + 0.25 * Math.sin((t - B.logoIn) * 2.2);
  const mask: React.CSSProperties = {
    WebkitMaskImage: `url(${assets.logo})`,
    maskImage: `url(${assets.logo})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        fontFamily: FONT,
        clipPath: `circle(${reveal * 1250}px at 540px 960px)`,
        background: `radial-gradient(ellipse 80% 50% at 50% 42%, #0B1640 0%, ${COLORS.navy} 70%)`,
      }}
    >
      {/* Halos cyan / violet */}
      <div style={{ position: 'absolute', left: -200, top: 300, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,217,245,0.22), transparent 65%)', opacity: glow * logo }} />
      <div style={{ position: 'absolute', left: 300, top: 560, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,28,240,0.30), transparent 65%)', opacity: glow * logo }} />
      {/* Poussière lumineuse */}
      {Array.from({ length: 26 }, (_, i) => {
        const x = rand(i * 5) * 1080;
        const y = (rand(i * 5 + 1) * 1920 - (t - T.darkIn) * (20 + rand(i) * 40) + 1920) % 1920;
        const s = 3 + rand(i * 9) * 5;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: i % 2 ? COLORS.cyan : '#B78CFF', opacity: 0.35 * reveal * (0.5 + 0.5 * Math.sin(t * 2 + i)) }} />;
      })}
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - fade }}>
        {/* Logo DigitalSub (fichier d'origine, non modifié) */}
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 560,
            width: 900,
            height: 467,
            transform: `scale(${lerp(1.08, 1, logoSp)})`,
            clipPath: `inset(-5% ${lerp(100, -5, logo)}% -5% -5%)`,
            filter: logo < 1 ? `blur(${(1 - logo) * 10}px)` : undefined,
          }}
        >
          <img src={assets.logo} style={{ width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 0 40px rgba(0, 217, 245, 0.25))' }} />
          {shine > 0 && shine < 1 && (
            <div style={{ position: 'absolute', inset: 0, ...mask }}>
              <div
                style={{
                  position: 'absolute',
                  top: -100,
                  bottom: -100,
                  width: 240,
                  left: lerp(-300, 1100, ease.inOut(shine)),
                  background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75), rgba(255,255,255,0))',
                  transform: 'skewX(-20deg)',
                }}
              />
            </div>
          )}
        </div>
        {/* Signature */}
        <div style={{ position: 'absolute', left: 80, right: 80, top: 1130 }}>
          <Words
            text={c.tagline}
            t={t}
            start={B.taglineIn}
            stagger={0.1}
            emphasis={c.taglineEmphasis}
            emphasisGradient={`linear-gradient(120deg, ${COLORS.cyan}, #8FB2FF)`}
            style={{ fontSize: 62, fontWeight: 650, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.15 }}
          />
        </div>
        {/* Barre WhatsApp */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1640, display: 'flex', justifyContent: 'center', opacity: clamp(contact * 2), transform: `translateY(${(1 - contact) * 70}px)` }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              height: 116,
              padding: '0 44px 0 22px',
              borderRadius: 58,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.16)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <WhatsAppMark size={74} />
            <span style={{ fontSize: 42, fontWeight: 650, color: '#fff' }}>{c.contact}</span>
            {c.whatsappNumber && (
              <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 500, letterSpacing: '0.02em', ...gradientText(`linear-gradient(90deg, ${COLORS.cyan}, #9DB8FF)`) }}>
                {c.whatsappNumber}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Fondu final */}
      <div style={{ position: 'absolute', inset: 0, background: '#02040C', opacity: fade }} />
    </div>
  );
}

