import React from "react";
import { useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/brand";
import { useLayout } from "../components/core";
import { CheckIcon, FilmIcon, VideoFileIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { C, EASE, FONT, hash, keys, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s5-format");
const at = (t: number) => vo(t) - S.from;

const Bars: React.FC<{ w: number; h: number; n?: number; amp?: number; color?: string }> = ({ w, h, n = 9, amp = 1, color = C.teal }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {Array.from({ length: n }).map((_, i) => {
        const k = 0.3 + 0.7 * Math.abs(Math.sin(frame / (3 + hash(i) * 2.5) + hash(i + 4) * 5));
        const env = 1 - Math.abs(i - (n - 1) / 2) / n;
        const bh = Math.max(w * 0.05, h * amp * k * env);
        const bw = (w / n) * 0.56;
        return (
          <div
            key={i}
            style={{ position: "absolute", left: (i * w) / n + (w / n - bw) / 2, top: (h - bh) / 2, width: bw, height: bh, borderRadius: 99, background: color }}
          />
        );
      })}
    </div>
  );
};

const FormatCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  inAt: number;
  activeAt: number;
  label: string;
  sub: string;
  pill: string;
  icon: React.ReactNode;
  fromX: number;
}> = ({ x, y, w, h, inAt, activeAt, label, sub, pill, icon, fromX }) => {
  const frame = useCurrentFrame();
  const p = tween(frame, inAt, inAt + 16, [0, 1], EASE.out);
  const a = tween(frame, activeAt, activeAt + 10, [0, 1], EASE.out);
  const check = tween(frame, activeAt + 6, activeAt + 16, [0, 1], EASE.out);
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2 + (1 - p) * fromX,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: 28,
        background: `linear-gradient(160deg, ${C.bg2}, #111e27)`,
        border: `2px solid ${a > 0.5 ? C.teal : "rgba(148,169,184,0.16)"}`,
        boxShadow: `0 30px 70px rgba(0,0,0,0.45), 0 0 ${60 * a}px rgba(45,198,190,${0.45 * a})`,
        opacity: p,
        transform: `scale(${0.96 + 0.04 * p + 0.03 * a})`,
        fontFamily: FONT.sans,
      }}
    >
      <div style={{ position: "absolute", left: 40, top: 38, opacity: 0.6 + 0.4 * a }}>{icon}</div>
      <div
        style={{
          position: "absolute",
          right: 32,
          top: 34,
          width: 54,
          height: 54,
          borderRadius: 99,
          background: C.teal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${check})`,
          boxShadow: "0 0 24px rgba(45,198,190,0.6)",
        }}
      >
        <CheckIcon size={30} color={C.bg} stroke={3} />
      </div>
      <div style={{ position: "absolute", left: 40, bottom: 84, fontSize: 64, fontWeight: 800, letterSpacing: "-0.03em", color: C.white }}>{label}</div>
      <div style={{ position: "absolute", left: 42, bottom: 42, fontSize: 26, fontWeight: 500, color: C.muted, display: "flex", gap: 14, alignItems: "center" }}>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 20,
            color: a > 0.5 ? C.bg : C.teal,
            background: a > 0.5 ? C.teal : "rgba(45,198,190,0.1)",
            border: "1px solid rgba(45,198,190,0.4)",
            padding: "3px 12px",
            borderRadius: 99,
          }}
        >
          {pill}
        </span>
        {sub}
      </div>
    </div>
  );
};

export const S5Format: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();

  const videoAt = at(20.06);
  const audioAt = at(21.44);
  const cardsIn = at(19.4);

  // Fichier vidéo central qui se transforme en onde sonore.
  const iconIn = tween(frame, 6, 22, [0, 1], EASE.out);
  const morph = tween(frame, audioAt - 4, audioAt + 10, [0, 1], EASE.inOut);
  const toVideo = tween(frame, videoAt - 2, videoAt + 8) * (1 - tween(frame, audioAt - 10, audioAt - 2));
  const iconSize = v ? 210 : 190;
  const cardW = v ? 820 : 600;
  const cardH = v ? 300 : 360;
  const leftC = v ? { x: W / 2, y: H * 0.52 } : { x: W / 2 - 440, y: H * 0.6 };
  const rightC = v ? { x: W / 2, y: H * 0.685 } : { x: W / 2 + 440, y: H * 0.6 };
  const iconC = v ? { x: W / 2, y: H * 0.335 } : { x: W / 2, y: H * 0.6 };
  const tilt = keys(toVideo, [0, 1], [0, v ? 0 : -10]);
  const nudge = keys(toVideo, [0, 1], [0, v ? 0 : -12]);
  const nudgeY = v ? keys(toVideo, [0, 1], [0, 30]) + keys(morph, [0, 1], [0, 60]) : 0;
  const morphX = v ? 0 : keys(morph, [0, 1], [0, 40]);
  const float = Math.sin(frame / 9) * 8;

  const title = [
    { text: "VIDÉO", at: 6 },
    { text: "OU", at: 12 },
    { text: "MP3", at: 18, accent: true },
  ];

  return (
    <SceneShell duration={S.duration}>
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? H * 0.13 : 70, display: "flex", justifyContent: "center" }}>
        <KineticTitle words={title} size={v ? 130 : 104} />
      </div>
      <FormatCard
        x={leftC.x}
        y={leftC.y}
        w={cardW}
        h={cardH}
        inAt={cardsIn}
        activeAt={videoAt}
        label="VIDÉO"
        pill="HD"
        sub="Haute qualité"
        fromX={v ? 0 : -160}
        icon={<FilmIcon size={v ? 70 : 84} color={C.teal} stroke={1.6} />}
      />
      <FormatCard
        x={rightC.x}
        y={rightC.y}
        w={cardW}
        h={cardH}
        inAt={cardsIn + 4}
        activeAt={audioAt + 4}
        label="AUDIO"
        pill="MP3"
        sub="Extraction audio"
        fromX={v ? 0 : 160}
        icon={<Bars w={v ? 80 : 96} h={v ? 70 : 84} n={7} amp={0.95} />}
      />
      {/* Icône centrale : fichier vidéo → onde sonore */}
      <div
        style={{
          position: "absolute",
          left: iconC.x - iconSize / 2 + nudge + morphX,
          top: iconC.y - iconSize / 2 + float + nudgeY,
          width: iconSize,
          height: iconSize,
          opacity: iconIn,
          transform: `scale(${(0.7 + 0.3 * iconIn) * (v ? 1 : 0.92)}) rotate(${tilt}deg)`,
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 42,
            background: "radial-gradient(circle, rgba(45,198,190,0.35), transparent 70%)",
            transform: `scale(${1.3 + 0.1 * Math.sin(frame / 5)})`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, opacity: 1 - morph, transform: `scale(${1 - 0.3 * morph})` }}>
          <VideoFileIcon size={iconSize} color={C.white} stroke={1.4} />
        </div>
        <div
          style={{
            position: "absolute",
            left: iconSize * 0.1,
            top: iconSize * 0.2,
            opacity: morph,
            transform: `scale(${0.5 + 0.5 * morph})`,
          }}
        >
          <Bars w={iconSize * 0.8} h={iconSize * 0.6} n={9} amp={1} color={C.teal} />
        </div>
      </div>
    </SceneShell>
  );
};
