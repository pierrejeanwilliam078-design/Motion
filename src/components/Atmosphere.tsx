import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {HEIGHT, WIDTH} from '../config';
import {rand, tw} from '../lib/anim';

/** Poussières de soleil / bokeh qui flottent doucement vers le haut. */
export const SunParticles: React.FC<{count?: number; opacity?: number}> = ({count = 34, opacity = 1}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity}}>
      {new Array(count).fill(0).map((_, i) => {
        const size = 4 + rand(i) * (i % 5 === 0 ? 34 : 12);
        const speed = 18 + rand(i + 100) * 50;
        const x = rand(i + 200) * WIDTH + Math.sin(t * 0.6 + i) * 22;
        const y = (((rand(i + 300) * (HEIGHT + 200) - t * speed) % (HEIGHT + 200)) + HEIGHT + 200) % (HEIGHT + 200) - 100;
        const flicker = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + rand(i + 400)) + i));
        const warm = rand(i + 500) > 0.4;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: warm
                ? 'radial-gradient(circle, rgba(255,236,190,0.95) 0%, rgba(255,190,110,0.35) 45%, rgba(255,160,80,0) 70%)'
                : 'radial-gradient(circle, rgba(220,255,250,0.9) 0%, rgba(120,240,230,0.3) 45%, rgba(0,0,0,0) 70%)',
              opacity: flicker * (size > 20 ? 0.45 : 0.85),
              filter: size > 20 ? 'blur(3px)' : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Fuites de lumière (light leaks) chaudes qui dérivent lentement. */
export const LightLeaks: React.FC<{intensity?: number; palette?: 'sunset' | 'ocean'}> = ({
  intensity = 0.5,
  palette = 'sunset',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const c1 = palette === 'sunset' ? 'rgba(255,140,60,0.85)' : 'rgba(25,211,197,0.8)';
  const c2 = palette === 'sunset' ? 'rgba(123,47,247,0.7)' : 'rgba(58,160,255,0.7)';
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: intensity, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          width: 1400,
          height: 1400,
          left: -500 + Math.sin(t * 0.35) * 160,
          top: -450 + Math.cos(t * 0.3) * 120,
          background: `radial-gradient(circle, ${c1} 0%, rgba(0,0,0,0) 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          right: -600 + Math.cos(t * 0.28) * 150,
          bottom: -450 + Math.sin(t * 0.33) * 140,
          background: `radial-gradient(circle, ${c2} 0%, rgba(0,0,0,0) 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Grain de film léger + vignettage pour un rendu cinéma. */
export const FilmFinish: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', opacity: 0.07, mixBlendMode: 'overlay'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,10,30,0.55) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Flash blanc type appareil photo (pics d'opacité aux instants donnés). */
export const CameraFlashes: React.FC<{times: number[]}> = ({times}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const o = Math.max(
    0,
    ...times.map((ft) => (t < ft ? tw(t, ft - 0.08, ft, 0, 1) : tw(t, ft, ft + 0.45, 1, 0))),
  );
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{backgroundColor: '#FFF8EE', opacity: o * 0.92, pointerEvents: 'none'}} />;
};
