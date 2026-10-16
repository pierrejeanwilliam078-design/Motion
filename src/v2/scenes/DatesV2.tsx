import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CONTENT} from '../../config';
import {DroneBackground} from '../../components/DroneBackground';
import {PinIcon} from '../../components/Icons';
import {CONDENSED, DISPLAY} from '../../fonts';
import {EASE_IN_OUT, EASE_OUT, tw, useSceneTime} from '../../lib/anim';
import {Highlight} from '../parts';
import {PALETTE, V2_CUES, V2_SCENES} from '../timeline';

const S = V2_SCENES.dates;
const C = V2_CUES;

export const DatesV2: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t} = useSceneTime(S.in);
  // entrée : volet diagonal
  const wipe = tw(t, S.in, S.in + 0.3, 0, 1, EASE_IN_OUT);
  const d1 = tw(t, C.dates, C.dates + 0.35, 0, 1, EASE_OUT);
  const d2 = tw(t, C.dates + 0.12, C.dates + 0.47, 0, 1, EASE_OUT);
  const amp = tw(t, C.dates + 0.25, C.dates + 0.5, 0, 1, EASE_OUT);
  const dep = tw(t, C.departure, C.departure + 0.35, 0, 1, EASE_OUT);
  const route = tw(t, C.departure + 0.15, C.departure + 1.1, 0, 1, EASE_IN_OUT);
  const big: React.CSSProperties = {fontFamily: CONDENSED, fontSize: 400, lineHeight: 0.9, color: PALETTE.white};

  return (
    <AbsoluteFill style={{clipPath: `polygon(0 0, ${wipe * 200}% 0, ${wipe * 200 - 100}% 100%, 0 100%)`}}>
      <DroneBackground duration={S.out - S.in} trimStart={11} rate={1} pan={[0.25, 0.4]} zoom={[1.3, 1.15]} filter="saturate(0.9)" />
      <AbsoluteFill style={{backgroundColor: 'rgba(14,26,38,0.58)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 400}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{...big, transform: `translateX(${(1 - d1) * -500}px)`, opacity: d1}}>{content.day1}</div>
          <div style={{...big, fontSize: 200, color: PALETTE.coral, transform: `scale(${amp})`}}>&</div>
          <div style={{...big, transform: `translateX(${(1 - d2) * 500}px)`, opacity: d2}}>{content.day2}</div>
        </div>
        <div style={{marginTop: 16}}>
          <Highlight t={t} start={C.dates + 0.3} size={150}>
            {content.month}
          </Highlight>
        </div>
        <div
          style={{
            marginTop: 70,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 54,
            letterSpacing: '0.04em',
            color: PALETTE.white,
            opacity: dep,
            transform: `translateY(${(1 - dep) * 30}px)`,
          }}
        >
          <PinIcon size={56} color={PALETTE.coral} />
          {content.departure}
        </div>
        {/* trajet Toamasina → Akanin'ny Nofy (schéma, pas une carte) */}
        <div style={{marginTop: 46, width: 820, position: 'relative', height: 60, opacity: dep}}>
          <div style={{position: 'absolute', left: 10, right: 10, top: 28, borderTop: '3px dashed rgba(255,255,255,0.35)'}} />
          <div style={{position: 'absolute', left: 10, top: 27, height: 5, width: 800 * route, backgroundColor: PALETTE.sand}} />
          <div style={{position: 'absolute', left: 0, top: 18, width: 24, height: 24, borderRadius: 12, backgroundColor: PALETTE.coral}} />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 18,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: PALETTE.lagoon,
              transform: `scale(${tw(route, 0.85, 1, 0, 1)})`,
            }}
          />
        </div>
        <div style={{width: 860, display: 'flex', justifyContent: 'space-between', opacity: dep}}>
          <span style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 30, color: PALETTE.sand}}>{content.routeFrom}</span>
          <span style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 30, color: PALETTE.sand, opacity: tw(route, 0.8, 1, 0, 1)}}>
            {content.routeTo}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
