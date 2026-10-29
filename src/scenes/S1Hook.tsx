import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/brand";
import { useLayout } from "../components/core";
import { PlayIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { C, EASE, hash, keys, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s1-hook");
const at = (t: number) => vo(t) - S.from;

/** Onde sonore : barres verticales animées de façon déterministe. */
const Wave: React.FC<{ width: number; height: number; amp: number; bars?: number; gap?: number; color?: string }> = ({
  width,
  height,
  amp,
  bars = 46,
  gap = 0.45,
  color,
}) => {
  const frame = useCurrentFrame();
  const bw = width / bars;
  return (
    <div style={{ position: "relative", width, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const centre = 1 - Math.abs(i - (bars - 1) / 2) / (bars / 2);
        const n = 0.35 + 0.65 * Math.abs(Math.sin(frame / (3.2 + hash(i) * 3) + hash(i + 9) * 6));
        const h = Math.max(6, height * amp * n * (0.25 + 0.75 * centre ** 0.7));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * bw + (bw * gap) / 2,
              top: (height - h) / 2,
              width: bw * (1 - gap),
              height: h,
              borderRadius: 99,
              background: color ?? `linear-gradient(180deg, ${C.teal}, rgba(45,198,190,0.35))`,
              opacity: color ? 1 : 0.35 + 0.65 * centre,
            }}
          />
        );
      })}
    </div>
  );
};

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();

  // Punch d'ouverture : zoom dynamique + aberration chromatique qui retombe.
  const punch = tween(frame, 0, 14, [0, 1], EASE.out);
  const groupScale = 2.1 - 1.1 * punch;
  const swap = at(1.5); // « Un son à écouter partout ? »
  const glitch = Math.max(0, 1 - Math.abs(frame - swap) / 6);
  const split = 14 * (1 - punch) + 10 * glitch;

  // Icône Play : rebond + légère rotation, puis s'efface au profit de l'onde.
  const playIn = tween(frame, 2, 16, [0, 1], EASE.out);
  const toSound = tween(frame, swap - 4, swap + 10, [0, 1], EASE.inOut);
  const bob = Math.sin(frame / 7) * 6;
  const tile = v ? 230 : 210;
  const tileY = v ? H * 0.33 : H * 0.34;

  // Sortie : on traverse l'icône (zoom) vers la révélation.
  const exitP = tween(frame, S.duration - 12, S.duration + 10, [0, 1], EASE.in);
  const waveAmp = 0.35 + 0.65 * toSound + 0.15 * Math.sin(frame / 4) ** 2;
  const skew = glitch * 8 * Math.sin(frame * 3.1);

  const title1 = [
    { text: "UNE", at: at(0) },
    { text: "VIDÉO", at: at(0.2), accent: true },
    { text: "À", at: at(0.58), br: v },
    { text: "GARDER ?", at: at(0.74) },
  ];
  const title2 = [
    { text: "UN", at: at(1.54) },
    { text: "SON", at: at(1.74), accent: true },
    { text: "À ÉCOUTER", at: at(2.02), br: v },
    { text: "PARTOUT ?", at: at(2.44), br: v },
  ];

  return (
    <SceneShell duration={S.duration} enter="none" exit="zoomThrough">
      <AbsoluteFill style={{ transform: `scale(${groupScale * (1 + exitP * 2.5)}) skewX(${skew}deg)`, opacity: 1 - exitP }}>
        {/* Onde sonore horizontale derrière la tuile */}
        <div
          style={{
            position: "absolute",
            left: (W - (v ? 980 : 1400)) / 2,
            top: tileY - 130,
            opacity: tween(frame, 4, 18) * (0.55 + 0.45 * toSound),
          }}
        >
          <Wave width={v ? 980 : 1400} height={260} amp={waveAmp} bars={v ? 34 : 52} />
        </div>
        {/* Tuile Play */}
        <div
          style={{
            position: "absolute",
            left: W / 2 - tile / 2,
            top: tileY - tile / 2 + bob,
            width: tile,
            height: tile,
            borderRadius: tile * 0.26,
            background: `linear-gradient(145deg, #3ee0d6, ${C.teal} 55%, #1f9e98)`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 ${80 + 40 * glitch}px rgba(45,198,190,0.55), ${-split}px 0 0 rgba(255,60,90,0.55), ${split}px 0 0 rgba(45,230,255,0.55)`,
            transform: `scale(${playIn * (1 - 0.12 * toSound)}) rotate(${(1 - playIn) * -18 + Math.sin(frame / 11) * 3}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ opacity: 1 - toSound, transform: `scale(${1 - 0.4 * toSound}) translateX(${tile * 0.03}px)`, position: "absolute" }}>
            <PlayIcon size={tile * 0.5} color={C.bg} />
          </div>
          <div style={{ opacity: toSound, transform: `scale(${0.6 + 0.4 * toSound})`, position: "absolute" }}>
            <Wave width={tile * 0.56} height={tile * 0.46} amp={0.95} bars={7} gap={0.38} color={C.bg} />
          </div>
        </div>
        {/* Titres */}
        <div style={{ position: "absolute", left: 0, right: 0, top: v ? H * 0.5 : H * 0.6, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 0 }}>
            <KineticTitle words={title1} size={v ? 118 : 112} out={swap - 8} rgbSplit={12} />
          </div>
          <div style={{ position: "absolute", top: 0 }}>
            <KineticTitle words={title2} size={v ? 118 : 112} rgbSplit={12} />
          </div>
        </div>
      </AbsoluteFill>
      {/* Flash lumineux de transition */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${(tileY / H) * 100}%, rgba(45,198,190,0.55), transparent 60%)`,
          opacity: keys(frame, [S.duration - 6, S.duration + 2, S.duration + 12], [0, 1, 0]),
        }}
      />
    </SceneShell>
  );
};
