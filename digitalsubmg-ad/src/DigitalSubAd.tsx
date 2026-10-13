import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Music, SoundEffects, VoiceOver } from "./components/SoundEffects";
import { C } from "./lib/theme";
import { B, DURATION } from "./lib/timing";
import { S01Hook } from "./scenes/S01Hook";
import { S02Reveal } from "./scenes/S02Reveal";
import { S03Products } from "./scenes/S03Products";
import { S04OneClick } from "./scenes/S04OneClick";
import { S05Payment } from "./scenes/S05Payment";
import { S06Trust } from "./scenes/S06Trust";
import { S07Proof } from "./scenes/S07Proof";
import { S08Final } from "./scenes/S08Final";

// Scene windows overlap: every scene enters through its own mask on top of
// the previous one, so the end of a scene becomes the start of the next.
const TRACK: { name: string; from: number; to: number; C: React.FC<{ offset: number }> }[] = [
  { name: "01 · Hook", from: 0, to: B(6) + 20, C: S01Hook },
  { name: "02 · DigitalSubMG reveal", from: B(5.75) - 6, to: B(11) + 14, C: S02Reveal },
  { name: "03 · Product showcase", from: B(10.6), to: B(22) + 24, C: S03Products },
  { name: "04 · One click", from: B(21.5), to: B(30) + 16, C: S04OneClick },
  { name: "05 · Payment", from: B(29.5), to: B(41.3), C: S05Payment },
  { name: "06 · Speed & trust", from: B(40.6), to: B(49) + 4, C: S06Trust },
  { name: "07 · Social proof", from: B(48.3), to: B(53) + 4, C: S07Proof },
  { name: "08 · Final brand reveal", from: B(52.6), to: DURATION, C: S08Final },
];

export const DigitalSubAd: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.black }}>
    {TRACK.map(({ name, from, to, C: Scene }) => (
      <Sequence key={name} name={name} from={from} durationInFrames={to - from}>
        <Scene offset={from} />
      </Sequence>
    ))}
    <Music />
    <VoiceOver />
    <SoundEffects />
  </AbsoluteFill>
);
