import React from "react";
import { useCurrentFrame } from "remotion";
import { Burst, KineticTitle, Tag } from "../components/brand";
import { camera, CaptureView, Cursor, Patch, Spot, TopScrim, useLayout } from "../components/core";
import { CheckIcon, PlayIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { DOWNLOADS } from "../config/assets";
import { C, EASE, FONT, keys, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s6-telechargement");
const at = (t: number) => vo(t) - S.from;

const ROW_BG = "#182530";

export const S6Downloads: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();
  const sp = DOWNLOADS.spots;

  const startAt = 18;
  const pauseAt = at(26.68);
  const resumeAt = at(27.2);
  const doneAt = at(28.45);

  // Progression illustrative : 0 → 58 %, pause, puis 100 %.
  const progress =
    frame < pauseAt
      ? keys(frame, [startAt, pauseAt], [0, 58], (t) => 1 - (1 - t) ** 1.4)
      : frame < resumeAt
        ? 58
        : keys(frame, [resumeAt, doneAt], [58, 100], (t) => t ** 0.9);
  const paused = frame >= pauseAt && frame < resumeAt;
  const done = frame >= doneAt;
  const doneP = tween(frame, doneAt, doneAt + 12, [0, 1], EASE.out);

  const full = { x: 0, y: 0, w: DOWNLOADS.width, h: DOWNLOADS.height };
  const winW = v ? 1000 : 1180;
  const cam = camera(frame, [
    { f: 0, r: full, w: winW, cx: W / 2, cy: H * 0.56 },
    { f: 24, r: sp.controls, w: v ? 1020 : 1600, cx: W / 2, cy: v ? H * 0.5 : H * 0.55 },
    { f: S.duration, r: sp.controls, w: v ? 1050 : 1660, cx: W / 2, cy: v ? H * 0.5 : H * 0.55 },
  ]);

  const fillColor = paused ? "#5d7380" : C.tealUi;
  const title = [
    { text: "VOUS", at: 4 },
    { text: "GARDEZ", at: 8 },
    { text: "LE", at: 12, br: v },
    { text: "CONTRÔLE", at: 16, accent: true },
  ];

  return (
    <SceneShell duration={S.duration}>
      <CaptureView capture={DOWNLOADS} cam={cam} glow={0.45 + 0.4 * doneP}>
        {/* Pourcentage et statut animés (calques sur la capture) */}
        {frame >= startAt && (
          <>
            <Patch r={sp.percent} color={ROW_BG} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 13, color: done ? C.teal : C.white }}>{Math.round(progress)}%</span>
            </Patch>
            <Patch r={sp.status} color={ROW_BG} />
          </>
        )}
        {/* Barre de progression */}
        <div
          style={{
            position: "absolute",
            left: sp.track.x,
            top: sp.track.y,
            width: (sp.track.w * Math.max(progress, 1)) / 100,
            height: sp.track.h,
            borderRadius: 2,
            background: fillColor,
            boxShadow: paused ? undefined : `0 0 10px rgba(53,201,189,0.8)`,
          }}
        />
        {/* Icône de la ligne : pause → reprise → terminé */}
        {(paused || done) && (
          <Patch r={sp.rowPause} color={ROW_BG} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {done ? (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 99,
                  background: C.teal,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${doneP})`,
                  boxShadow: "0 0 14px rgba(45,198,190,0.8)",
                }}
              >
                <CheckIcon size={15} color={C.bg} stroke={3} />
              </div>
            ) : (
              <PlayIcon size={16} color={C.white} />
            )}
          </Patch>
        )}
        <Spot r={sp.row} at={20} until={pauseAt - 6} radius={12} pad={3} fill={0.03} />
        <Spot r={sp.pauseAll} at={pauseAt - 2} until={resumeAt - 2} radius={9} pad={3} pulse />
        <Spot r={sp.resumeAll} at={resumeAt - 2} until={resumeAt + 24} radius={9} pad={3} pulse />
        <Spot r={sp.row} at={doneAt} radius={12} pad={3} fill={0.06} />
        {paused && (
          <div style={{ position: "absolute", left: sp.rowPause.x - 112, top: sp.rowPause.y - 40 }}>
            <Tag style={{ fontSize: 12, padding: "3px 10px", background: C.bg2 }}>en pause</Tag>
          </div>
        )}
        <Burst at={doneAt} x={sp.rowPause.x + 13} y={sp.rowPause.y + 13} count={22} spread={140} />
        <Cursor
          path={[
            { f: pauseAt - 22, x: 900, y: 270 },
            { f: pauseAt - 3, x: sp.pauseAll.x + 60, y: sp.pauseAll.y + 22 },
            { f: pauseAt + 4, x: sp.pauseAll.x + 62, y: sp.pauseAll.y + 24 },
            { f: resumeAt - 3, x: sp.resumeAll.x + 62, y: sp.resumeAll.y + 22 },
            { f: resumeAt + 20, x: sp.resumeAll.x + 30, y: sp.row.y + 120 },
          ]}
          clicks={[pauseAt, resumeAt]}
          vanish={resumeAt + 30}
        />
      </CaptureView>
      <TopScrim />
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? H * 0.14 : 60, display: "flex", justifyContent: "center" }}>
        <KineticTitle words={title} size={v ? 112 : 80} />
      </div>
    </SceneShell>
  );
};
