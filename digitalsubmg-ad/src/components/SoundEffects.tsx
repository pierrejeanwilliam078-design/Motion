import React from "react";
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import voice from "../data/voice-cues.json";
import { B, DURATION, S } from "../lib/timing";

type Sfx =
  | "sub_boom" | "bass_drop" | "logo_impact" | "deep_impact" | "punch" | "riser"
  | "whoosh" | "whoosh_rev" | "whoosh_short" | "pop" | "click" | "confirm" | "chime"
  | "shimmer" | "swipe" | "ascend" | "reverse" | "payment_ok";

type Cue = { at: number; sfx: Sfx; vol: number; label: string };

// Each important motion has a sound intention. `at` is a frame.
export const SFX_CUES: Cue[] = [
  // S1 hook
  { at: 0, sfx: "sub_boom", vol: 0.55, label: "Deep sub impulse" },
  { at: 2, sfx: "whoosh_short", vol: 0.35, label: "Light line sweep" },
  { at: B(2), sfx: "whoosh", vol: 0.28, label: "PREMIUM rotates" },
  { at: B(4) - 4, sfx: "punch", vol: 0.32, label: "EN" },
  { at: B(4.5) - 4, sfx: "punch", vol: 0.26, label: "UN" },
  { at: B(5) - 4, sfx: "punch", vol: 0.34, label: "CLIC" },
  { at: B(5.75) - 26, sfx: "reverse", vol: 0.3, label: "Cyan pulse swell" },
  // S2 reveal
  { at: B(6), sfx: "whoosh", vol: 0.3, label: "Iris reveal" },
  { at: B(7), sfx: "logo_impact", vol: 0.42, label: "Logo impact" },
  { at: B(7), sfx: "shimmer", vol: 0.3, label: "Synth shimmer" },
  { at: B(10.5), sfx: "whoosh_rev", vol: 0.32, label: "Plate flip" },
  // S3 products — 5 UI pops + spatial whooshes
  ...[11, 13, 15, 17, 19].flatMap((b, i): Cue[] => [
    { at: B(b), sfx: "pop", vol: 0.42, label: `Product ${i + 1} pop` },
    { at: B(b) - 10, sfx: i % 2 ? "whoosh_rev" : "whoosh_short", vol: 0.22, label: `Product ${i + 1} whoosh` },
  ]),
  { at: B(21.4), sfx: "whoosh", vol: 0.3, label: "Vertical exit" },
  // S4 one click
  { at: B(22.3), sfx: "swipe", vol: 0.3, label: "Phone enters" },
  { at: B(24), sfx: "click", vol: 0.32, label: "Select card" },
  { at: B(25), sfx: "click", vol: 0.5, label: "Choisir tap" },
  { at: B(25) + 6, sfx: "confirm", vol: 0.32, label: "Confirmation" },
  { at: B(28.6), sfx: "whoosh", vol: 0.32, label: "Dolly into button" },
  { at: B(29.6), sfx: "bass_drop", vol: 0.3, label: "Button becomes next scene" },
  // S5 payment
  { at: B(32), sfx: "punch", vol: 0.26, label: "ARIARY lock" },
  { at: B(35), sfx: "click", vol: 0.4, label: "MVola" },
  { at: B(36.5), sfx: "click", vol: 0.4, label: "Orange Money" },
  { at: B(38.5), sfx: "click", vol: 0.4, label: "Airtel Money" },
  { at: B(35) - 8, sfx: "swipe", vol: 0.18, label: "Badge swipe" },
  { at: B(39), sfx: "payment_ok", vol: 0.45, label: "Payment validated" },
  // S6 speed & trust
  { at: B(41) - 6, sfx: "whoosh", vol: 0.32, label: "Whip pan" },
  { at: B(42.6), sfx: "whoosh_short", vol: 0.3, label: "RAPIDE crosses" },
  { at: B(45), sfx: "swipe", vol: 0.25, label: "SÉCURISÉ mask" },
  { at: B(46.5), sfx: "pop", vol: 0.3, label: "WhatsApp card" },
  { at: B(47.5), sfx: "chime", vol: 0.32, label: "Notification chime" },
  { at: B(48.4), sfx: "whoosh", vol: 0.28, label: "Card expands" },
  // S7 social proof
  { at: B(49), sfx: "deep_impact", vol: 0.45, label: "500+ impact" },
  { at: B(49), sfx: "ascend", vol: 0.28, label: "Ascending synth" },
  { at: B(51), sfx: "whoosh_short", vol: 0.2, label: "Wave" },
  // S8 final
  { at: B(54), sfx: "logo_impact", vol: 0.38, label: "Logo reveal" },
  { at: B(54), sfx: "shimmer", vol: 0.32, label: "Logo shimmer" },
  { at: B(60), sfx: "bass_drop", vol: 0.35, label: "Final bass hit (URL)" },
];

export const SoundEffects: React.FC = () => (
  <>
    {SFX_CUES.map((c, i) => (
      <Sequence key={i} from={Math.max(0, c.at)} name={`SFX · ${c.label}`} layout="none">
        <Audio src={staticFile(`audio/sfx/${c.sfx}.wav`)} volume={c.vol} />
      </Sequence>
    ))}
  </>
);

export const VoiceOver: React.FC = () => (
  <>
    {voice.cues.map((c) => (
      <Sequence key={c.id} from={S(c.at)} name={`VO · ${c.text}`} layout="none">
        <Audio src={staticFile(`audio/vo/${c.id}.wav`)} volume={1} />
      </Sequence>
    ))}
  </>
);

// Voice intervals (frames) used to duck the music under each phrase.
const VOICE_SPANS = voice.cues.map((c) => [S(c.at), S(c.at + (c.srcOut - c.srcIn))] as const);

const duckAt = (frame: number) => {
  let d = 0;
  for (const [a, b] of VOICE_SPANS) {
    // 120 ms attack before the phrase, 250 ms release after it
    const v = interpolate(frame, [a - 7, a, b, b + 15], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    d = Math.max(d, v);
  }
  return d;
};

export const Music: React.FC = () => (
  <Audio
    src={staticFile("audio/music.wav")}
    name="Music · original 128 BPM"
    volume={(f) => {
      const base = 0.62;
      const ducked = 0.24; // ≈ -8 dB under the voice
      const end = interpolate(f, [DURATION - 20, DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (base + (ducked - base) * duckAt(f)) * end;
    }}
  />
);
