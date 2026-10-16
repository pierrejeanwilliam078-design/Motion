import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile} from 'remotion';
import {CONTENT, PHOTOS} from '../../config';
import {DroneBackground} from '../../components/DroneBackground';
import {SERIF} from '../../fonts';
import {EASE_OUT, sp, tw, useSceneTime} from '../../lib/anim';
import {Flash, FullPhoto, Highlight, Line} from '../parts';
import {PALETTE, V2_CUES, V2_SCENES} from '../timeline';

const S = V2_SCENES.experiences;
const C = V2_CUES;

/** Coins de viseur (moment « shooting photo »). */
const Viewfinder: React.FC<{o: number}> = ({o}) => {
  const c = (pos: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    width: 80,
    height: 80,
    borderColor: 'rgba(255,255,255,0.9)',
    borderStyle: 'solid',
    borderWidth: 0,
    ...pos,
  });
  const inset = 70 + (1 - o) * 30;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={c({left: inset, top: inset + 100, borderTopWidth: 5, borderLeftWidth: 5})} />
      <div style={c({right: inset, top: inset + 100, borderTopWidth: 5, borderRightWidth: 5})} />
      <div style={c({left: inset, bottom: inset + 330, borderBottomWidth: 5, borderLeftWidth: 5})} />
      <div style={c({right: inset, bottom: inset + 330, borderBottomWidth: 5, borderRightWidth: 5})} />
    </AbsoluteFill>
  );
};

/** Mosaïque 2×2 des 4 photos (moment « GOOD VIBES »). */
const GRID = [
  {photo: PHOTOS.shooting, focus: 0.46},
  {photo: PHOTOS.nature, focus: 0.5},
  {photo: PHOTOS.plage, focus: 0.7},
  {photo: PHOTOS.soiree, focus: 0.42},
];

export const ExperiencesV2: React.FC<{content: typeof CONTENT}> = ({content}) => {
  const {t, fps} = useSceneTime(S.in);
  const [wShoot, wSunset, wVibes] = content.experiences;
  const imagine = tw(t, C.imagine, C.imagine + 0.5, 0, 1, EASE_OUT);
  const gap = 12;
  const tileW = (1080 - gap * 3) / 2;
  const tileH = (1920 - gap * 3) / 2;

  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.ink}}>
      {/* 1. « Imaginez… » sur un gros plan drone */}
      {t < C.plage ? (
        <AbsoluteFill>
          <DroneBackground duration={C.plage - S.in + 0.1} trimStart={9} rate={1} pan={[0.45, 0.55]} zoom={[1.7, 1.45]} filter="saturate(0.9)" />
          <AbsoluteFill style={{backgroundColor: 'rgba(14,26,38,0.35)'}} />
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <div
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 150,
                color: PALETTE.white,
                opacity: imagine,
                transform: `translateY(${(1 - imagine) * 40}px)`,
                letterSpacing: `${(1 - imagine) * 0.1}em`,
                textShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              {content.imagine}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}

      {/* 2. la plage */}
      <FullPhoto src={PHOTOS.plage.src} t={t} start={C.plage} end={C.shooting} focus={0.68} dir={1} />

      {/* 3. shooting photo */}
      <FullPhoto src={PHOTOS.shooting.src} t={t} start={C.shooting} end={C.sunset} focus={0.46} dir={-1} dim={0.45} />
      {t >= C.shooting && t < C.sunset ? (
        <>
          <Viewfinder o={tw(t, C.shooting + 0.1, C.shooting + 0.4, 0, 1)} />
          <div style={{position: 'absolute', left: 80, bottom: 380}}>
            <Highlight t={t} start={C.shooting + 0.15} size={150} bg={PALETTE.ink} color={PALETTE.white}>
              {wShoot.split(' ')[0]}
            </Highlight>
            <br />
            <Highlight t={t} start={C.shooting + 0.35} size={130}>
              {wShoot.split(' ').slice(1).join(' ')}
            </Highlight>
          </div>
          <Flash t={t} at={C.shooting} />
        </>
      ) : null}

      {/* 4. sunset : plan drone, étalonnage chaud discret */}
      {t >= C.sunset && t < C.soiree ? (
        <Sequence from={Math.round((C.sunset - S.in) * fps)} layout="none">
          <DroneBackground duration={C.soiree - C.sunset} trimStart={12} rate={0.9} pan={[0.62, 0.5]} zoom={[1.5, 1.25]} filter="saturate(0.85) sepia(0.25)" />
          <AbsoluteFill
            style={{
              background: 'linear-gradient(180deg, rgba(238,123,87,0.35) 0%, rgba(14,26,38,0.15) 50%, rgba(14,26,38,0.65) 100%)',
              mixBlendMode: 'multiply',
            }}
          />
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <div style={{transform: `scale(${1.15 - sp(t, C.sunset + 0.05, fps, {damping: 16, stiffness: 160}) * 0.15})`}}>
              <Line t={t} start={C.sunset + 0.05} size={330} duration={0.45}>
                {wSunset}
              </Line>
            </div>
          </AbsoluteFill>
        </Sequence>
      ) : null}

      {/* 5. la soirée */}
      <FullPhoto src={PHOTOS.soiree.src} t={t} start={C.soiree} end={C.goodVibes} focus={0.42} dir={1} />

      {/* 6. GOOD VIBES : mosaïque des 4 photos */}
      {t >= C.goodVibes ? (
        <AbsoluteFill>
          {GRID.map((g, i) => {
            const s = sp(t, C.goodVibes + i * 0.07, fps, {damping: 18, stiffness: 200, mass: 0.6});
            const x = gap + (i % 2) * (tileW + gap);
            const y = gap + Math.floor(i / 2) * (tileH + gap);
            return (
              <div
                key={g.photo.src}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: tileW,
                  height: tileH,
                  overflow: 'hidden',
                  borderRadius: 18,
                  opacity: Math.min(1, s * 2),
                  transform: `scale(${0.85 + s * 0.15})`,
                }}
              >
                <Img
                  src={staticFile(g.photo.src)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${g.focus * 100}% 50%`,
                    transform: `scale(${1.25 - s * 0.2 + tw(t, C.goodVibes, S.out, 0, 0.06, (n) => n)})`,
                    filter: 'saturate(0.92)',
                  }}
                />
              </div>
            );
          })}
          <AbsoluteFill style={{backgroundColor: 'rgba(14,26,38,0.3)'}} />
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <Highlight t={t} start={C.goodVibes + 0.3} size={190}>
              {wVibes}
            </Highlight>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
