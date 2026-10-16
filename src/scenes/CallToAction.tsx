import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {COLORS, CONTENT, CUES, GRADIENTS, PHOTOS, SCENES} from '../config';
import {DroneBackground} from '../components/DroneBackground';
import {Polaroid} from '../components/Polaroid';
import {GradientText} from '../components/Typography';
import {ChatPhoneIcon} from '../components/Icons';
import {DISPLAY} from '../fonts';
import {EASE_IN_OUT, EASE_OUT, sp, tw, useSceneTime} from '../lib/anim';

const S = SCENES.cta;

/** Polaroid de l'affiche finale, en éventail. */
const FAN = [
  {photo: PHOTOS.plage, x: 175, y: 520, rot: -9, w: 330},
  {photo: PHOTOS.shooting, x: 420, y: 480, rot: -3, w: 330},
  {photo: PHOTOS.soiree, x: 665, y: 500, rot: 4, w: 330},
  {photo: PHOTOS.nature, x: 905, y: 520, rot: 9, w: 230},
];

const mix = (a: number, b: number, m: number) => a + (b - a) * m;

export const CallToAction: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  const visible = t >= 28.95 ? 1 : 0; // apparaît sous le flash du drop musical
  // passage au plan final « affiche »
  const m = tw(t, CUES.poster, CUES.poster + 0.85, 0, 1, EASE_IN_OUT);

  const badge = sp(t, CUES.urgency, fps, {damping: 10, mass: 0.6, stiffness: 180});
  const cta1 = tw(t, CUES.cta, CUES.cta + 0.5, 0, 1, EASE_OUT);
  const cta2 = tw(t, CUES.cta + 0.15, CUES.cta + 0.65, 0, 1, EASE_OUT);
  const card = sp(t, CUES.whatsapp, fps, {damping: 11, mass: 0.7, stiffness: 160});
  const pulse = (Math.sin((t - CUES.whatsapp) * Math.PI * 2 * 1.2) + 1) / 2;
  const ripple = ((t - CUES.whatsapp) % 1.1) / 1.1;
  const blink = Math.floor(t * 3) % 2 === 0 ? 1 : 0.3;
  const shine = tw(t, CUES.cta + 0.5, CUES.cta + 1.4, 0, 1);
  const finalShine = tw(t, CUES.poster + 1.2, CUES.poster + 2.2, 0, 1);

  // positions (centre vertical, échelle) : plan CTA → plan affiche
  const badgeY = mix(520, 1168, m);
  const badgeS = mix(1, 0.72, m);
  const ctaY = mix(735, 1268, m);
  const ctaS = mix(1, 0.42, m);
  const cardY = mix(1030, 1450, m);
  const cardS = mix(1, 0.92, m);

  const posterIn = (delay: number) => tw(t, CUES.poster + delay, CUES.poster + delay + 0.6, 0, 1, EASE_OUT);
  const center = (y: number, s: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: y,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: `translateY(-50%) scale(${s})`,
  });
  const small: React.CSSProperties = {
    fontFamily: DISPLAY,
    color: 'white',
    textAlign: 'center',
    textShadow: '0 3px 12px rgba(0,0,0,0.45)',
  };

  return (
    <AbsoluteFill style={{opacity: visible}}>
      <DroneBackground duration={S.out - S.in} trimStart={5} rate={0.7} pan={[0.45, 0.6]} zoom={[1.25, 1.1]} blur={m * 8} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(40,20,110,${0.7 + m * 0.2}) 0%, rgba(6,36,74,${0.45 + m * 0.4}) 45%, rgba(6,36,74,${0.75 + m * 0.15}) 100%)`,
        }}
      />

      {/* ===== Plan final : l'affiche ===== */}
      {content.affiche ? (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 60,
            height: 1040,
            opacity: posterIn(0),
            transform: `scale(${0.9 + posterIn(0) * 0.1})`,
          }}
        >
          <Img src={staticFile(content.affiche)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        </div>
      ) : m > 0 ? (
        <>
          <div style={{...center(108, 1), opacity: posterIn(0)}}>
            <div style={{...small, fontWeight: 800, fontSize: 28, letterSpacing: '0.28em'}}>{content.brand}</div>
          </div>
          <div style={{...center(180, 0.9 + posterIn(0.05) * 0.1), opacity: posterIn(0.05)}}>
            <GradientText gradient={GRADIENTS.brand} size={92} shine={finalShine}>
              {content.destination.join(' ')}
            </GradientText>
          </div>
          {FAN.map((p, i) => {
            const s = sp(t, CUES.poster + 0.15 + i * 0.1, fps, {damping: 13, mass: 0.8, stiffness: 140});
            return (
              <div
                key={p.photo.src}
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y + (1 - s) * 500,
                  transform: `translate(-50%,-50%) rotate(${p.rot * s}deg) scale(${0.5 + s * 0.5})`,
                  opacity: Math.min(1, s * 2),
                }}
              >
                <Polaroid src={p.photo.src} ratio={p.photo.ratio} width={p.w} tape={false} />
              </div>
            );
          })}
          <div style={{...center(790, 1), opacity: posterIn(0.35)}}>
            <div style={{...small, fontWeight: 800, fontSize: 28, letterSpacing: '0.3em', opacity: 0.9}}>{content.priceLabel}</div>
          </div>
          <div style={{...center(880, 0.85 + posterIn(0.4) * 0.15), opacity: posterIn(0.4)}}>
            <div style={{display: 'flex', alignItems: 'baseline'}}>
              <GradientText gradient={GRADIENTS.sunset} size={128} shine={finalShine}>
                {content.price}
              </GradientText>
              <span style={{...small, fontWeight: 900, fontSize: 64, marginLeft: 12}}>{content.currency}</span>
            </div>
          </div>
          <div style={{...center(985, 1), opacity: posterIn(0.5)}}>
            <div style={{...small, fontWeight: 900, fontSize: 38}}>
              <span style={{color: COLORS.gold}}>
                {content.day1} & {content.day2} {content.month}
              </span>{' '}
              • {content.departure}
            </div>
          </div>
          <div style={{...center(1040, 1), opacity: posterIn(0.6)}}>
            <div style={{...small, fontWeight: 700, fontSize: 27, letterSpacing: '0.02em'}}>{content.inclusions.join(' • ')}</div>
          </div>
          <div style={{...center(1085, 1), opacity: posterIn(0.7)}}>
            <div style={{...small, fontWeight: 600, fontSize: 26, color: '#FFE2A8'}}>{content.exclusion}</div>
          </div>
        </>
      ) : null}

      {/* ===== Urgence ===== */}
      <div style={{...center(badgeY, badgeS * (0.5 + badge * 0.5)), opacity: Math.min(1, badge * 2)}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '18px 38px',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.sunset})`,
            boxShadow: `0 0 ${20 + pulse * 30}px rgba(255,90,80,0.65)`,
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 50,
            color: 'white',
            letterSpacing: '0.04em',
          }}
        >
          <div style={{width: 22, height: 22, borderRadius: 11, background: 'white', opacity: blink}} />
          {content.urgency}
        </div>
      </div>

      {/* ===== Réservez maintenant ===== */}
      <div style={{...center(ctaY, ctaS)}}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 1,
            color: 'white',
            opacity: cta1,
            transform: `translateY(${(1 - cta1) * 50}px)`,
            filter: `blur(${(1 - cta1) * 10}px)`,
            textShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          {content.cta[0]}
        </div>
        <div style={{opacity: cta2, transform: `translateY(${(1 - cta2) * 50}px)`, filter: `blur(${(1 - cta2) * 10}px)`}}>
          <GradientText gradient={GRADIENTS.ocean} size={118} shine={shine}>
            {content.cta[1]}
          </GradientText>
        </div>
      </div>

      {/* ===== Bouton WhatsApp ===== */}
      <div style={{...center(cardY, cardS * (0.6 + card * 0.4)), opacity: Math.min(1, card * 2)}}>
        <div style={{position: 'relative'}}>
          {/* onde de clic */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 44,
              border: `5px solid ${COLORS.whatsapp}`,
              transform: `scale(${1 + ripple * 0.12}, ${1 + ripple * 0.35})`,
              opacity: (1 - ripple) * 0.8,
            }}
          />
          <div
            style={{
              width: 980,
              padding: '30px 20px 36px',
              borderRadius: 44,
              background: 'linear-gradient(160deg, #2BE374 0%, #1DB954 50%, #128C7E 100%)',
              boxShadow: `0 24px 60px rgba(0,0,0,0.4), 0 0 ${30 + pulse * 40}px rgba(37,211,102,0.6)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${1 + pulse * 0.015})`,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <ChatPhoneIcon size={74} />
              <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 52, color: 'white', letterSpacing: '0.14em'}}>
                {content.whatsappLabel}
              </div>
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 80,
                color: 'white',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                textShadow: '0 4px 14px rgba(0,60,30,0.45)',
              }}
            >
              {content.whatsapp}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
