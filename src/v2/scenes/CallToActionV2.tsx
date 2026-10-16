import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {CONTENT, PHOTOS} from '../../config';
import {DroneBackground} from '../../components/DroneBackground';
import {ChatPhoneIcon} from '../../components/Icons';
import {CONDENSED, DISPLAY} from '../../fonts';
import {EASE_IN_OUT, EASE_OUT, sp, tw, useSceneTime} from '../../lib/anim';
import {Label} from '../parts';
import {PALETTE, V2_CUES, V2_SCENES} from '../timeline';

const S = V2_SCENES.cta;
const C = V2_CUES;

const STRIP = [
  {photo: PHOTOS.plage, focus: 0.7},
  {photo: PHOTOS.shooting, focus: 0.46},
  {photo: PHOTOS.soiree, focus: 0.42},
  {photo: PHOTOS.nature, focus: 0.5},
];

const mix = (a: number, b: number, m: number) => a + (b - a) * m;

export const CallToActionV2: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  const enter = tw(t, S.in, S.in + 0.25, 0, 1, EASE_OUT);
  const m = tw(t, C.poster, C.poster + 0.7, 0, 1, EASE_IN_OUT);

  const badge = sp(t, C.urgency, fps, {damping: 12, mass: 0.5, stiffness: 220});
  const card = sp(t, C.whatsapp, fps, {damping: 13, mass: 0.6, stiffness: 200});
  const pulse = (Math.sin((t - C.whatsapp) * Math.PI * 2) + 1) / 2;
  const blink = Math.floor(t * 3) % 2 === 0 ? 1 : 0.25;

  const badgeY = mix(560, 1160, m);
  const badgeS = mix(1, 0.75, m);
  const ctaY = mix(790, 1262, m);
  const ctaS = mix(1, 0.4, m);
  const cardY = mix(1090, 1445, m);
  const cardS = mix(1, 0.9, m);

  const posterIn = (delay: number) => tw(t, C.poster + delay, C.poster + delay + 0.45, 0, 1, EASE_OUT);
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
  const ctaLine = (start: number): React.CSSProperties => {
    const p = tw(t, start, start + 0.35, 0, 1, EASE_OUT);
    return {transform: `translateY(${(1 - p) * 105}%)`, opacity: p > 0 ? 1 : 0};
  };

  return (
    <AbsoluteFill style={{opacity: enter, transform: `scale(${1.08 - enter * 0.08})`}}>
      <DroneBackground duration={S.out - S.in} trimStart={5} rate={0.9} pan={[0.45, 0.6]} zoom={[1.3, 1.1]} filter="saturate(0.85)" />
      <AbsoluteFill style={{backgroundColor: PALETTE.ink, opacity: 0.62 + m * 0.3}} />

      {/* ===== Plan final : l'affiche ===== */}
      {content.affiche ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 60, height: 1030, opacity: posterIn(0)}}>
          <Img src={staticFile(content.affiche)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        </div>
      ) : m > 0 ? (
        <>
          <div style={{...center(110, 1), opacity: posterIn(0)}}>
            <Label size={26} color={PALETTE.sand}>
              {content.brand}
            </Label>
          </div>
          <div style={{...center(200, 1), opacity: posterIn(0.05), overflow: 'hidden'}}>
            <div style={{fontFamily: CONDENSED, fontSize: 132, lineHeight: 1, color: PALETTE.white, transform: `translateY(${(1 - posterIn(0.05)) * 60}px)`}}>
              {content.destination.join(' ')}
            </div>
          </div>
          {/* bande des 4 photos */}
          <div style={{position: 'absolute', left: 60, right: 60, top: 300, height: 440, display: 'flex', gap: 10}}>
            {STRIP.map((p, i) => {
              const s = posterIn(0.1 + i * 0.07);
              return (
                <div key={p.photo.src} style={{flex: 1, overflow: 'hidden', borderRadius: 14, opacity: s, transform: `translateY(${(1 - s) * 80}px)`}}>
                  <Img
                    src={staticFile(p.photo.src)}
                    style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${p.focus * 100}% 50%`, filter: 'saturate(0.92)'}}
                  />
                </div>
              );
            })}
          </div>
          <div style={{...center(800, 1), opacity: posterIn(0.3)}}>
            <Label size={26} color={PALETTE.sand}>
              {content.priceLabel}
            </Label>
          </div>
          <div style={{...center(890, 1), opacity: posterIn(0.35)}}>
            <div style={{display: 'flex', alignItems: 'flex-end', fontFamily: CONDENSED, lineHeight: 1}}>
              <span style={{fontSize: 140, color: PALETTE.white}}>{content.price}</span>
              <span style={{fontSize: 70, color: PALETTE.coral, marginLeft: 12, lineHeight: 1.45}}>{content.currency}</span>
            </div>
          </div>
          <div style={{...center(988, 1), opacity: posterIn(0.45)}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 36, color: PALETTE.white}}>
              <span style={{color: PALETTE.sand}}>
                {content.day1} & {content.day2} {content.month}
              </span>
              {'  •  '}
              {content.departure}
            </div>
          </div>
          <div style={{...center(1040, 1), opacity: posterIn(0.55)}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,0.85)'}}>{content.inclusions.join('  •  ')}</div>
          </div>
          <div style={{...center(1084, 1), opacity: posterIn(0.6)}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: PALETTE.sand}}>{content.exclusion}</div>
          </div>
        </>
      ) : null}

      {/* ===== Urgence ===== */}
      <div style={{...center(badgeY, badgeS * (0.6 + badge * 0.4)), opacity: Math.min(1, badge * 2)}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 34px',
            borderRadius: 999,
            backgroundColor: PALETTE.coral,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 46,
            letterSpacing: '0.06em',
            color: PALETTE.white,
          }}
        >
          <div style={{width: 20, height: 20, borderRadius: 10, backgroundColor: PALETTE.white, opacity: blink}} />
          {content.urgency}
        </div>
      </div>

      {/* ===== Réservez maintenant ===== */}
      <div style={{...center(ctaY, ctaS)}}>
        <div style={{overflow: 'hidden'}}>
          <div style={{fontFamily: CONDENSED, fontSize: 230, lineHeight: 1, color: PALETTE.white, ...ctaLine(C.cta)}}>{content.cta[0]}</div>
        </div>
        <div style={{overflow: 'hidden', marginTop: -6}}>
          <div style={{fontFamily: CONDENSED, fontSize: 168, lineHeight: 1, color: PALETTE.sand, ...ctaLine(C.cta + 0.12)}}>{content.cta[1]}</div>
        </div>
      </div>

      {/* ===== Bouton WhatsApp ===== */}
      <div style={{...center(cardY, cardS * (0.7 + card * 0.3)), opacity: Math.min(1, card * 2)}}>
        <div
          style={{
            width: 980,
            padding: '28px 20px 34px',
            borderRadius: 36,
            backgroundColor: PALETTE.whatsapp,
            boxShadow: `0 20px 50px rgba(0,0,0,0.35), 0 0 0 ${pulse * 10}px rgba(37,211,102,0.25)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <ChatPhoneIcon size={66} />
            <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, color: PALETTE.white, letterSpacing: '0.16em'}}>
              {content.whatsappLabel}
            </div>
          </div>
          <div style={{marginTop: 8, fontFamily: DISPLAY, fontWeight: 900, fontSize: 80, color: PALETTE.white, whiteSpace: 'nowrap'}}>
            {content.whatsapp}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
