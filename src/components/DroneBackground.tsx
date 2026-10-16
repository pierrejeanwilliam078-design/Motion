import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DRONE, HEIGHT, WIDTH} from '../config';
import {EASE_IN_OUT, tw} from '../lib/anim';

const SRC_RATIO = 1920 / 1080;
const VIDEO_W = HEIGHT * SRC_RATIO; // vidéo 16:9 recadrée en 9:16

/**
 * Vidéo drone recadrée en vertical, avec mouvement de caméra 2.5D :
 * panoramique horizontal + zoom progressif (dolly).
 * pan = position horizontale du centre de cadrage (0 = gauche, 1 = droite).
 */
export const DroneBackground: React.FC<{
  duration: number;
  trimStart?: number;
  rate?: number;
  pan?: [number, number];
  zoom?: [number, number];
  blur?: number;
  filter?: string;
}> = ({duration, trimStart = 0, rate = 0.8, pan = [0.4, 0.5], zoom = [1.1, 1.2], blur = 0, filter = ''}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const p = tw(t, 0, duration, 0, 1, EASE_IN_OUT);
  const scale = zoom[0] + (zoom[1] - zoom[0]) * p;
  const center = pan[0] + (pan[1] - pan[0]) * p;
  const minX = WIDTH - VIDEO_W;
  const x = Math.min(0, Math.max(minX, WIDTH / 2 - center * VIDEO_W));

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#06244A'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: VIDEO_W,
          height: HEIGHT,
          transform: `translateX(${x}px) scale(${scale})`,
          transformOrigin: `${-x + WIDTH / 2}px 50%`,
        }}
      >
        <OffthreadVideo
          src={staticFile(DRONE)}
          muted
          playbackRate={rate}
          trimBefore={Math.round(trimStart * fps)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `${blur ? `blur(${blur}px)` : ''} saturate(1.15) contrast(1.05) ${filter}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
