import React from "react";
import { Composition } from "remotion";
import { MiarinaAd } from "./MiarinaAd";
import { DURATION, FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    {/* Version principale 16:9 avec sous-titres animés */}
    <Composition id="MiarinaAd" component={MiarinaAd} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true }} />
    {/* Version 16:9 sans sous-titres incrustés (à utiliser avec le fichier SRT) */}
    <Composition
      id="MiarinaAd-SansSousTitres"
      component={MiarinaAd}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ subtitles: false }}
    />
    {/* Version verticale 9:16 pour Reels / Shorts / TikTok / Stories */}
    <Composition
      id="MiarinaAd-Vertical"
      component={MiarinaAd}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ subtitles: true }}
    />
  </>
);
