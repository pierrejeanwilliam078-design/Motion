import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CONTENT, CUES, GRADIENTS, SCENES} from '../config';
import {DroneBackground} from '../components/DroneBackground';
import {GradientText} from '../components/Typography';
import {PinIcon} from '../components/Icons';
import {DISPLAY, HAND} from '../fonts';
import {EASE_IN_OUT, EASE_OUT, sp, tw, useSceneTime} from '../lib/anim';

const S = SCENES.dates;

/** Feuille de calendrier qui bascule en 3D. */
const CalendarCard: React.FC<{day: string; month: string; flip: number}> = ({day, month, flip}) => (
  <div style={{perspective: 1200}}>
    <div
      style={{
        width: 300,
        height: 340,
        borderRadius: 28,
        background: 'white',
        overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        transform: `rotateX(${(1 - flip) * -95}deg)`,
        transformOrigin: '50% 0%',
        opacity: flip > 0.02 ? 1 : 0,
      }}
    >
      <div
        style={{
          height: 86,
          background: `linear-gradient(90deg, ${COLORS.sunset}, ${COLORS.coral})`,
          color: 'white',
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: 44,
          letterSpacing: '0.2em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {month}
      </div>
      <div
        style={{
          height: 254,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: 190,
          color: COLORS.deep,
          letterSpacing: '-0.04em',
        }}
      >
        {day}
      </div>
    </div>
  </div>
);

export const Dates: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  // entrée en iris (cercle qui s'ouvre)
  const iris = tw(t, 25.75, 26.25, 0, 1, EASE_IN_OUT);
  const f1 = sp(t, CUES.calendar[0], fps, {damping: 10, mass: 0.7, stiffness: 150});
  const f2 = sp(t, CUES.calendar[1], fps, {damping: 10, mass: 0.7, stiffness: 150});
  const month = tw(t, CUES.calendar[1] + 0.15, CUES.calendar[1] + 0.8, 0, 1);
  const dep = tw(t, CUES.departure, CUES.departure + 0.6, 0, 1);
  const route = tw(t, CUES.departure + 0.3, CUES.departure + 1.8, 0, 1, EASE_IN_OUT);
  const shine = tw(t, 27, 27.9, 0, 1);

  // tracé schématique (non cartographique) du trajet
  const path = 'M 150 120 C 330 -20, 560 230, 760 70 S 900 60, 930 90';
  return (
    <AbsoluteFill style={{clipPath: `circle(${iris * 120}% at 50% 50%)`}}>
      <DroneBackground duration={S.out - S.in} trimStart={11} rate={0.8} pan={[0.25, 0.4]} zoom={[1.1, 1.3]} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(6,36,74,0.8) 0%, rgba(6,60,110,0.55) 45%, rgba(25,160,180,0.35) 70%, rgba(6,36,74,0.75) 100%)',
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 400}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <CalendarCard day={content.day1} month={content.monthShort} flip={f1} />
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: 110,
              color: COLORS.gold,
              opacity: f2,
              transform: `scale(${f2})`,
              textShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            &
          </div>
          <CalendarCard day={content.day2} month={content.monthShort} flip={f2} />
        </div>
        <div
          style={{
            marginTop: 50,
            opacity: month,
            letterSpacing: `${0.6 - month * 0.42}em`,
            transform: `translateY(${(1 - month) * 20}px)`,
          }}
        >
          <GradientText gradient={GRADIENTS.brand} size={128} shine={shine} style={{letterSpacing: 'inherit'}}>
            {content.month}
          </GradientText>
        </div>

        <div
          style={{
            marginTop: 70,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 62,
            color: 'white',
            opacity: dep,
            transform: `translateY(${(1 - dep) * 30}px)`,
            textShadow: '0 6px 22px rgba(0,0,0,0.45)',
          }}
        >
          <PinIcon size={64} color={COLORS.coral} />
          {content.departure}
        </div>

        {/* trajet animé Toamasina → Akanin'ny Nofy */}
        <svg width={1080} height={240} viewBox="0 0 1080 240" style={{marginTop: 40, opacity: dep, overflow: 'visible'}}>
          <path d={path} stroke="rgba(255,255,255,0.25)" strokeWidth={8} fill="none" strokeDasharray="4 18" strokeLinecap="round" />
          <path
            d={path}
            stroke={COLORS.gold}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - route}
          />
          <circle cx={150} cy={120} r={16} fill={COLORS.coral} stroke="white" strokeWidth={5} />
          <circle cx={930} cy={90} r={16 * tw(route, 0.85, 1, 0, 1, EASE_OUT)} fill={COLORS.turquoise} stroke="white" strokeWidth={5} />
          <text x={150} y={190} textAnchor="middle" fill="white" style={{fontFamily: HAND, fontWeight: 700, fontSize: 44}}>
            {content.routeFrom}
          </text>
          <text
            x={930}
            y={160}
            textAnchor="end"
            fill="white"
            opacity={tw(route, 0.8, 1, 0, 1)}
            style={{fontFamily: HAND, fontWeight: 700, fontSize: 44}}
          >
            {content.routeTo}
          </text>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
