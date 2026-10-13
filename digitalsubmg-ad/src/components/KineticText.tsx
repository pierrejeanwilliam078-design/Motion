import React from "react";
import { FONT } from "../lib/theme";

type LetterStyle = (i: number, n: number) => React.CSSProperties;

/** XXL text split into letters; each letter can be animated independently. */
export const KineticText: React.FC<{
  text: string;
  size: number;
  color?: string;
  font?: string;
  letterSpacing?: number; // em
  style?: React.CSSProperties;
  letterStyle?: LetterStyle;
  stroke?: string; // outlined letters
  gradient?: string; // background-clip text gradient
}> = ({ text, size, color = "#fff", font = FONT.display, letterSpacing = -0.02, style, letterStyle, stroke, gradient }) => {
  const letters = [...text];
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        display: "flex",
        whiteSpace: "pre",
        fontFamily: font,
        fontSize: size,
        lineHeight: 0.86,
        letterSpacing: `${letterSpacing}em`,
        color,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {letters.map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            transformOrigin: "50% 60%",
            ...(stroke ? { color: "transparent", WebkitTextStroke: stroke } : null),
            ...(gradient
              ? { backgroundImage: gradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
              : null),
            ...letterStyle?.(i, letters.length),
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
};

/**
 * Text set on an SVG curve. `bend` moves the curve's control point (px):
 * 0 = flat, >0 = arch up, <0 = smile. Used for warped / wrapping words.
 */
export const CurvedText: React.FC<{
  id: string;
  text: string;
  width: number;
  height: number;
  bend: number;
  size: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  letterSpacing?: number; // px
  font?: string;
  offset?: number; // 0..100 (% of path)
  style?: React.CSSProperties;
  stretch?: number; // horizontal scale of glyphs (via textLength)
  defs?: React.ReactNode;
}> = ({ id, text, width, height, bend, size, fill = "#fff", stroke, strokeWidth = 3, letterSpacing = 0, font = FONT.display, offset = 50, style, stretch, defs }) => {
  const y = height / 2 + size * 0.35;
  const d = `M ${-width} ${y} Q ${width / 2} ${y - bend * 2} ${width * 2} ${y}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", overflow: "visible", ...style }}>
      <defs>
        <path id={id} d={d} />
        {defs}
      </defs>
      <text
        fontFamily={font}
        fontSize={size}
        fill={stroke ? "none" : fill}
        stroke={stroke}
        strokeWidth={stroke ? strokeWidth : 0}
        letterSpacing={letterSpacing}
        textAnchor="middle"
        {...(stretch ? { textLength: stretch, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        <textPath href={`#${id}`} startOffset={`${offset}%`}>
          {text}
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Letters placed on a 3D ring (cylinder) around an object. Render it twice:
 * layer="back" before the object, layer="front" after it — a manual depth
 * sort that lets the object hide the far side of the word.
 */
export const RingText: React.FC<{
  text: string;
  radius: number;
  size: number;
  rotation: number; // deg, spins the ring
  tilt?: number; // deg, rotateX of the ring plane
  arc?: number; // deg covered by the word
  layer: "back" | "front";
  color?: string;
  backColor?: string;
  font?: string;
  y?: number;
  opacity?: number;
}> = ({ text, radius, size, rotation, tilt = -12, arc = 200, layer, color = "#fff", backColor, font = FONT.display, y = 0, opacity = 1 }) => {
  const letters = [...text];
  const step = arc / Math.max(1, letters.length - 1);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `translateY(${y}px) rotateX(${tilt}deg)`,
        opacity,
      }}
    >
      {letters.map((ch, i) => {
        const a = rotation - arc / 2 + i * step;
        const rad = (a * Math.PI) / 180;
        const z = Math.cos(rad);
        const isFront = z >= 0;
        if ((layer === "front") !== isFront) return null;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              fontFamily: font,
              fontSize: size,
              lineHeight: 1,
              color: isFront ? color : backColor ?? color,
              transform: `translate(-50%, -50%) rotateY(${a}deg) translateZ(${radius}px)`,
              backfaceVisibility: "visible",
              opacity: isFront ? 1 : 0.55 + 0.45 * (1 + z),
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Directional motion blur: renders ghost copies at earlier sub-frames. */
export const MotionTrail: React.FC<{
  frame: number;
  render: (frame: number) => React.ReactNode;
  samples?: number;
  spacing?: number; // frames between samples
  strength?: number; // 0..1
}> = ({ frame, render, samples = 5, spacing = 0.6, strength = 0.5 }) => (
  <>
    {Array.from({ length: samples }).map((_, k) => {
      const i = samples - k; // draw oldest first
      return (
        <div key={i} style={{ position: "absolute", inset: 0, opacity: strength * (1 - i / (samples + 1)) * 0.6 }}>
          {render(frame - i * spacing)}
        </div>
      );
    })}
    <div style={{ position: "absolute", inset: 0 }}>{render(frame)}</div>
  </>
);
