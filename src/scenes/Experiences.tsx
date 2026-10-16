import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CONTENT, CUES, GRADIENTS, PHOTOS, SCENES} from '../config';
import {DroneBackground} from '../components/DroneBackground';
import {Polaroid} from '../components/Polaroid';
import {GradientText} from '../components/Typography';
import {CameraIcon} from '../components/Icons';
import {DISPLAY, SCRIPT} from '../fonts';
import {EASE_IN, sp, tw, useSceneTime} from '../lib/anim';

const S = SCENES.experiences;

/** Disposition du collage : position finale, rotation, profondeur (parallaxe). */
const LAYOUT = [
  {photo: PHOTOS.plage, x: 320, y: 560, rot: -7, w: 560, from: -1, depth: 0.6},
  {photo: PHOTOS.shooting, x: 760, y: 720, rot: 6, w: 560, from: 1, depth: 1},
  {photo: PHOTOS.nature, x: 300, y: 1035, rot: 5, w: 370, from: -1, depth: 0.8},
  {photo: PHOTOS.soiree, x: 755, y: 1110, rot: -5, w: 560, from: 1, depth: 1.2},
];

const WORD_GRADIENTS = [GRADIENTS.ocean, GRADIENTS.sunset, GRADIENTS.vibes];

export const Experiences: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  const visible = t >= 8.66 ? 1 : 0; // apparaît sous le flash photo
  // sortie « whip pan » vers la gauche
  const whip = tw(t, 17.85, 18.2, 0, 1, EASE_IN);
  // coucher de soleil : le ciel se réchauffe au moment de « SUNSET »
  const warm = tw(t, CUES.words[1] - 0.3, CUES.words[1] + 1.5, 0.35, 1);
  const camY = tw(t, S.in, S.out, 110, 40);
  const camScale = tw(t, S.in, S.out, 1.04, 1);
  const imagine = tw(t, CUES.imagine, CUES.imagine + 0.6, 0, 1);

  return (
    <AbsoluteFill style={{opacity: visible}}>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id="whipExp">
          <feGaussianBlur stdDeviation={`${whip * 60} 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: `translateX(${-whip * 1080}px)`, filter: whip > 0 ? 'url(#whipExp)' : undefined}}>
        <DroneBackground duration={S.out - S.in} trimStart={8} rate={0.6} pan={[0.62, 0.5]} zoom={[1.3, 1.15]} blur={10} />
        {/* étalonnage « golden hour » */}
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(74,26,160,0.78) 0%, rgba(160,50,140,0.55) 40%, rgba(255,110,60,0.55) 75%, rgba(255,170,70,0.6) 100%)',
            opacity: 0.55 + warm * 0.45,
          }}
        />
        {/* soleil couchant */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 420,
            top: tw(t, S.in, S.out, 1180, 1320),
            width: 840,
            height: 840,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,214,120,0.95) 0%, rgba(255,140,60,0.55) 35%, rgba(255,90,60,0) 68%)',
            mixBlendMode: 'screen',
            opacity: warm,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 95,
            width: '100%',
            textAlign: 'center',
            fontFamily: SCRIPT,
            fontSize: 84,
            color: 'white',
            opacity: imagine,
            transform: `translateY(${(1 - imagine) * 30}px)`,
            textShadow: '0 6px 24px rgba(0,0,0,0.35)',
          }}
        >
          {content.imagine}
        </div>

        {/* collage de Polaroid */}
        <AbsoluteFill style={{transform: `translateY(${camY}px) scale(${camScale})`}}>
          {LAYOUT.map((p, i) => {
            const start = CUES.polaroids[i];
            const s = sp(t, start, fps, {damping: 15, mass: 0.9, stiffness: 120});
            const develop = tw(t, start + 0.25, start + 1.3, 0, 1);
            const x = p.x + p.from * (1 - s) * 1000;
            const rot = p.rot + p.from * (1 - s) * 28;
            const rotY = p.from * (1 - s) * -40;
            const scale = 1.18 - s * 0.18;
            const parallax = tw(t, start, S.out, 0, -40 * p.depth);
            if (t < start - 0.05) return null;
            return (
              <div
                key={p.photo.src}
                style={{
                  position: 'absolute',
                  left: x,
                  top: p.y + parallax,
                  transform: `translate(-50%,-50%) perspective(1200px) rotateY(${rotY}deg) rotate(${rot}deg) scale(${scale})`,
                }}
              >
                <Polaroid
                  src={p.photo.src}
                  ratio={p.photo.ratio}
                  width={p.w}
                  caption={p.photo.caption}
                  develop={develop}
                  tapeAngle={i % 2 ? 5 : -4}
                />
              </div>
            );
          })}
        </AbsoluteFill>

        {/* mots-clés synchronisés sur la voix off */}
        {content.experiences.map((word, i) => {
          const start = CUES.words[i];
          const end = i < 2 ? CUES.words[i + 1] - 0.05 : 18.4;
          if (t < start || t > end) return null;
          const s = sp(t, start, fps, {damping: 11, mass: 0.7, stiffness: 160});
          const out = i < 2 ? tw(t, end - 0.25, end, 0, 1, EASE_IN) : 0;
          const shine = tw(t, start + 0.3, start + 1.2, 0, 1);
          const size = word.length > 12 ? 92 : word.length > 8 ? 124 : 170;
          return (
            <div
              key={word}
              style={{
                position: 'absolute',
                top: 1390,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `translateY(${(1 - s) * 80 - out * 60}px) scale(${0.6 + s * 0.4})`,
                opacity: Math.min(1, s * 2) * (1 - out),
                filter: `blur(${out * 12}px)`,
              }}
            >
              {i === 0 ? (
                <div style={{marginBottom: 6, transform: `rotate(${(1 - s) * -20}deg)`}}>
                  <CameraIcon size={70} />
                </div>
              ) : null}
              <div
                style={{
                  padding: '6px 26px 12px',
                  borderRadius: 24,
                  background: 'rgba(10,20,50,0.35)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <GradientText gradient={WORD_GRADIENTS[i]} size={size} shine={shine}>
                  {word}
                </GradientText>
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            top: 1640,
            width: '100%',
            textAlign: 'center',
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.85)',
            opacity: tw(t, 9.4, 10, 0, 1),
          }}
        >
          {content.brand}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
