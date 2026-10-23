import React from 'react';
import { clamp, ease, lerp, progress, spring, tween } from '../lib/motion';
import { COLORS, FONT, GRADIENTS } from '../theme';
import type { SceneProps } from '../scenes/types';
import { Burst, Shockwave, Slam, SlamWords } from './fx';
import { CUES2, SIXTEENTH2 } from './timeline2';

const T = CUES2.tip;
const PANEL = `linear-gradient(160deg, ${COLORS.electric} 0%, ${COLORS.blue} 45%, ${COLORS.violet} 100%)`;

/** Mot géant sur le panneau plein écran ; `half` permet de le couper pendant l'ouverture. */
function PanelWord({ t, word, half }: { t: number; word: string; half: 'top' | 'bottom' }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: PANEL,
        clipPath: half === 'top' ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1.7px, transparent 2px)', backgroundSize: '46px 46px' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960 - 95, display: 'flex', justifyContent: 'center' }}>
        <Slam text={word} t={t} at={T.impact} from={2.2} echoColor="rgba(255,255,255,0.7)" style={{ fontSize: 172, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1 }} />
      </div>
    </div>
  );
}

/** SCÈNE 5 — Conseil : panneau plein écran, mot d'impact, puis phrases qui claquent mot par mot. */
export function Tip2({ t, content }: SceneProps) {
  if (t < T.panelIn - 0.02 || t > CUES2.brand.logoIn + 0.05) return null;
  const c = content.tip;
  const split = ease.in(progress(t, T.split, T.split + 0.42));
  const pill = spring(t - (T.split + 0.15), { stiffness: 300, damping: 20 });
  const line1Out = t >= T.line2In;
  const check = spring(t - T.check, { stiffness: 300, damping: 13 });
  const ring = ease.inOut(progress(t, T.check, T.check + 0.3));
  const tick = ease.inOut(progress(t, T.check + 0.12, T.check + 0.38));
  const allOut = ease.in(progress(t, T.allOut, T.allOut + 0.28));
  const outStyle: React.CSSProperties = { opacity: 1 - allOut, transform: `scale(${1 - allOut * 0.12})`, filter: allOut > 0 ? `blur(${allOut * 12}px)` : undefined };
  const zoom = lerp(1.08, 1, ease.out(progress(t, T.panelIn, T.impact + 0.3)));
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      {/* Contenu clair révélé sous le panneau */}
      {t >= T.split - 0.02 && (
        <>
          <div style={outStyle}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', opacity: clamp(pill * 2), transform: `scale(${0.5 + 0.5 * pill})` }}>
              <div style={{ padding: '18px 44px', borderRadius: 60, background: GRADIENTS.brandWarm, color: '#fff', fontSize: 58, fontWeight: 900, letterSpacing: '-0.02em', boxShadow: '0 20px 50px rgba(107, 28, 240, 0.3)' }}>{c.remember}</div>
            </div>
            {!line1Out || t < T.line2In + 0.3 ? (
              <div style={{ position: 'absolute', left: 70, right: 70, top: 780 }}>
                <SlamWords
                  text={c.line1}
                  t={t}
                  start={T.line1In}
                  step={SIXTEENTH2}
                  emphasis={c.line1Emphasis}
                  boxAt={T.box1}
                  exitAt={T.line2In - 0.06}
                  style={{ fontSize: 86, fontWeight: 820, letterSpacing: '-0.035em', lineHeight: 1.12 }}
                />
              </div>
            ) : null}
            {t >= T.line2In - 0.02 && (
              <div style={{ position: 'absolute', left: 70, right: 70, top: 800 }}>
                <SlamWords
                  text={c.line2}
                  t={t}
                  start={T.line2In}
                  step={SIXTEENTH2}
                  emphasis={c.line2Emphasis}
                  emphasisGradient={GRADIENTS.brand}
                  style={{ fontSize: 96, fontWeight: 860, letterSpacing: '-0.04em', lineHeight: 1.08 }}
                />
              </div>
            )}
            {t >= T.check && (
              <div style={{ position: 'absolute', left: 540 - 120, top: 1180, width: 240, height: 240, transform: `scale(${Math.max(0, check)})` }}>
                <svg viewBox="0 0 240 240" width={240} height={240}>
                  <defs>
                    <linearGradient id="chk2" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={COLORS.cyan} />
                      <stop offset="0.5" stopColor={COLORS.blue} />
                      <stop offset="1" stopColor={COLORS.violet} />
                    </linearGradient>
                  </defs>
                  <circle cx="120" cy="120" r="108" fill="url(#chk2)" opacity={ring} />
                  <path d="M72 124 L106 158 L170 88" fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={150} strokeDashoffset={150 * (1 - tick)} />
                </svg>
              </div>
            )}
          </div>
          <Shockwave t={t} at={T.check} x={540} y={1300} size={720} color={COLORS.blue} />
          <Burst t={t} at={T.check} x={540} y={1300} count={12} r0={150} r1={300} />
          {t >= T.conclusionIn - 0.02 && (
            <div style={{ position: 'absolute', left: 70, right: 70, top: 780 }}>
              <SlamWords
                text={c.conclusion}
                t={t}
                start={T.conclusionIn}
                step={SIXTEENTH2}
                emphasis={c.conclusionEmphasis}
                boxAt={T.box2}
                style={{ fontSize: 96, fontWeight: 860, letterSpacing: '-0.04em', lineHeight: 1.12 }}
              />
              <div style={{ margin: '70px auto 0', width: 160, height: 10, borderRadius: 5, background: GRADIENTS.brand, transform: `scaleX(${tween(t, T.box2, 0.35, 0, 1, ease.inOut)})` }} />
            </div>
          )}
        </>
      )}
      {/* Panneau plein écran qui s'ouvre en deux */}
      {split < 1 && (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})` }}>
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-split * 1000}px)` }}>
            <PanelWord t={t} word={c.remember} half="top" />
          </div>
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(${split * 1000}px)` }}>
            <PanelWord t={t} word={c.remember} half="bottom" />
          </div>
          <Shockwave t={t} at={T.impact} x={540} y={960} size={1300} color="rgba(255,255,255,0.8)" width={8} dur={0.7} />
          <Shockwave t={t} at={T.impact + 0.1} x={540} y={960} size={1000} color="rgba(0,217,245,0.8)" width={5} dur={0.7} />
        </div>
      )}
    </div>
  );
}
