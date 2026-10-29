import React from "react";
import { useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/brand";
import { camera, CaptureView, Cursor, Patch, Spot, TopScrim, useLayout } from "../components/core";
import { LinkIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { HOME } from "../config/assets";
import { C, EASE, FONT, keys, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s4-lien");
const at = (t: number) => vo(t) - S.from;

const LINK = "https://www.youtube.com/watch?v=…";

export const S4Paste: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();
  const sp = HOME.spots;

  const copyAt = at(14.58);
  const pasteAt = at(15.5);
  const analyzeAt = at(17.12);

  const full = { x: 0, y: 0, w: HOME.width, h: HOME.height };
  const focus = { x: 273, y: 70, w: 968, h: 230 };
  const winW = v ? 1000 : 1180;
  const cam = camera(frame, [
    { f: 0, r: full, w: winW * 0.94, cx: W / 2, cy: H * 0.55 },
    { f: 8, r: full, w: winW, cx: W / 2, cy: H * 0.55 },
    { f: 30, r: focus, w: v ? 1040 : 1560, cx: W / 2, cy: v ? H * 0.5 : H * 0.56 },
    { f: S.duration, r: focus, w: v ? 1080 : 1620, cx: W / 2, cy: v ? H * 0.5 : H * 0.56 },
  ]);

  // Lien « copié » : pastille flottante qui vole ensuite dans le champ.
  const chipIn = tween(frame, copyAt, copyAt + 10, [0, 1], EASE.out);
  const fly = tween(frame, pasteAt, pasteAt + 9, [0, 1], EASE.in);
  const chipX = keys(fly, [0, 1], [560, sp.placeholder.x + 4], (t) => t);
  const chipY = keys(fly, [0, 1], [118, sp.placeholder.y], (t) => t);
  const typedN = Math.round(keys(frame, [pasteAt + 7, pasteAt + 16], [0, LINK.length], (t) => t));
  const focused = frame >= pasteAt + 4;
  const analyzePulse = tween(frame, analyzeAt, analyzeAt + 6) * (1 - tween(frame, analyzeAt + 6, analyzeAt + 30));
  const sweep = tween(frame, analyzeAt + 2, analyzeAt + 26, [0, 1], EASE.inOut);

  const title = [
    { text: "COPIEZ.", at: copyAt },
    { text: "COLLEZ.", at: pasteAt, br: v },
    { text: "ANALYSEZ.", at: analyzeAt, accent: true, br: v },
  ];

  return (
    <SceneShell duration={S.duration}>
      <CaptureView capture={HOME} cam={cam} glow={0.5}>
        {/* Champ actif : contour turquoise */}
        {focused && (
          <div
            style={{
              position: "absolute",
              left: sp.input.x,
              top: sp.input.y,
              width: sp.input.w,
              height: sp.input.h,
              borderRadius: 7,
              border: `1.5px solid ${C.teal}`,
              boxShadow: "0 0 0 3px rgba(45,198,190,0.18), 0 0 18px rgba(45,198,190,0.35)",
              opacity: tween(frame, pasteAt + 4, pasteAt + 10),
            }}
          />
        )}
        {/* Lien collé (calque animé par-dessus le texte indicatif) */}
        {typedN > 0 && (
          <Patch r={sp.placeholder} color="#101820" style={{ width: 640, display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 14, color: C.white, paddingLeft: 5, whiteSpace: "nowrap" }}>{LINK.slice(0, typedN)}</span>
          </Patch>
        )}
        {/* Pastille « lien copié » */}
        {chipIn > 0 && fly < 1 && (
          <div
            style={{
              position: "absolute",
              left: chipX,
              top: chipY,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 9,
              background: C.bg2,
              border: `1px solid ${C.teal}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.45), 0 0 18px rgba(45,198,190,0.35)",
              fontFamily: FONT.mono,
              fontSize: 13,
              color: C.white,
              opacity: chipIn * (1 - fly * 0.6),
              transform: `scale(${(0.8 + 0.2 * chipIn) * (1 - 0.3 * fly)})`,
              transformOrigin: "left center",
              whiteSpace: "nowrap",
            }}
          >
            <LinkIcon size={14} color={C.teal} />
            youtube.com/watch?v=…
          </div>
        )}
        <Spot r={sp.paste} at={pasteAt - 2} until={pasteAt + 18} radius={9} pad={3} />
        {/* Analyze : impulsion lumineuse */}
        <div
          style={{
            position: "absolute",
            left: sp.analyze.x - 4,
            top: sp.analyze.y - 4,
            width: sp.analyze.w + 8,
            height: sp.analyze.h + 8,
            borderRadius: 10,
            boxShadow: `0 0 ${10 + 40 * analyzePulse}px ${8 * analyzePulse}px rgba(45,198,190,${0.7 * analyzePulse})`,
          }}
        />
        {/* Balayage lumineux sur la zone de lien pendant l'analyse */}
        {sweep > 0 && sweep < 1 && (
          <div
            style={{
              position: "absolute",
              left: sp.linkBox.x,
              top: sp.linkBox.y,
              width: sp.linkBox.w,
              height: sp.linkBox.h,
              borderRadius: 10,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: -300 + sweep * (sp.linkBox.w + 600),
                width: 260,
                background: "linear-gradient(90deg, transparent, rgba(45,198,190,0.28), transparent)",
              }}
            />
          </div>
        )}
        <Spot r={sp.linkBox} at={analyzeAt + 2} radius={14} pad={2} fill={0.03} />
        <Cursor
          path={[
            { f: copyAt + 2, x: 760, y: 330 },
            { f: pasteAt - 3, x: sp.paste.x + 40, y: sp.paste.y + 26 },
            { f: pasteAt + 18, x: sp.paste.x + 46, y: sp.paste.y + 30 },
            { f: analyzeAt - 3, x: sp.analyze.x + 44, y: sp.analyze.y + 26 },
          ]}
          clicks={[pasteAt, analyzeAt]}
        />
      </CaptureView>
      <TopScrim />
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? H * 0.12 : 56, display: "flex", justifyContent: "center" }}>
        <KineticTitle words={title} size={v ? 110 : 80} />
      </div>
    </SceneShell>
  );
};
