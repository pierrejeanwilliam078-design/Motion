import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticTitle, LogoMark, Wordmark } from "../components/brand";
import { camera, CaptureView, useLayout } from "../components/core";
import { SceneShell } from "../components/SceneShell";
import { HOME } from "../config/assets";
import { C, EASE, keys, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s2-revelation");
const at = (t: number) => vo(t) - S.from;

export const S2Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();

  // 1. Le logo s'assemble au centre, le nom se dévoile.
  const build = tween(frame, 0, 24, [0, 1], EASE.soft);
  const nameReveal = tween(frame, at(3.95), at(4.75), [0, 1], EASE.out);
  // 2. Le bloc logo remonte, la fenêtre de l'application se révèle.
  const lift = tween(frame, at(4.95), at(5.6), [0, 1], EASE.inOut);

  const logoSize = v ? 150 : 128;
  const nameSize = v ? 96 : 92;
  const lockupY = keys(lift, [0, 1], [H / 2, v ? H * 0.2 : H * 0.15]);
  const lockupScale = keys(lift, [0, 1], [1, v ? 0.8 : 0.66]);
  const glow = 0.5 + 0.3 * Math.sin(frame / 6);

  const winW = v ? 1000 : 1180;
  const winH = (HOME.height * winW) / HOME.width;
  const winTop = v ? H * 0.38 : H * 0.36;
  const rise = tween(frame, at(5.0), at(5.9), [0, 1], EASE.out);
  const cam = camera(frame, [
    { f: 0, r: { x: 0, y: 0, w: HOME.width, h: HOME.height }, w: winW, cx: W / 2, cy: winTop + winH / 2 },
  ]);
  cam.cy += (1 - rise) * H * 0.75;

  const tagline = [
    { text: "Simple.", at: at(5.18) },
    { text: "Pratique.", at: at(5.9) },
    { text: "Gratuit.", at: at(6.56), accent: true },
  ];

  return (
    <SceneShell duration={S.duration} enter="none" exit="recede">
      {/* Halo d'apparition */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${(lockupY / H) * 100}%, rgba(45,198,190,${0.35 * (1 - lift) * build}), transparent 45%)`,
        }}
      />
      {rise > 0 && <CaptureView capture={HOME} cam={cam} tiltX={18 * (1 - rise) + 6} opacity={rise} glow={0.6} />}
      {/* Lockup logo + nom */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: lockupY,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(-50%) scale(${lockupScale})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 34 * (0.4 + 0.6 * nameReveal) }}>
          <div style={{ transform: `scale(${0.6 + 0.4 * build})` }}>
            <LogoMark size={logoSize} build={build} glow={glow} />
          </div>
          <div style={{ maxWidth: nameReveal * nameSize * 9, overflow: "hidden" }}>
            <Wordmark size={nameSize} reveal={nameReveal} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? H * 0.27 : H * 0.235, display: "flex", justifyContent: "center" }}>
        <KineticTitle words={tagline} size={v ? 64 : 56} weight={700} color={C.white} style={{ letterSpacing: "-0.02em" }} />
      </div>
    </SceneShell>
  );
};
