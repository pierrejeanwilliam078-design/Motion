import React from "react";
import { Img, staticFile } from "remotion";
import { LightSweep, Node3D } from "./BackgroundEnvironment";

export type Pose = {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  scale?: number;
};

export const poseToTransform = ({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = 1 }: Pose) =>
  `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;

/**
 * A premium product card floating in 3D: real product visual from the site,
 * physical thickness (stacked edge layers), key-light glow, light sweep,
 * floor shadow and soft reflection.
 */
export const ProductCard3D: React.FC<{
  src?: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
  pose: Pose;
  glow?: string;
  glowOpacity?: number;
  sweep?: number;
  radius?: number;
  thickness?: number;
  opacity?: number;
  edgeColor?: string;
  reflection?: boolean;
}> = ({
  src,
  children,
  width = 760,
  height = 604,
  pose,
  glow = "#00E5F2",
  glowOpacity = 0.5,
  sweep = 0,
  radius = 44,
  thickness = 22,
  opacity = 1,
  edgeColor = "#0b1630",
  reflection = true,
}) => {
  const layers = Math.ceil(thickness / 3);
  const face = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        background: "#0b1220",
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.18)",
      }}
    >
      {src ? <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.25) 100%)",
        }}
      />
      <LightSweep progress={sweep} />
    </div>
  );
  return (
    <Node3D transform={poseToTransform(pose)} style={{ width, height, opacity }}>
      {/* key light behind the card */}
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          background: `radial-gradient(50% 50% at 50% 50%, ${glow} 0%, transparent 70%)`,
          opacity: glowOpacity,
          transform: "translateZ(-160px)",
          filter: "blur(10px)",
        }}
      />
      {/* floor shadow */}
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          bottom: -90,
          height: 60,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          filter: "blur(28px)",
          transform: "translateZ(-40px)",
        }}
      />
      {/* thickness */}
      {Array.from({ length: layers }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: edgeColor,
            transform: `translateZ(${-(i + 1) * 3}px)`,
            boxShadow: i === layers - 1 ? "0 40px 90px rgba(0,0,0,0.55)" : undefined,
          }}
        />
      ))}
      {face}
      {reflection ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            width: "100%",
            height: "100%",
            marginTop: 26,
            transform: "scaleY(-1)",
            opacity: 0.18,
            maskImage: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 38%)",
            WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 38%)",
            borderRadius: radius,
            overflow: "hidden",
          }}
        >
          {src ? <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : children}
        </div>
      ) : null}
    </Node3D>
  );
};

/** A true CSS cuboid (front / side / top faces) — used for the Canva Pro box. */
export const Box3D: React.FC<{
  w: number;
  h: number;
  d: number;
  front: React.ReactNode;
  side: string;
  top: string;
  sweep?: number;
}> = ({ w, h, d, front, side, top, sweep = 0 }) => (
  <div style={{ position: "relative", width: w, height: h, transformStyle: "preserve-3d" }}>
    <div style={{ position: "absolute", inset: 0, transform: `translateZ(${d / 2}px)`, overflow: "hidden", borderRadius: 10 }}>
      {front}
      <LightSweep progress={sweep} opacity={0.7} />
    </div>
    <div style={{ position: "absolute", top: 0, left: -d / 2, width: d, height: h, background: side, transform: "rotateY(-90deg)", borderRadius: 8 }} />
    <div style={{ position: "absolute", top: 0, left: w - d / 2, width: d, height: h, background: side, transform: "rotateY(90deg)", borderRadius: 8 }} />
    <div style={{ position: "absolute", left: 0, top: -d / 2, width: w, height: d, background: top, transform: "rotateX(90deg)", borderRadius: 8 }} />
    <div style={{ position: "absolute", left: 0, top: h - d / 2, width: w, height: d, background: side, transform: "rotateX(-90deg)", borderRadius: 8 }} />
    <div style={{ position: "absolute", inset: 0, transform: `translateZ(${-d / 2}px)`, background: side, borderRadius: 10 }} />
  </div>
);
