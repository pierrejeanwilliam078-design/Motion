import React from "react";
import { Img, staticFile } from "remotion";
import { C, FONT } from "../lib/theme";
import { LightSweep } from "./BackgroundEnvironment";

/**
 * The official DigitalSubMG logo (public/brand/logo.png, extracted from the
 * site) on a white plate so its dark "DIGITAL" lettering stays legible on
 * every background. The logo itself is never redrawn or altered.
 * Replace public/brand/logo.png with the HD file for a sharper result.
 */
export const AnimatedLogo: React.FC<{
  reveal: number; // 0..1 horizontal mask opening
  width?: number;
  halo?: number; // 0..1 cyan halo intensity
  sweep?: number;
  shadow?: number;
}> = ({ reveal, width = 640, halo = 0, sweep = 0, shadow = 1 }) => {
  const h = width * 0.5;
  const inset = (1 - reveal) * 50;
  return (
    <div style={{ position: "relative", width, height: h, transformStyle: "preserve-3d" }}>
      <div
        style={{
          position: "absolute",
          inset: "-60%",
          background: `radial-gradient(45% 45% at 50% 50%, ${C.cyan} 0%, rgba(0,229,242,0.25) 35%, transparent 70%)`,
          opacity: halo,
          transform: "translateZ(-120px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: width * 0.075,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F2F5FA 100%)",
          boxShadow: `0 ${30 * shadow}px ${90 * shadow}px rgba(3,10,24,${0.45 * shadow}), inset 0 0 0 2px rgba(255,255,255,0.9)`,
          clipPath: `inset(0 ${inset}% 0 ${inset}% round ${width * 0.075}px)`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img src={staticFile("brand/logo.png")} style={{ width: "82%", height: "auto" }} />
        <LightSweep progress={sweep} opacity={0.9} />
      </div>
    </div>
  );
};

/** Brand name set in the site's heading typeface (not a logo replacement). */
export const Wordmark: React.FC<{ progress: number; size?: number; color?: string; accent?: string }> = ({
  progress,
  size = 92,
  color = "#fff",
  accent = C.cyan,
}) => {
  const word = "DIGITALSUBMG";
  return (
    <div style={{ display: "flex", fontFamily: FONT.heading, fontWeight: 700, fontSize: size, letterSpacing: "0.14em", color }}>
      {[...word].map((ch, i) => {
        const p = Math.max(0, Math.min(1, progress * (word.length + 4) - i));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 40}px)`,
              color: i >= 10 ? accent : color,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};
