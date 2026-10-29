import React from "react";
import { useCurrentFrame } from "remotion";
import { KineticTitle, LogoMark, Tag } from "../components/brand";
import { Cam, camera, CaptureView, Cursor, hasFile, Spot, TopScrim, useLayout } from "../components/core";
import { DownloadIcon, FolderIcon, GlobeIcon, PlayIcon, SearchIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { BROWSER, Rect } from "../config/assets";
import { C, EASE, FONT, keys, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s3-navigateur");
const at = (t: number) => vo(t) - S.from;

/* Illustration simplifiée du navigateur intégré (taille logique 1280 × 800). */
const IW = 1280;
const IH = 800;
const ADDRESS: Rect = { x: 273, y: 66, w: 968, h: 50 };

const SHORTCUTS = [
  { label: "YouTube", domain: "youtube.com", color: "#E5484D" },
  { label: "Google", domain: "google.com", color: "#4C8BF5" },
  { label: "Wikimedia Commons", domain: "commons.wikimedia.org", color: "#3A9AD9" },
  { label: "Internet Archive", domain: "archive.org", color: "#7D8F9C" },
  { label: "Vimeo", domain: "vimeo.com", color: "#1AB7EA" },
  { label: "Dailymotion", domain: "dailymotion.com", color: "#3E7BFA" },
  { label: "SoundCloud", domain: "soundcloud.com", color: "#FF7A1A" },
  { label: "Facebook", domain: "facebook.com", color: "#1877F2" },
];
const tileRect = (i: number): Rect => ({ x: 273 + (i % 4) * 246, y: 182 + Math.floor(i / 4) * 166, w: 230, h: 150 });

/** Moment de mise en valeur de chaque raccourci (synchro voix off). */
const tileAt = (i: number) => {
  if (i === 0) return at(7.94); // YouTube
  if (i === 7) return at(8.72); // Facebook
  return at(9.38) + (i - 1) * 4; // « d'autres plateformes compatibles »
};

const Illustration: React.FC<{ typed: string; caret: boolean }> = ({ typed, caret }) => {
  const frame = useCurrentFrame();
  const side = [
    { label: "Home", icon: <PlayIcon size={15} color={C.muted} /> },
    { label: "Downloads", icon: <DownloadIcon size={16} color={C.muted} /> },
    { label: "Library", icon: <FolderIcon size={16} color={C.muted} /> },
    { label: "Browser", icon: <GlobeIcon size={16} color={C.teal} />, active: true },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#101820", fontFamily: FONT.sans }}>
      {/* Barre de titre */}
      <div style={{ position: "absolute", left: 0, top: 0, width: IW, height: 40, background: "#0D141B", borderBottom: "1px solid #1b2935" }}>
        <div style={{ position: "absolute", left: 14, top: 10 }}>
          <LogoMark size={20} />
        </div>
        <div style={{ position: "absolute", left: 44, top: 11, color: C.white, fontWeight: 700, fontSize: 14 }}>Miarina Media</div>
        <div
          style={{
            position: "absolute",
            left: 450,
            top: 7,
            width: 380,
            height: 26,
            borderRadius: 7,
            background: "#16212a",
            border: "1px solid #24364a",
            color: C.muted,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingLeft: 12,
          }}
        >
          <SearchIcon size={12} color={C.muted} /> Search library and history
        </div>
        <Tag style={{ position: "absolute", right: 16, top: 7, fontSize: 11, padding: "3px 10px" }}>illustration simplifiée</Tag>
      </div>
      {/* Barre latérale */}
      <div style={{ position: "absolute", left: 0, top: 40, width: 232, height: IH - 40, background: "#0D141B", borderRight: "1px solid #1b2935" }}>
        {side.map((s, i) => (
          <div
            key={s.label}
            style={{
              position: "absolute",
              left: 11,
              top: 12 + i * 42,
              width: 210,
              height: 36,
              borderRadius: 8,
              background: s.active ? "#182530" : "transparent",
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingLeft: 14,
              color: s.active ? C.white : C.muted,
              fontSize: 14,
              fontWeight: s.active ? 700 : 500,
            }}
          >
            {s.icon}
            {s.label}
          </div>
        ))}
      </div>
      {/* Barre d'adresse */}
      <div
        style={{
          position: "absolute",
          left: ADDRESS.x,
          top: ADDRESS.y,
          width: ADDRESS.w,
          height: ADDRESS.h,
          borderRadius: 10,
          background: "#0D141B",
          border: `1px solid ${typed || caret ? C.teal : "#2a3d4e"}`,
          boxShadow: typed || caret ? "0 0 0 3px rgba(45,198,190,0.18)" : undefined,
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingLeft: 16,
          fontFamily: FONT.mono,
          fontSize: 15,
          color: typed ? C.white : "#5f7686",
        }}
      >
        <span style={{ color: C.muted, fontFamily: FONT.sans, fontSize: 18 }}>‹ ›</span>
        <GlobeIcon size={16} color={C.muted} />
        <span>
          {typed || "Search or enter address"}
          {caret && <span style={{ color: C.teal, opacity: Math.floor(frame / 8) % 2 ? 1 : 0 }}>|</span>}
        </span>
      </div>
      <div style={{ position: "absolute", left: 273, top: 140, color: C.white, fontWeight: 700, fontSize: 16 }}>Quick access</div>
      {/* Raccourcis */}
      {SHORTCUTS.map((s, i) => {
        const r = tileRect(i);
        const lit = tween(frame, tileAt(i), tileAt(i) + 10);
        return (
          <div
            key={s.label}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              borderRadius: 12,
              background: "#182530",
              border: `1px solid ${lit > 0.5 ? "rgba(45,198,190,0.55)" : "#1f2f3b"}`,
              transform: `translateY(${-6 * lit}px)`,
              boxShadow: lit ? `0 ${14 * lit}px 30px rgba(0,0,0,0.35)` : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 16,
                width: 46,
                height: 46,
                borderRadius: 12,
                background: s.color,
                color: "white",
                fontWeight: 800,
                fontSize: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.55 + 0.45 * lit,
              }}
            >
              {s.label[0]}
            </div>
            <div style={{ position: "absolute", left: 16, bottom: 34, color: C.white, fontWeight: 700, fontSize: 16 }}>{s.label}</div>
            <div style={{ position: "absolute", left: 16, bottom: 14, color: C.muted, fontFamily: FONT.mono, fontSize: 11 }}>{s.domain}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Fenêtre dessinée, même logique de caméra que CaptureView. */
const DrawnWindow: React.FC<{ cam: Cam; tiltY: number; children: React.ReactNode }> = ({ cam, tiltY, children }) => (
  <div style={{ position: "absolute", inset: 0, perspective: 2200, perspectiveOrigin: `${cam.cx}px ${cam.cy}px` }}>
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${cam.cx}px ${cam.cy}px`, transform: `rotateY(${tiltY}deg)` }}>
      <div
        style={{
          position: "absolute",
          left: cam.cx - cam.fx * cam.scale,
          top: cam.cy - cam.fy * cam.scale,
          width: IW,
          height: IH,
          transform: `scale(${cam.scale})`,
          transformOrigin: "0 0",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: `0 0 0 1px rgba(148,169,184,0.18), 0 ${30 / cam.scale}px ${90 / cam.scale}px rgba(0,0,0,0.55), 0 0 ${120 / cam.scale}px rgba(45,198,190,0.15)`,
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

export const S3Browser: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();
  const real = hasFile(BROWSER.src, false);

  const lw = real ? BROWSER.width : IW;
  const lh = real ? BROWSER.height : IH;
  const address = real ? BROWSER.spots.addressBar : ADDRESS;
  const winW = v ? 1000 : 1180;
  const winH = (lh * winW) / lw;
  const cy = v ? H * 0.52 : H * 0.18 + winH / 2;
  const full = { x: 0, y: 0, w: lw, h: lh };
  const zoomAt = at(10.8);
  const cam = camera(frame, [
    { f: 0, r: full, w: winW, cx: W / 2 + (v ? 900 : 1200), cy },
    { f: 20, r: full, w: winW, cx: W / 2, cy },
    { f: zoomAt, r: full, w: winW * 1.04, cx: W / 2, cy },
    { f: zoomAt + 22, r: address, w: v ? 1020 : 1560, cx: W / 2, cy: v ? H * 0.5 : H * 0.52 },
  ]);
  const tiltY = keys(frame, [0, 20, S.duration], [-22, -6, -2], EASE.out);

  const clickAt = at(11.6);
  const url = "youtube.com";
  const typedN = Math.floor(keys(frame, [clickAt + 4, at(12.5)], [0, url.length], (t) => t));
  const typed = frame > clickAt + 4 ? url.slice(0, typedN) : "";
  const cursor = (
    <Cursor
      path={[
        { f: zoomAt + 4, x: address.x + address.w * 0.7, y: address.y + 300 },
        { f: clickAt - 2, x: address.x + 230, y: address.y + address.h / 2 + 4 },
      ]}
      clicks={[clickAt]}
      appear={zoomAt + 4}
    />
  );

  const title = [
    { text: "NAVIGATEUR", at: 4 },
    { text: "INTÉGRÉ", at: 9, accent: true, br: v },
  ];

  return (
    <SceneShell duration={S.duration} enter="none">
      {real ? (
        <CaptureView capture={BROWSER} cam={cam} tiltY={tiltY}>
          {BROWSER.spots.tiles.map((t, i) => (
            <Spot key={t.label} r={t.rect} at={i === 0 ? at(7.94) : at(8.72)} until={zoomAt} />
          ))}
          <Spot r={BROWSER.spots.shortcuts} at={at(9.38)} until={zoomAt} fill={0.03} />
          <Spot r={address} at={clickAt} pulse />
          {cursor}
        </CaptureView>
      ) : (
        <DrawnWindow cam={cam} tiltY={tiltY}>
          <Illustration typed={typed} caret={frame > clickAt} />
          {SHORTCUTS.map((s, i) =>
            i === 0 || i === 7 ? <Spot key={s.label} r={tileRect(i)} at={tileAt(i)} until={zoomAt} radius={14} /> : null,
          )}
          {cursor}
        </DrawnWindow>
      )}
      <TopScrim />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: v ? H * 0.17 : 52,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <KineticTitle words={title} size={v ? 104 : 76} />
      </div>
    </SceneShell>
  );
};
