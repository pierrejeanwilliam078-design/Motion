import React from 'react';
import {FONTS} from '../../config/theme';
import {GsnLogo} from '../../components/Primitives';
import {EASE, clamp01, lerp, prog} from '../../lib/motion';
import {Abs, MailIcon, Marquee, P2, PhoneIcon, Rise, Sticker, StripeWipe, WIDE, fitSize, shake} from '../kit';
import T from '../timeline.json';

const W = T.words;

/**
 * V2 · SCÈNE 06 — 33 → 40 s — CTA sur fond orange.
 * Les « opportunités » défilent à toute vitesse puis s'arrêtent net sur
 * « PRENEZ VOTRE PLACE ». « RÉSERVEZ VOTRE STAND » domine ; coordonnées
 * en pastilles très lisibles dès 35,2 s, jusqu'à la dernière frame.
 */
const PHONE = '+261 34 40 302 89';
const EMAIL = 'gsn@elitecommunication.mg';

export const V2_Scene06_CTA: React.FC<{f: number}> = ({f}) => {
  const [sx, sy] = shake(f, 846, 10);
  const size = fitSize('RÉSERVEZ', 1080, 150);
  const spec = WIDE(size);
  // bandeau : défile vite puis s'arrête net
  const stopAt = W.prenezVotrePlace;
  const v0 = -30;
  const travel = f < stopAt - 10 ? (f - 826) * v0 : (stopAt - 10 - 826) * v0 + v0 * 10 * (1 - Math.pow(1 - prog(f, stopAt - 10, stopAt), 2)) / 2;
  const bandIn = prog(f, 826, 836, EASE.out);
  const hl = prog(f, W.reservezVotreStand - 2, W.reservezVotreStand + 6, EASE.out);
  const bump = 1 + 0.035 * Math.sin(Math.PI * prog(f, W.reservezVotreStand, W.reservezVotreStand + 8));
  const card = prog(f, 862, 874, EASE.overshoot);
  const end = prog(f, 966, 978, EASE.overshoot);

  const pill = (start: number) => prog(f, start, start + 11, EASE.overshoot);

  return (
    <Abs style={{overflow: 'hidden'}}>
      <StripeWipe f={f} start={816} color={P2.orange} n={7} angle={16} />
      {f >= 826 ? (
        <Abs style={{transform: `translate(${sx}px, ${sy}px)`}}>
          {/* bandeau des opportunités qui passent */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 70, height: 104, background: P2.ink, transform: `translateX(${lerp(-1920, 0, bandIn)}px)`}}>
            <Marquee text="OPPORTUNITÉS » " spec={WIDE(56)} f={f} speed={0} travel={travel} top={24} color={P2.white} />
          </div>
          <div style={{position: 'absolute', left: 1150, top: 150}}>
            <Sticker text="PRENEZ VOTRE PLACE" f={f} start={stopAt} rot={-5} bg={P2.white} color={P2.ink} size={40} stamp />
          </div>

          {/* RÉSERVEZ VOTRE STAND */}
          <div style={{position: 'absolute', left: 110, top: 236, transform: `scale(${bump})`, transformOrigin: '0 50%'}}>
            <Rise text="RÉSERVEZ" spec={spec} f={f} start={840} stagger={0.8} color={P2.ink} />
            <div style={{height: size * 0.12}} />
            <Rise text="VOTRE" spec={spec} f={f} start={846} stagger={0.8} color={P2.ink} />
            <div style={{height: size * 0.12}} />
            <div style={{position: 'relative', display: 'inline-block'}}>
              <div style={{position: 'absolute', left: -18, right: -18, top: -10, bottom: -14, background: P2.white, borderRadius: 18, transform: `scaleX(${hl})`, transformOrigin: '0 50%'}} />
              <Rise text="STAND" spec={spec} f={f} start={852} stagger={0.8} color={P2.ink} style={{position: 'relative'}} />
            </div>
          </div>

          {/* coordonnées */}
          {[
            {start: 878, bg: P2.white, fg: P2.ink, icoBg: P2.cyan, icon: <PhoneIcon size={40} />, text: PHONE, size: 58, top: 760},
            {start: 886, bg: P2.ink, fg: P2.white, icoBg: P2.flame, icon: <MailIcon size={40} />, text: EMAIL, size: 46, top: 880},
          ].map((r) => {
            const p = pill(r.start);
            return (
              <div
                key={r.text}
                style={{
                  position: 'absolute',
                  left: 110,
                  top: r.top,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  background: r.bg,
                  borderRadius: 60,
                  padding: '12px 36px 12px 12px',
                  transform: `translateX(${lerp(-300, 0, p)}px) scale(${lerp(0.8, 1, p)})`,
                  transformOrigin: '0 50%',
                  opacity: clamp01(p * 3),
                  boxShadow: '0 10px 0 rgba(3,16,41,0.18)',
                }}
              >
                <div style={{width: 84, height: 84, borderRadius: 42, background: r.icoBg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{r.icon}</div>
                <div style={{fontFamily: FONTS.display, fontWeight: 700, fontSize: r.size, color: r.fg, lineHeight: 1, whiteSpace: 'nowrap'}}>{r.text}</div>
              </div>
            );
          })}

          {/* carte logo */}
          <div
            style={{
              position: 'absolute',
              left: 1270,
              top: 300,
              width: 540,
              height: 450,
              borderRadius: 40,
              background: P2.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${card * lerp(1, 1.04, Math.sin(Math.PI * end))}) rotate(${lerp(-8, 0, card)}deg)`,
              opacity: clamp01(card * 3),
              boxShadow: '0 16px 0 rgba(3,16,41,0.2)',
            }}
          >
            <GsnLogo width={460} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 1270,
              width: 540,
              top: 790,
              textAlign: 'center',
              fontFamily: FONTS.wide,
              fontWeight: 900,
              fontSize: 26,
              color: P2.ink,
              lineHeight: 1.5,
              opacity: prog(f, 880, 892),
            }}
          >
            3 – 5 DÉCEMBRE 2026
            <br />
            ARENA TOAMASINA
          </div>
        </Abs>
      ) : null}
    </Abs>
  );
};
