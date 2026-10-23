import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Composition, continueRender, delayRender, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Ad } from '../Ad';
import { Ad2 } from '../v2/Ad2';
import { DEFAULT_ASSETS, DEFAULT_CONTENT } from '../defaults';
import { duckLevel } from '../audio/soundtrack';
import { loadFonts } from '../fonts';
import { VIDEO } from '../timeline';
import type { Assets, Content } from '../scenes/types';

type Props = { content: Content; assets: Assets; version?: 1 | 2 };

/** Cherche un fichier audio facultatif dans public/audio (voix off, musique de remplacement). */
const findAudio = (base: string) =>
  getStaticFiles().find((f) => new RegExp(`^audio/${base}\\.(wav|mp3|m4a|aac|ogg)$`, 'i').test(f.name))?.name ?? null;

const DigitalSubAd: React.FC<Props> = ({ content, assets, version = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender('Chargement des polices'));
  useEffect(() => {
    loadFonts().then(() => continueRender(handle), () => continueRender(handle));
  }, [handle]);

  const dir = version === 2 ? 'audio/v2' : 'audio';
  const voice = findAudio('voiceover');
  const customMusic = findAudio('music-custom');
  const Comp = version === 2 ? Ad2 : Ad;
  const cues = voice ? content.voiceover : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: '#F5F7FF' }}>
      <Comp t={frame / fps} content={content} assets={assets} />
      {/* Musique : stem synthétisé (npm run audio) ou fichier de remplacement, avec ducking sous la voix */}
      <Audio src={staticFile(customMusic ?? `${dir}/music.wav`)} volume={(f) => duckLevel(f / fps, cues)} />
      <Audio src={staticFile(`${dir}/sfx.wav`)} />
      {voice && <Audio src={staticFile(voice)} />}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="DigitalSubAd"
      component={DigitalSubAd}
      durationInFrames={VIDEO.duration * VIDEO.fps}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{ content: DEFAULT_CONTENT, assets: DEFAULT_ASSETS, version: 1 as const }}
    />
    <Composition
      id="DigitalSubAdV2"
      component={DigitalSubAd}
      durationInFrames={VIDEO.duration * VIDEO.fps}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{ content: DEFAULT_CONTENT, assets: DEFAULT_ASSETS, version: 2 as const }}
    />
  </>
);
