import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { LOGO_SRC } from "../config/assets";
import { C, EASE, FONT, hash, tween } from "../theme";
import { useLayout } from "./core";

/* ------------------------------------------------------------ fond */

/** Fond sombre animé : halos turquoise lents, grille de points, vignette. */
export const Background: React.FC<{ glow?: number; deep?: boolean; grid?: number }> = ({ glow = 1, deep = false, grid = 1 }) => {
  const frame = useCurrentFrame();
  const { W, H } = useLayout();
  const t = frame / 30;
  const ax = W * (0.25 + 0.06 * Math.sin(t * 0.35));
  const ay = H * (0.3 + 0.05 * Math.cos(t * 0.28));
  const bx = W * (0.78 + 0.05 * Math.cos(t * 0.3));
  const by = H * (0.72 + 0.06 * Math.sin(t * 0.25));
  return (
    <AbsoluteFill style={{ background: deep ? C.bgDeep : C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${W * 0.55}px ${W * 0.4}px at ${ax}px ${ay}px, rgba(45,198,190,${0.13 * glow}), transparent 70%),
            radial-gradient(${W * 0.5}px ${W * 0.4}px at ${bx}px ${by}px, rgba(23,40,51,${0.95 * glow}), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.35 * grid,
          backgroundImage: "radial-gradient(rgba(148,169,184,0.22) 1.2px, transparent 1.4px)",
          backgroundSize: "36px 36px",
          backgroundPosition: `${(frame * 0.25) % 36}px ${(frame * 0.12) % 36}px`,
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ logo */

/**
 * Logo Miarina Media reconstitué en vectoriel d'après l'interface
 * (carré arrondi, trois traits + barre + triangle « lecture »).
 * `build` (0→1) assemble le pictogramme pièce par pièce.
 */
export const LogoMark: React.FC<{ size: number; build?: number; variant?: "teal" | "dark"; glow?: number }> = ({
  size,
  build = 1,
  variant = "teal",
  glow = 0,
}) => {
  if (LOGO_SRC) {
    return <Img src={staticFile(LOGO_SRC)} style={{ width: size, height: size, opacity: build }} />;
  }
  const tile = variant === "teal" ? C.teal : "#101820";
  const ink = variant === "teal" ? "#0E171F" : C.teal;
  const p = (a: number, b: number) => interpolate(build, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const tileS = 0.6 + 0.4 * p(0, 0.45);
  const bar1 = p(0.3, 0.6);
  const bar2 = p(0.38, 0.68);
  const bar3 = p(0.46, 0.76);
  const vbar = p(0.5, 0.8);
  const tri = p(0.6, 1);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        overflow: "visible",
        filter: glow > 0 ? `drop-shadow(0 0 ${size * 0.18}px rgba(45,198,190,${glow}))` : undefined,
      }}
    >
      <g transform={`translate(50 50) scale(${tileS}) translate(-50 -50)`} opacity={p(0, 0.3)}>
        <rect x="0" y="0" width="100" height="100" rx="24" fill={tile} />
        {variant === "dark" && <rect x="0.5" y="0.5" width="99" height="99" rx="23.5" fill="none" stroke="rgba(45,198,190,0.35)" />}
      </g>
      <g fill={ink}>
        <rect x={17.9 + (1 - bar1) * -12} y="32" width="14.2" height="7" rx="2" opacity={bar1} />
        <rect x={10.7 + (1 - bar2) * -12} y="46.5" width="21.4" height="7" rx="2" opacity={bar2} />
        <rect x={17.9 + (1 - bar3) * -12} y="61" width="14.2" height="7" rx="2" opacity={bar3} />
        <rect x="38.6" y={50 - 21.5 * vbar} width="4.6" height={43 * vbar} rx="1.5" />
        <path
          d="M46 31.5 L72.5 50 L46 68.5 Z"
          transform={`translate(46 50) scale(${tri}) translate(-46 -50)`}
          strokeLinejoin="round"
          stroke={ink}
          strokeWidth="2.5"
        />
      </g>
    </svg>
  );
};

export const Wordmark: React.FC<{ size: number; color?: string; reveal?: number }> = ({ size, color = C.white, reveal = 1 }) => (
  <div
    style={{
      fontFamily: FONT.sans,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: "-0.025em",
      color,
      whiteSpace: "nowrap",
      clipPath: `inset(-20% ${(1 - reveal) * 100}% -20% 0)`,
      lineHeight: 1,
    }}
  >
    Miarina Media
  </div>
);

/* ------------------------------------------------------------ titres */

export type Word = { text: string; at: number; accent?: boolean; br?: boolean };

/**
 * Titre cinétique : chaque mot apparaît à sa frame (montée + flou → net).
 * `out` : frame de sortie (les mots s'effacent en cascade).
 */
export const KineticTitle: React.FC<{
  words: Word[];
  size: number;
  out?: number;
  align?: "center" | "left";
  weight?: number;
  color?: string;
  maxWidth?: number;
  style?: React.CSSProperties;
  rgbSplit?: number;
}> = ({ words, size, out = 99999, align = "center", weight = 800, color = C.white, maxWidth, style, rgbSplit = 0 }) => {
  const frame = useCurrentFrame();
  const lines: Word[][] = [[]];
  words.forEach((w) => {
    if (w.br && lines[lines.length - 1].length) lines.push([]);
    lines[lines.length - 1].push(w);
  });
  let idx = 0;
  return (
    <div
      style={{
        fontFamily: FONT.sans,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.035em",
        textAlign: align,
        color,
        maxWidth,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", gap: `0 ${size * 0.26}px` }}>
          {line.map((w) => {
            const i = idx++;
            const p = tween(frame, w.at, w.at + 13);
            const q = tween(frame, out + i * 2, out + i * 2 + 9, [0, 1], EASE.in);
            const o = p * (1 - q);
            const y = (1 - p) * size * 0.45 - q * size * 0.25;
            const blur = (1 - p) * 10 + q * 8;
            const wc = w.accent ? C.teal : color;
            const split = rgbSplit * Math.max(0, 1 - (frame - w.at) / 10);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: o,
                  transform: `translateY(${y}px) scale(${0.94 + 0.06 * p})`,
                  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                  color: wc,
                  textShadow: [
                    w.accent ? `0 0 ${size * 0.4}px rgba(45,198,190,0.45)` : "",
                    split > 0.2 ? `${-split}px 0 rgba(255,60,90,0.75), ${split}px 0 rgba(45,230,255,0.75)` : "",
                  ]
                    .filter(Boolean)
                    .join(", ") || undefined,
                  whiteSpace: "nowrap",
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Petite étiquette mono (ex. « Illustration simplifiée »). */
export const Tag: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; o?: number }> = ({ children, style, o = 1 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: FONT.mono,
      fontSize: 18,
      color: C.teal,
      padding: "6px 14px",
      borderRadius: 999,
      border: "1px solid rgba(45,198,190,0.35)",
      background: "rgba(45,198,190,0.08)",
      opacity: o,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Particules turquoise déterministes (éclat). */
export const Burst: React.FC<{ at: number; x: number; y: number; count?: number; spread?: number }> = ({ at, x, y, count = 28, spread = 520 }) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  if (d < 0 || d > 40) return null;
  const p = d / 40;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = hash(i) * Math.PI * 2;
        const r = spread * (0.35 + 0.65 * hash(i + 50)) * EASE.out(p);
        const s = 4 + 10 * hash(i + 99);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * r - s / 2,
              top: y + Math.sin(a) * r - s / 2,
              width: s,
              height: s,
              borderRadius: hash(i + 7) > 0.5 ? "50%" : 3,
              background: hash(i + 3) > 0.3 ? C.teal : C.white,
              opacity: (1 - p) * 0.9,
              boxShadow: `0 0 ${s * 2}px rgba(45,198,190,0.8)`,
            }}
          />
        );
      })}
    </>
  );
};
