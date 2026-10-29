import React from "react";
import { AbsoluteFill, getStaticFiles, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Rect } from "../config/assets";
import { C, EASE, FONT, keys, tween } from "../theme";

/* ------------------------------------------------------------------ layout */

export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const v = height > width;
  return { W: width, H: height, v, cx: width / 2, cy: height / 2 };
};

/* ------------------------------------------------------------ fichiers */

let cache: Set<string> | null = null;
/**
 * true si le fichier existe dans public/ (permet les solutions de repli).
 * Si la liste des fichiers est indisponible (ex. lecteur web), renvoie `assumeIfUnknown`.
 */
export const hasFile = (path: string, assumeIfUnknown = true) => {
  if (!cache) {
    try {
      cache = new Set(getStaticFiles().map((f) => f.name));
    } catch {
      cache = new Set();
    }
  }
  return cache.size === 0 ? assumeIfUnknown : cache.has(path);
};

/* ------------------------------------------------------------ caméra */

export type CamKey = {
  /** frame (relative à la scène) */
  f: number;
  /** zone de la capture à cadrer */
  r: Rect;
  /** largeur à l'écran de cette zone */
  w: number;
  /** position à l'écran du centre de la zone */
  cx: number;
  cy: number;
};

export type Cam = { scale: number; fx: number; fy: number; cx: number; cy: number };

/** Interpole un cadrage entre plusieurs zones (échelle interpolée en log). */
export const camera = (frame: number, ks: CamKey[], easing = EASE.inOut): Cam => {
  const fs = ks.map((k) => k.f);
  const pick = (fn: (k: CamKey) => number) => keys(frame, fs, ks.map(fn), easing);
  if (ks.length === 1) {
    const k = ks[0];
    return { scale: k.w / k.r.w, fx: k.r.x + k.r.w / 2, fy: k.r.y + k.r.h / 2, cx: k.cx, cy: k.cy };
  }
  return {
    scale: Math.exp(pick((k) => Math.log(k.w / k.r.w))),
    fx: pick((k) => k.r.x + k.r.w / 2),
    fy: pick((k) => k.r.y + k.r.h / 2),
    cx: pick((k) => k.cx),
    cy: pick((k) => k.cy),
  };
};

/* ------------------------------------------------------- capture d'écran */

type CaptureLike = { src: string; width: number; height: number; redact: readonly Rect[] };

/**
 * Affiche une vraie capture dans une fenêtre (coins arrondis, ombre, glow),
 * sans déformation. Les enfants sont positionnés en pixels de la capture.
 */
export const CaptureView: React.FC<{
  capture: CaptureLike;
  cam: Cam;
  tiltX?: number;
  tiltY?: number;
  opacity?: number;
  glow?: number;
  radius?: number;
  blur?: number;
  /** Barre ajoutée au-dessus de la capture (ex. barre d'adresse dessinée). */
  header?: { height: number; node: React.ReactNode };
  children?: React.ReactNode;
}> = ({ capture, cam, tiltX = 0, tiltY = 0, opacity = 1, glow = 0.35, radius = 12, blur = 0, header, children }) => {
  const hh = header?.height ?? 0;
  const left = cam.cx - cam.fx * cam.scale;
  const top = cam.cy - (cam.fy + hh) * cam.scale;
  const ok = hasFile(capture.src);
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: `${cam.cx}px ${cam.cy}px`, opacity }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transformOrigin: `${cam.cx}px ${cam.cy}px`,
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: capture.width,
            height: capture.height + hh,
            transform: `scale(${cam.scale})`,
            transformOrigin: "0 0",
            borderRadius: radius,
            overflow: "hidden",
            background: C.bg,
            boxShadow: `0 0 0 1px rgba(148,169,184,0.18), 0 ${30 / cam.scale}px ${90 / cam.scale}px rgba(0,0,0,0.55), 0 0 ${
              120 / cam.scale
            }px rgba(45,198,190,${glow * 0.35})`,
          }}
        >
          {header && <div style={{ position: "absolute", left: 0, top: 0, width: capture.width, height: hh }}>{header.node}</div>}
          <div style={{ position: "absolute", left: 0, top: hh, width: capture.width, height: capture.height }}>
            {ok ? (
              <Img src={staticFile(capture.src)} style={{ width: capture.width, height: capture.height, display: "block" }} />
            ) : (
              <MissingAsset path={capture.src} />
            )}
            {ok && capture.redact.map((r, i) => <Redact key={i} capture={capture} r={r} />)}
            {children}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Floute une zone de la capture (titres tiers non mis en avant). */
const Redact: React.FC<{ capture: CaptureLike; r: Rect }> = ({ capture, r }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, overflow: "hidden", borderRadius: 4 }}>
    <Img
      src={staticFile(capture.src)}
      style={{
        position: "absolute",
        left: -r.x,
        top: -r.y,
        width: capture.width,
        height: capture.height,
        filter: "blur(5px) saturate(0.7)",
        transform: "scale(1.02)",
        transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px`,
      }}
    />
  </div>
);

export const MissingAsset: React.FC<{ path: string }> = ({ path }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      background: `repeating-linear-gradient(45deg, ${C.bg} 0 18px, ${C.bg2} 18px 36px)`,
      color: C.muted,
      fontFamily: FONT.mono,
      fontSize: 22,
    }}
  >
    <div style={{ color: C.teal, fontWeight: 700 }}>Capture manquante</div>
    <div>public/{path}</div>
  </div>
);

/* ------------------------------------------------------------ calques UI */

/** Contour lumineux turquoise autour d'une zone (coordonnées capture). */
export const Spot: React.FC<{ r: Rect; at: number; until?: number; pad?: number; radius?: number; pulse?: boolean; fill?: number }> = ({
  r,
  at,
  until = 99999,
  pad = 6,
  radius = 10,
  pulse = false,
  fill = 0.08,
}) => {
  const frame = useCurrentFrame();
  const inP = tween(frame, at, at + 10);
  const outP = tween(frame, until, until + 8, [1, 0], EASE.in);
  const o = Math.min(inP, outP);
  if (o <= 0) return null;
  const s = interpolate(inP, [0, 1], [1.12, 1]);
  const pl = pulse ? 0.5 + 0.5 * Math.sin((frame - at) / 5) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: r.x - pad,
        top: r.y - pad,
        width: r.w + pad * 2,
        height: r.h + pad * 2,
        borderRadius: radius,
        border: `2px solid ${C.teal}`,
        background: `rgba(45,198,190,${fill * o})`,
        boxShadow: `0 0 ${18 + 10 * pl}px rgba(45,198,190,${0.55 * o}), inset 0 0 14px rgba(45,198,190,${0.25 * o})`,
        opacity: o,
        transform: `scale(${s})`,
      }}
    />
  );
};

/** Curseur animé + effet de clic (coordonnées capture). Aucune vraie souris n'est utilisée. */
export const Cursor: React.FC<{
  path: { f: number; x: number; y: number }[];
  clicks?: number[];
  appear?: number;
  vanish?: number;
  size?: number;
}> = ({ path, clicks = [], appear = path[0].f, vanish = 99999, size = 22 }) => {
  const frame = useCurrentFrame();
  const o = Math.min(tween(frame, appear, appear + 6), tween(frame, vanish, vanish + 6, [1, 0]));
  if (o <= 0) return null;
  const fs = path.map((p) => p.f);
  const x = keys(frame, fs, path.map((p) => p.x));
  const y = keys(frame, fs, path.map((p) => p.y));
  let press = 1;
  const ripples: React.ReactNode[] = [];
  clicks.forEach((c, i) => {
    const d = frame - c;
    if (d > -4 && d < 6) press = Math.min(press, interpolate(Math.abs(d - 1), [0, 4], [0.82, 1], { extrapolateRight: "clamp" }));
    if (d >= 0 && d < 18) {
      const p = d / 18;
      ripples.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - 30 * p,
            top: y - 30 * p,
            width: 60 * p,
            height: 60 * p,
            borderRadius: "50%",
            border: `2px solid ${C.teal}`,
            opacity: (1 - p) * 0.9,
            boxShadow: `0 0 16px rgba(45,198,190,${1 - p})`,
          }}
        />,
      );
    }
  });
  return (
    <>
      {ripples}
      <svg
        width={size}
        height={size * 1.4}
        viewBox="0 0 20 28"
        style={{
          position: "absolute",
          left: x - 2,
          top: y - 1,
          opacity: o,
          transform: `scale(${press})`,
          transformOrigin: "2px 1px",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
        }}
      >
        <path d="M2 1 L2 22 L7.5 17 L11.2 25.5 L14.6 24 L10.9 15.6 L18 15.6 Z" fill={C.white} stroke="#0E171F" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** Bloc de couleur unie qui masque un texte de la capture avant d'en superposer un animé. */
export const Patch: React.FC<{ r: Rect; color: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ r, color, children, style }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: color, ...style }}>{children}</div>
);

/** Dégradé sombre en haut de l'écran pour garantir la lisibilité des titres. */
export const TopScrim: React.FC<{ height?: number; opacity?: number }> = ({ height, opacity = 1 }) => {
  const { H, v } = useLayout();
  const h = height ?? (v ? H * 0.32 : 300);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: h,
        opacity,
        background: `linear-gradient(180deg, ${C.bg} 0%, rgba(14,23,31,0.85) 45%, rgba(14,23,31,0) 100%)`,
      }}
    />
  );
};
