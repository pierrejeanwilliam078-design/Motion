import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Scene backdrop: base gradient, one cinematic key light, the dotted grid
 * seen on digitalsub.org's hero, and a vignette. No particles.
 */
export const BackgroundEnvironment: React.FC<{
  top: string;
  bottom: string;
  light?: string;
  lightX?: number; // %
  lightY?: number; // %
  lightSize?: number; // % of width
  lightOpacity?: number;
  grid?: boolean;
  gridColor?: string;
  gridOpacity?: number;
  gridShiftX?: number;
  gridShiftY?: number;
  vignette?: number;
}> = ({
  top,
  bottom,
  light,
  lightX = 50,
  lightY = 45,
  lightSize = 70,
  lightOpacity = 0.6,
  grid = false,
  gridColor = "rgba(255,255,255,0.5)",
  gridOpacity = 0.12,
  gridShiftX = 0,
  gridShiftY = 0,
  vignette = 0.5,
}) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)` }}>
    {light ? (
      <AbsoluteFill
        style={{
          background: `radial-gradient(${lightSize}% ${lightSize * 0.75}% at ${lightX}% ${lightY}%, ${light} 0%, transparent 70%)`,
          opacity: lightOpacity,
        }}
      />
    ) : null}
    {grid ? (
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${gridColor} 1.6px, transparent 1.8px)`,
          backgroundSize: "34px 34px",
          backgroundPosition: `${gridShiftX}px ${gridShiftY}px`,
          opacity: gridOpacity,
          maskImage: "radial-gradient(80% 60% at 50% 50%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(80% 60% at 50% 50%, #000 30%, transparent 100%)",
        }}
      />
    ) : null}
    {vignette > 0 ? (
      <AbsoluteFill
        style={{ background: `radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,${vignette}) 100%)` }}
      />
    ) : null}
  </AbsoluteFill>
);

/** A perspective stage with a camera transform applied to the world. */
export const Stage3D: React.FC<{
  perspective?: number;
  camera?: string; // CSS transform applied to the world (dolly / orbit)
  originY?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ perspective = 1400, camera = "", originY = "50%", children, style }) => (
  <AbsoluteFill style={{ perspective, perspectiveOrigin: `50% ${originY}`, ...style }}>
    <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: camera }}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

/** Centered absolutely-positioned 3D node. */
export const Node3D: React.FC<{
  transform: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ transform, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transformStyle: "preserve-3d",
      transform: `translate(-50%, -50%) ${transform}`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Subtle diagonal light sweep, clipped by the parent (overflow hidden). */
export const LightSweep: React.FC<{ progress: number; opacity?: number; width?: number; angle?: number }> = ({
  progress,
  opacity = 0.55,
  width = 34,
  angle = 18,
}) =>
  progress <= 0 || progress >= 1 ? null : (
    <div
      style={{
        position: "absolute",
        inset: "-20%",
        background: `linear-gradient(${90 + angle}deg, transparent ${progress * 140 - 20 - width / 2}%, rgba(255,255,255,${opacity}) ${
          progress * 140 - 20
        }%, transparent ${progress * 140 - 20 + width / 2}%)`,
        mixBlendMode: "soft-light",
        pointerEvents: "none",
      }}
    />
  );
