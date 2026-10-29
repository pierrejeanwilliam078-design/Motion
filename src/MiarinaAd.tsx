import "@fontsource-variable/inter";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Html5Audio, Sequence, staticFile } from "remotion";
import { Background } from "./components/brand";
import { hasFile } from "./components/core";
import { OVERLAP } from "./components/SceneShell";
import { Subtitles } from "./components/Subtitles";
import { AUDIO, MIX } from "./config/assets";
import captions from "./data/captions.json";
import timeline from "./data/timeline.json";
import { S1Hook } from "./scenes/S1Hook";
import { S2Reveal } from "./scenes/S2Reveal";
import { S3Browser } from "./scenes/S3Browser";
import { S4Paste } from "./scenes/S4Paste";
import { S5Format } from "./scenes/S5Format";
import { S6Downloads } from "./scenes/S6Downloads";
import { S7Library } from "./scenes/S7Library";
import { S8Free } from "./scenes/S8Free";
import { S9EndCard } from "./scenes/S9EndCard";
import { sec, vo } from "./theme";

export type AdProps = { subtitles: boolean };

const SCENES: Record<string, React.FC> = {
  "s1-hook": S1Hook,
  "s2-revelation": S2Reveal,
  "s3-navigateur": S3Browser,
  "s4-lien": S4Paste,
  "s5-format": S5Format,
  "s6-telechargement": S6Downloads,
  "s7-bibliotheque": S7Library,
  "s8-gratuit": S8Free,
  "s9-endcard": S9EndCard,
};

/** Attend le chargement des polices locales avant de rendre la moindre image. */
const useFonts = () => {
  const [handle] = useState(() => delayRender("Chargement des polices"));
  useEffect(() => {
    const faces = ['800 100px "Inter Variable"', '600 40px "Inter Variable"', '400 20px "JetBrains Mono"', '500 20px "JetBrains Mono"'];
    Promise.all(faces.map((f) => document.fonts.load(f)))
      .catch(() => undefined) // repli : polices système
      .then(() => continueRender(handle));
  }, [handle]);
};

/** Intervalles de parole (frames) pour baisser la musique sous la voix. */
const speech = captions.lines.map((l) => [vo(l.start) - 4, vo(l.end) + 6] as const);
const musicVolume = (f: number) => {
  const ramp = 8;
  let d = Infinity;
  for (const [a, b] of speech) {
    if (f >= a && f <= b) {
      d = 0;
      break;
    }
    d = Math.min(d, f < a ? a - f : f - b);
  }
  const k = Math.min(1, d / ramp);
  let vol = MIX.musicUnderVoice + (MIX.musicAlone - MIX.musicUnderVoice) * k;
  // Montée après le mot-clé « gratuit » et sur l'end card.
  const drop = sec(timeline.music.drop);
  if (f >= drop && f < drop + 20) vol = Math.max(vol, MIX.musicAlone);
  return vol;
};

const AudioLayer: React.FC = () => (
  <>
    {hasFile(AUDIO.music) && <Html5Audio src={staticFile(AUDIO.music)} volume={musicVolume} />}
    {hasFile(AUDIO.voiceover) && (
      <Sequence from={sec(timeline.voiceover.offsetSeconds)} name="Voix off" layout="none">
        <Html5Audio src={staticFile(AUDIO.voiceover)} volume={MIX.voice} />
      </Sequence>
    )}
    {timeline.sfx.map((s, i) => {
      const path = `${AUDIO.sfxDir}/${s.file}.wav`;
      if (!hasFile(path)) return null;
      return (
        <Sequence key={i} from={sec(s.at)} durationInFrames={sec(3)} name={`SFX ${s.file}`} layout="none">
          <Html5Audio src={staticFile(path)} volume={s.volume * MIX.sfx} />
        </Sequence>
      );
    })}
  </>
);

export const MiarinaAd: React.FC<AdProps> = ({ subtitles }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: "#0E171F" }}>
      <Background />
      {timeline.scenes.map((s) => {
        const Scene = SCENES[s.id];
        const from = sec(s.start);
        return (
          <Sequence key={s.id} from={from} durationInFrames={sec(s.end) - from + OVERLAP} name={`${s.id} · ${s.title}`}>
            <Scene />
          </Sequence>
        );
      })}
      {subtitles && <Subtitles />}
      <AudioLayer />
    </AbsoluteFill>
  );
};
