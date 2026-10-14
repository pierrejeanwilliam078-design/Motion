import React from 'react';
import {fontStyle} from '../../components/Typography';
import {GsnLogo, LOGO_RATIO} from '../../components/Primitives';
import {EASE, clamp01, lerp, prog} from '../../lib/motion';
import {Abs, Marquee, P2, PinIcon, Rise, Sticker, WIDE, fitSize} from '../kit';
import T from '../timeline.json';

const W = T.words;

/**
 * V2 · SCÈNE 05 — 25 → 33 s — Drop : salve de cercles de couleur, afficheur à palettes
 * pour les dates, logo officiel qui « pop » (échelle uniforme uniquement), puces d'information
 * et bandeau défilant.
 */
const BURSTS = [P2.orange, P2.electric, P2.navy, P2.white];
const LOGO_W = 440;
const LOGO_C: [number, number] = [960, 318];

const FlipCard: React.FC<{f: number; start: number; from: number; to: number; x: number; y: number}> = ({f, start, from, to, x, y}) => {
  const p = prog(f, start, start + 9, EASE.overshoot);
  const steps = to - from;
  const idx = Math.min(steps, Math.max(0, Math.floor((f - start) / 2)));
  const val = String(from + idx).padStart(2, '0');
  const flipPhase = ((f - start) % 2) / 2;
  const settling = idx < steps;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 400,
        height: 420,
        perspective: 900,
        opacity: clamp01(p * 3),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 34,
          background: P2.navy,
          transform: `rotateX(${lerp(-95, 0, p)}deg)`,
          transformOrigin: '50% 100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 18px 0 rgba(3,16,41,0.2)',
          overflow: 'hidden',
        }}
      >
        <div style={{...fontStyle(WIDE(168)), color: P2.white, transform: settling ? `scaleY(${lerp(1, 0.75, flipPhase)})` : undefined}}>{val}</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 208, height: 5, background: P2.ink}} />
      </div>
    </div>
  );
};

export const V2_Scene05_Reveal: React.FC<{f: number}> = ({f}) => {
  const cardsOut = prog(f, 700, 714, EASE.in);
  const logoP = prog(f, 716, 732, EASE.overshoot);
  const ringP = prog(f, 716, 740, EASE.out);
  const titleSize = fitSize('GRAND SALON DU NUMÉRIQUE 2.0', 1640, 66);
  const exit = prog(f, 818, 834, EASE.in);

  return (
    <Abs style={{overflow: 'hidden'}}>
      {/* salve de cercles */}
      {BURSTS.map((c, i) => {
        const p = prog(f, 616 + i * 3, 628 + i * 3, EASE.out);
        return p > 0 ? <Abs key={i} style={{background: c, clipPath: `circle(${(p * 1150).toFixed(1)}px at 960px 540px)`}} /> : null;
      })}

      {f >= 630 ? (
        <Abs style={{transform: `scale(${lerp(1, 0.92, exit)})`, opacity: 1 - exit}}>
          {/* dates : afficheur à palettes */}
          <Abs style={{transform: `translateY(${-1000 * cardsOut}px) rotate(${-8 * cardsOut}deg)`}}>
            <FlipCard f={f} start={W.du3 - 6} from={0} to={3} x={520} y={240} />
            <div style={{position: 'absolute', left: 924, top: 440, width: 72, height: 22, borderRadius: 11, background: P2.orange, transform: `scaleX(${prog(f, W.au5 - 6, W.au5, EASE.out)})`}} />
            <FlipCard f={f} start={W.au5 - 6} from={3} to={5} x={1000} y={240} />
            <div style={{position: 'absolute', left: 960, top: 700, transform: 'translateX(-50%)'}}>
              <Sticker text="DÉCEMBRE 2026" f={f} start={W.decembre2026 - 2} rot={-2} bg={P2.orange} color={P2.ink} size={56} style={{position: 'relative'}} />
            </div>
          </Abs>

          {/* logo officiel */}
          {f >= 712 ? (
            <>
              <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
                {[P2.electric, P2.orange].map((c, i) => (
                  <circle key={i} cx={LOGO_C[0]} cy={LOGO_C[1]} r={120 + (520 + i * 160) * prog(f, 716 + i * 3, 744 + i * 3, EASE.out)} fill="none" stroke={c} strokeWidth={14 * (1 - ringP) + 2} opacity={1 - prog(f, 730, 760)} />
                ))}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  left: LOGO_C[0] - LOGO_W / 2,
                  top: LOGO_C[1] - (LOGO_W * LOGO_RATIO) / 2,
                  transform: `scale(${logoP})`,
                  transformOrigin: '50% 50%',
                }}
              >
                <GsnLogo width={LOGO_W} />
              </div>
            </>
          ) : null}
          {f >= W.devenezExposant - 1 ? (
            <div style={{position: 'absolute', left: 1290, top: 150}}>
              <Sticker text="DEVENEZ EXPOSANT" f={f} start={W.devenezExposant - 1} rot={6} bg={P2.navy} color={P2.white} size={34} stamp />
            </div>
          ) : null}

          {/* titre */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', justifyContent: 'center'}}>
            <Rise
              text="GRAND SALON DU NUMÉRIQUE 2.0"
              spec={WIDE(titleSize)}
              f={f}
              start={W.grandSalon - 4}
              stagger={0.6}
              color={P2.ink}
              charColor={(i) => (i >= 25 ? P2.cyan : undefined)}
            />
          </div>

          {/* puces */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 676, display: 'flex', justifyContent: 'center', gap: 22}}>
            {[
              {text: '3 – 5 DÉCEMBRE 2026', at: 742, bg: P2.navy, fg: P2.white, pin: false},
              {text: 'ARENA TOAMASINA', at: W.arenaToamasina - 2, bg: P2.orange, fg: P2.ink, pin: true},
            ].map((c) => {
              const p = prog(f, c.at, c.at + 10, EASE.overshoot);
              return (
                <div
                  key={c.text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: c.bg,
                    color: c.fg,
                    borderRadius: 50,
                    padding: '20px 34px',
                    ...fontStyle(WIDE(38, 900, 0)),
                    transform: `scale(${p})`,
                    opacity: clamp01(p * 3),
                  }}
                >
                  {c.pin ? <PinIcon size={40} color={P2.ink} dot={P2.orange} /> : null}
                  {c.text}
                </div>
              );
            })}
          </div>

          {/* bandeau défilant */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 880, height: 92, background: P2.ink, transform: `translateY(${lerp(240, 0, prog(f, 756, 768, EASE.out))}px)`}}>
            <Marquee text="GSN 2.0 • 3 – 5 DÉCEMBRE 2026 • ARENA TOAMASINA • DEVENEZ EXPOSANT • " spec={WIDE(34, 700, 0.02)} f={f} speed={-5} top={29} />
          </div>
        </Abs>
      ) : null}
    </Abs>
  );
};
