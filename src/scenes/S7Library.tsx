import React from "react";
import { useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/brand";
import { camera, CaptureView, Spot, TopScrim, useLayout } from "../components/core";
import { AudioFileIcon, PlayIcon, VideoFileIcon, WifiOffIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { HOME } from "../config/assets";
import { C, EASE, FONT, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s7-bibliotheque");
const at = (t: number) => vo(t) - S.from;

const Chip: React.FC<{ at: number; icon: React.ReactNode; label: string; accent?: boolean; size: number }> = ({ at: a, icon, label, accent, size }) => {
  const frame = useCurrentFrame();
  const p = tween(frame, a, a + 12, [0, 1], EASE.out);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.5,
        padding: `${size * 0.36}px ${size * 0.6}px ${size * 0.36}px ${size * 0.36}px`,
        borderRadius: size * 0.5,
        background: accent ? "rgba(45,198,190,0.12)" : "rgba(23,40,51,0.9)",
        border: `1.5px solid ${accent ? C.teal : "rgba(148,169,184,0.18)"}`,
        boxShadow: accent ? `0 0 40px rgba(45,198,190,${0.35 * p})` : "0 16px 40px rgba(0,0,0,0.35)",
        opacity: p,
        transform: `translateX(${(1 - p) * 60}px) scale(${0.9 + 0.1 * p})`,
        fontFamily: FONT.sans,
        fontWeight: 700,
        fontSize: size * 0.62,
        color: C.white,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: size * 0.4,
          background: accent ? C.teal : "rgba(45,198,190,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      {label}
    </div>
  );
};

export const S7Library: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();
  const sp = HOME.spots;

  const filesAt = at(30.14);
  const libAt = at(30.84);
  const playAt = at(31.8);
  const offlineAt = at(32.74);

  const full = { x: 0, y: 0, w: HOME.width, h: HOME.height };
  const cardFrame = { x: sp.library.x - 10, y: sp.library.y - 10, w: sp.library.w + 20, h: sp.library.h + 20 };
  const cam = camera(frame, [
    { f: 0, r: full, w: v ? 1000 : 1180, cx: W / 2, cy: H * 0.55 },
    { f: 8, r: full, w: v ? 1000 : 1180, cx: W / 2, cy: H * 0.55 },
    { f: 34, r: cardFrame, w: v ? 560 : 640, cx: v ? W / 2 : W / 2 - 330, cy: v ? H * 0.4 : H * 0.57 },
    { f: S.duration, r: cardFrame, w: v ? 580 : 660, cx: v ? W / 2 : W / 2 - 330, cy: v ? H * 0.4 : H * 0.57 },
  ]);

  const playP = tween(frame, playAt, playAt + 12, [0, 1], EASE.out);
  const chipSize = v ? 44 : 40;
  const title = [
    { text: "VOS", at: 4 },
    { text: "MÉDIAS.", at: 8 },
    { text: "PARTOUT.", at: 14, accent: true, br: v },
  ];

  return (
    <SceneShell duration={S.duration}>
      <CaptureView capture={HOME} cam={cam} glow={0.5}>
        <Spot r={sp.library} at={libAt - 4} radius={12} pad={2} fill={0.02} />
        <Spot r={sp.libraryVideoRow} at={filesAt + 6} until={filesAt + 40} radius={6} pad={4} />
        <Spot r={sp.libraryAudioRow} at={filesAt + 14} until={filesAt + 48} radius={6} pad={4} />
        {/* Symbole de lecture au centre de la bibliothèque */}
        <div
          style={{
            position: "absolute",
            left: sp.library.x + sp.library.w - 96,
            top: sp.library.y + 48,
            width: 68,
            height: 68,
            borderRadius: 99,
            background: C.teal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: playP,
            transform: `scale(${0.4 + 0.6 * playP + 0.04 * Math.sin(frame / 6) * playP})`,
            boxShadow: `0 0 0 ${10 * playP}px rgba(45,198,190,0.18), 0 0 40px rgba(45,198,190,0.7)`,
          }}
        >
          <PlayIcon size={32} color={C.bg} style={{ marginLeft: 4 }} />
        </div>
      </CaptureView>
      <div
        style={{
          position: "absolute",
          left: v ? 0 : W / 2 + 90,
          right: v ? 0 : undefined,
          top: v ? H * 0.565 : H * 0.36,
          display: "flex",
          flexDirection: "column",
          alignItems: v ? "center" : "flex-start",
          gap: v ? 22 : 26,
        }}
      >
        <Chip at={filesAt} size={chipSize} label="Vidéos" icon={<VideoFileIcon size={chipSize * 0.9} color={C.teal} stroke={1.8} />} />
        <Chip at={filesAt + 8} size={chipSize} label="Audio" icon={<AudioFileIcon size={chipSize * 0.9} color={C.teal} stroke={1.8} />} />
        <Chip at={playAt} size={chipSize} label="Lecture intégrée" icon={<PlayIcon size={chipSize * 0.8} color={C.teal} />} />
        <Chip at={offlineAt} size={chipSize} accent label="Hors connexion" icon={<WifiOffIcon size={chipSize * 0.9} color={C.bg} stroke={2.2} />} />
      </div>
      <TopScrim />
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? H * 0.12 : 60, display: "flex", justifyContent: "center" }}>
        <KineticTitle words={title} size={v ? 112 : 80} />
      </div>
    </SceneShell>
  );
};
