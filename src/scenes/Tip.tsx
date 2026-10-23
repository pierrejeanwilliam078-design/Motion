import React from 'react';
import { CUES } from '../timeline';
import { clamp, ease, lerp, progress, tween } from '../lib/motion';
import { COLORS, FONT, GRADIENTS, gradientText } from '../theme';
import { Words } from '../components/Text';
import type { SceneProps } from './types';

const T = CUES.tip;

/** SCÈNE 5 — Conseil : composition épurée, rythme plus lent, mots clés mis en valeur. */
export function TipScene({ t, content }: SceneProps) {
  if (t < T.impact - 0.3 || t > CUES.brand.logoIn + 0.3) return null;
  const c = content.tip;
  const hit = progress(t, T.impact, T.impact + 0.42);
  const hitE = ease.out(hit);
  const shift = ease.inOut(progress(t, T.headingShift, T.headingShift + 0.7));
  const allOut = ease.inOut(progress(t, T.allOut, T.allOut + 0.55));
  const ripple = progress(t, T.impact, T.impact + 1.1);
  const check = ease.inOut(progress(t, T.check, T.check + 0.55));
  const tick = ease.inOut(progress(t, T.check + 0.3, T.check + 0.7));
  const checkPop = 1 + 0.08 * Math.sin(progress(t, T.check + 0.6, T.check + 0.95) * Math.PI);
  const line1Out = ease.in(progress(t, T.line2In - 0.1, T.line2In + 0.35));
  const outStyle: React.CSSProperties = { opacity: 1 - allOut, filter: allOut > 0 ? `blur(${allOut * 10}px)` : undefined, transform: `translateY(${-allOut * 50}px)` };

  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      {/* Onde d'impact */}
      {ripple > 0 && ripple < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 450,
            top: 960 - 450,
            width: 900,
            height: 900,
            borderRadius: '50%',
            border: `4px solid ${COLORS.violet}`,
            transform: `scale(${0.2 + ease.out(ripple) * 0.9})`,
            opacity: 0.45 * (1 - ripple),
          }}
        />
      )}
      <div style={outStyle}>
        {/* TSAROVY! */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lerp(960, 650, shift) - 92,
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${lerp(1.55, 1, hitE) * lerp(1, 0.66, shift)})`,
            opacity: clamp(hit * 6),
            filter: hit < 1 ? `blur(${(1 - hitE) * 16}px)` : undefined,
          }}
        >
          <div style={{ fontSize: 162, fontWeight: 900, letterSpacing: `${lerp(0.12, -0.035, hitE)}em`, lineHeight: 1.05, ...gradientText(GRADIENTS.brandWarm) }}>{c.remember}</div>
        </div>
        {/* Ligne 1 */}
        {t < T.line2In + 0.4 && (
          <div style={{ position: 'absolute', left: 80, right: 80, top: 830, opacity: 1 - line1Out, transform: `translateY(${-line1Out * 70}px)` }}>
            <Words
              text={c.line1}
              t={t}
              start={T.line1In}
              stagger={0.1}
              emphasis={c.line1Emphasis}
              emphasisGradient={GRADIENTS.brandWarm}
              markerAt={T.emphasis1}
              style={{ fontSize: 80, fontWeight: 760, letterSpacing: '-0.03em', lineHeight: 1.1, color: COLORS.ink }}
            />
          </div>
        )}
        {/* Ligne 2 + symbole de vérification */}
        {t >= T.line2In - 0.05 && (
          <>
            <div style={{ position: 'absolute', left: 80, right: 80, top: 840 }}>
              <Words
                text={c.line2}
                t={t}
                start={T.line2In}
                stagger={0.11}
                emphasis={c.line2Emphasis}
                emphasisGradient={GRADIENTS.brand}
                style={{ fontSize: 88, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.08, color: COLORS.ink }}
              />
            </div>
            <div style={{ position: 'absolute', left: 540 - 120, top: 1190, width: 240, height: 240, transform: `scale(${checkPop})` }}>
              <div style={{ position: 'absolute', inset: -60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(31,91,255,0.25), transparent 65%)', opacity: tick }} />
              <svg viewBox="0 0 240 240" width={240} height={240} style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <linearGradient id="chk" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={COLORS.cyan} />
                    <stop offset="0.5" stopColor={COLORS.blue} />
                    <stop offset="1" stopColor={COLORS.violet} />
                  </linearGradient>
                </defs>
                <circle cx="120" cy="120" r="104" fill="#fff" opacity={check} />
                <circle cx="120" cy="120" r="104" fill="none" stroke="url(#chk)" strokeWidth="12" strokeLinecap="round" strokeDasharray={654} strokeDashoffset={654 * (1 - check)} transform="rotate(-90 120 120)" />
                <path d="M74 124 L106 156 L168 90" fill="none" stroke="url(#chk)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={140} strokeDashoffset={140 * (1 - tick)} />
              </svg>
            </div>
          </>
        )}
      </div>
      {/* Conclusion */}
      {t >= T.conclusionIn - 0.05 && (
        <div style={{ position: 'absolute', left: 80, right: 80, top: 800 }}>
          <Words
            text={c.conclusion}
            t={t}
            start={T.conclusionIn}
            stagger={0.15}
            dur={0.75}
            mode="blur"
            emphasis={c.conclusionEmphasis}
            emphasisGradient={GRADIENTS.brandWarm}
            markerAt={T.conclusionIn + 1.25}
            style={{ fontSize: 92, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1, color: COLORS.ink }}
          />
          <div
            style={{
              margin: '64px auto 0',
              width: 120,
              height: 8,
              borderRadius: 4,
              background: GRADIENTS.brand,
              transform: `scaleX(${tween(t, T.conclusionIn + 1.4, 0.7, 0, 1, ease.inOut)})`,
            }}
          />
        </div>
      )}
    </div>
  );
}
