import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { E, float, keys, springAt, tween } from "../lib/anim";
import { C, FONT } from "../lib/theme";
import { B } from "../lib/timing";
import { AnimatedLogo } from "./AnimatedLogo";
import { BackgroundEnvironment, Node3D, Stage3D } from "./BackgroundEnvironment";
import { KineticText } from "./KineticText";

// SCENE 08 — FINAL BRAND REVEAL (b53–b64). Beat stop, cyan halo from the
// point left by scene 7, official logo, PREMIUM drifting in depth, slogan,
// then the URL on the final hit. Logo + URL stay until the last frame.
export const FinalBrandReveal: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const halo = keys(f, [B(52.8), B(54), B(57), B(60), B(60) + 10, B(64)], [0, 1, 0.55, 0.5, 0.9, 0.6], E.inOut);
  const logoIn = springAt(f, B(54) - 6, { damping: 15, stiffness: 110 });
  const reveal = tween(f, B(54) - 6, B(54) + 12, [0, 1], E.out);
  const push = tween(f, B(53), B(64), [1, 1.05], (x) => x);
  const depth = tween(f, B(53), B(64), [-250, -1100], (x) => x);

  const line = (text: string, at: number, style: React.CSSProperties, y: number, key: string) => {
    const p = tween(f, at - 6, at + 12, [0, 1], E.out);
    return (
      <div key={key} style={{ position: "absolute", left: 0, right: 0, top: y, height: style.fontSize as number * 1.2, overflow: "hidden", display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${(1 - p) * 110}%)`, whiteSpace: "nowrap", ...style }}>{text}</div>
      </div>
    );
  };

  const url = springAt(f, B(60) - 4, { damping: 13, stiffness: 160 });
  const urlFlash = tween(f, B(60), B(60) + 28, [1, 0], E.out);

  return (
    <AbsoluteFill>
      <BackgroundEnvironment top={C.nightDeep} bottom="#01040B" vignette={0.75} />
      <AbsoluteFill style={{ background: `radial-gradient(38% 24% at 50% 40%, rgba(0,229,242,0.55) 0%, rgba(11,87,216,0.25) 45%, transparent 75%)`, opacity: halo, transform: `scale(${0.4 + 0.6 * Math.min(1, halo * 1.4)})` }} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Stage3D perspective={1200} camera={`rotateX(${8 + float(f, 1.5, 300)}deg)`}>
          <Node3D transform={`translate3d(${tween(f, B(53), B(64), [120, -120], (x) => x)}px, -330px, ${depth}px)`} style={{ opacity: tween(f, B(53.5), B(55), [0, 1]) }}>
            <KineticText text="PREMIUM" size={420} stroke="3px rgba(0,229,242,0.35)" style={{ position: "relative", left: 0, top: 0 }} />
          </Node3D>
          <Node3D transform={`translate3d(${tween(f, B(53), B(64), [-200, 200], (x) => x)}px, 180px, ${depth - 400}px)`} style={{ opacity: 0.08 * tween(f, B(53.5), B(55), [0, 1]) }}>
            <KineticText text="PREMIUM" size={420} color="#fff" style={{ position: "relative", left: 0, top: 0 }} />
          </Node3D>
          <Node3D transform={`translate3d(0px, ${-360 + float(f, 6, 200)}px, ${-300 * (1 - logoIn)}px) rotateY(${float(f, 3, 260)}deg)`}>
            <AnimatedLogo reveal={reveal} width={720} halo={0.75 * halo} sweep={tween(f, B(55), B(56.6)) || tween(f, B(61), B(62.6))} />
          </Node3D>
        </Stage3D>
        {line("VOS ABONNEMENTS", B(56.8), { fontFamily: FONT.heading, fontWeight: 700, fontSize: 84, color: "#fff", letterSpacing: "0.06em" }, 960 + 10, "l1")}
        {line("PREMIUM", B(58), { fontFamily: FONT.display, fontSize: 172, color: C.cyan, letterSpacing: "-0.01em", lineHeight: 1 }, 960 + 110, "l2")}
        {line("EN UN CLIC.", B(59), { fontFamily: FONT.heading, fontWeight: 700, fontSize: 84, color: "#fff", letterSpacing: "0.06em" }, 960 + 330, "l3")}
        {/* URL — the site's primary button style */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 960 + 500, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              position: "relative",
              transform: `scale(${url})`,
              opacity: Math.min(1, url * 2),
              background: "#fff",
              color: C.ink,
              borderRadius: 30,
              padding: "34px 64px",
              fontFamily: FONT.heading,
              fontWeight: 700,
              fontSize: 72,
              letterSpacing: "0.01em",
              boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 ${120 * urlFlash}px rgba(0,229,242,${0.9 * urlFlash})`,
              display: "flex",
              alignItems: "center",
              gap: 26,
            }}
          >
            digitalsub.org
            <span style={{ fontSize: 64, color: C.electric }}>→</span>
          </div>
        </div>
      </AbsoluteFill>
      {urlFlash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: urlFlash * 0.12 }} /> : null}
    </AbsoluteFill>
  );
};
