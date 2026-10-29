import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LogoMark, Wordmark } from "../components/brand";
import { camera, CaptureView, Cursor, Spot, useLayout } from "../components/core";
import { AndroidIcon, WindowsIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { SITE } from "../config/assets";
import { C, EASE, FONT, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s9-endcard");
const at = (t: number) => vo(t) - S.from;

const URL = "media.miarina.org";
const BAR = 46;

/** Barre de navigateur dessinée (la vraie a été retirée de la capture). */
const BrowserBar: React.FC<{ typed: string; caret: boolean }> = ({ typed, caret }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: "#E6EAEE", borderBottom: "1px solid #d3d9df", fontFamily: FONT.sans }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 18 + i * 20, top: 17, width: 12, height: 12, borderRadius: 99, background: c }} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 8,
          width: 620,
          height: 30,
          borderRadius: 99,
          background: "#ffffff",
          border: `1.5px solid ${caret ? C.teal : "#d3d9df"}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 14,
          fontSize: 15,
          color: "#0E171F",
        }}
      >
        <svg width="12" height="14" viewBox="0 0 12 14">
          <rect x="1" y="6" width="10" height="7" rx="1.5" fill="#5b6b78" />
          <path d="M3.2 6V4.2a2.8 2.8 0 0 1 5.6 0V6" stroke="#5b6b78" strokeWidth="1.6" fill="none" />
        </svg>
        <span style={{ fontWeight: 500 }}>
          {typed}
          {caret && <span style={{ color: C.teal, opacity: Math.floor(frame / 8) % 2 ? 1 : 0 }}>|</span>}
        </span>
      </div>
    </div>
  );
};

export const S9EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();

  const typeFrom = at(45.84);
  const typeTo = at(47.5);
  const n = Math.round(tween(frame, typeFrom, typeTo, [0, URL.length], (t) => t));
  const typed = frame >= typeFrom ? URL.slice(0, n) : "";
  const caret = frame >= typeFrom - 10 && frame < at(47.9);

  const full = { x: 0, y: -BAR, w: SITE.width, h: SITE.height + BAR };
  const urlZone = { x: 40, y: -BAR, w: 760, h: 60 };
  const dl = SITE.spots.downloads;
  const winW = v ? 1000 : 1400;
  const cam = camera(frame, [
    { f: 0, r: full, w: winW * 0.95, cx: W / 2, cy: H * 0.5 },
    { f: at(45.3), r: full, w: winW, cx: W / 2, cy: H * 0.5 },
    { f: at(45.85), r: urlZone, w: v ? 980 : 1400, cx: W / 2, cy: H * 0.45 },
    { f: at(46.9), r: urlZone, w: v ? 1000 : 1440, cx: W / 2, cy: H * 0.45 },
    { f: at(47.5), r: dl, w: v ? 980 : 1100, cx: W / 2, cy: H * 0.5 },
  ]);
  const hoverAt = at(47.45);

  // End card
  const endAt = at(47.85);
  const endP = tween(frame, endAt, endAt + 10, [0, 1], EASE.out);
  const build = tween(frame, endAt + 4, endAt + 26, [0, 1], EASE.soft);
  const nameP = tween(frame, at(48.17), at(48.7), [0, 1], EASE.out);
  const mediaP = tween(frame, at(49.38), at(49.38) + 12, [0, 1], EASE.out);
  const freedomP = tween(frame, at(50.54), at(50.54) + 12, [0, 1], EASE.out);
  const urlP = tween(frame, at(51.1), at(51.1) + 12, [0, 1], EASE.out);
  const subP = tween(frame, at(51.4), at(51.4) + 12, [0, 1], EASE.out);
  const fadeOut = tween(frame, S.duration - 26, S.duration, [0, 1], EASE.inOut);
  const glow = 0.45 + 0.3 * Math.sin(frame / 8);

  const logo = v ? 190 : 150;
  const slogan = v ? 92 : 84;

  return (
    <SceneShell duration={S.duration} exit="none">
      {endP < 1 && (
        <AbsoluteFill style={{ opacity: 1 - endP }}>
          <CaptureView capture={SITE} cam={cam} glow={0.5} header={{ height: BAR, node: <BrowserBar typed={typed} caret={caret} /> }}>
            <Spot r={SITE.spots.windowsBtn} at={hoverAt} radius={12} pad={4} pulse />
            <Spot r={SITE.spots.androidBtn} at={hoverAt + 5} radius={12} pad={2} />
            <Cursor
              path={[
                { f: at(46.9), x: 900, y: 420 },
                { f: hoverAt, x: SITE.spots.windowsBtn.x + 250, y: SITE.spots.windowsBtn.y + 34 },
              ]}
              appear={at(46.9)}
              size={26}
            />
          </CaptureView>
        </AbsoluteFill>
      )}

      {endP > 0 && (
        <AbsoluteFill style={{ opacity: endP * (1 - fadeOut) }}>
          <AbsoluteFill
            style={{
              background: `radial-gradient(${W * 0.6}px ${H * 0.55}px at 50% ${v ? 36 : 34}%, rgba(45,198,190,${0.16 + 0.05 * glow}), transparent 70%), #0A131B`,
            }}
          />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: v ? 34 : 26 }}>
            <div style={{ transform: `scale(${0.7 + 0.3 * build})` }}>
              <LogoMark size={logo} build={build} glow={glow} />
            </div>
            <div style={{ opacity: nameP, transform: `translateY(${(1 - nameP) * 20}px)` }}>
              <Wordmark size={v ? 82 : 64} reveal={nameP} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: v ? "column" : "row",
                alignItems: "center",
                gap: v ? 0 : slogan * 0.28,
                fontFamily: FONT.sans,
                fontWeight: 800,
                fontSize: slogan,
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
                marginTop: v ? 24 : 18,
              }}
            >
              <span style={{ color: C.white, opacity: mediaP, transform: `translateY(${(1 - mediaP) * 30}px)`, filter: `blur(${(1 - mediaP) * 8}px)` }}>
                Your media.
              </span>
              <span
                style={{
                  color: C.teal,
                  opacity: freedomP,
                  transform: `translateY(${(1 - freedomP) * 30}px)`,
                  filter: `blur(${(1 - freedomP) * 8}px)`,
                  textShadow: "0 0 50px rgba(45,198,190,0.5)",
                }}
              >
                Your freedom.
              </span>
            </div>
            <div
              style={{
                marginTop: v ? 40 : 26,
                opacity: urlP,
                transform: `scale(${0.9 + 0.1 * urlP})`,
                fontFamily: FONT.mono,
                fontWeight: 500,
                fontSize: v ? 46 : 38,
                color: C.white,
                padding: v ? "16px 36px" : "12px 30px",
                borderRadius: 99,
                border: `1.5px solid ${C.teal}`,
                background: "rgba(45,198,190,0.1)",
                boxShadow: `0 0 ${30 + 20 * glow}px rgba(45,198,190,0.35)`,
              }}
            >
              {URL}
            </div>
            <div
              style={{
                opacity: subP,
                transform: `translateY(${(1 - subP) * 16}px)`,
                fontFamily: FONT.sans,
                fontWeight: 600,
                fontSize: v ? 36 : 30,
                color: C.muted,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              Téléchargez Miarina Media
              <span style={{ display: "inline-flex", gap: 12, alignItems: "center", marginLeft: 6 }}>
                <WindowsIcon size={v ? 30 : 26} color={C.muted} />
                <AndroidIcon size={v ? 34 : 30} color={C.muted} />
              </span>
              <span style={{ color: C.teal, fontWeight: 800 }}>· Gratuit</span>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />
    </SceneShell>
  );
};
