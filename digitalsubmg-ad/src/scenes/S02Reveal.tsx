import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedLogo, Wordmark } from "../components/AnimatedLogo";
import { BackgroundEnvironment, Node3D, Stage3D } from "../components/BackgroundEnvironment";
import { BeatTransition } from "../components/BeatTransition";
import { KineticText } from "../components/KineticText";
import { E, float, keys, springAt, tween } from "../lib/anim";
import { C } from "../lib/theme";
import { B } from "../lib/timing";

// SCENE 02 — DIGITALSUBMG REVEAL (b6–b11). Iris from the cyan pulse, giant
// DIGITALSUB rows sliding in depth (parallax), the official logo revealed by
// a mask and pushed toward camera, cyan halo following then fading.
export const S02Reveal: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const t = f - B(5.75);

  const iris = tween(f, B(5.75), B(6) + 14, [0, 1], E.inOut);
  const camRy = tween(f, B(6), B(11), [-9, 7], E.inOut);
  const camRx = tween(f, B(6), B(11), [7, 2], E.inOut);

  const rows = [
    { y: -720, z: -500, speed: -4.2, start: 260, fill: "rgba(255,255,255,0.10)" },
    { y: -280, z: -950, speed: 3.2, start: -900, stroke: "3px rgba(255,255,255,0.32)" },
    { y: 330, z: -350, speed: -5.6, start: 500, fill: "rgba(255,255,255,0.13)" },
    { y: 820, z: -800, speed: 3.8, start: -500, stroke: "3px rgba(0,229,242,0.35)" },
  ];

  const reveal = tween(f, B(7) - 6, B(7) + 14, [0, 1], E.out);
  const pop = springAt(f, B(7) - 6, { damping: 14, stiffness: 120 });
  const advance = tween(f, B(7), B(10.5), [0, 160], E.inOut);
  const flip = tween(f, B(10.4), B(11), [0, 90], E.in);
  const halo = keys(f, [B(7) - 4, B(7) + 10, B(9), B(10.5)], [0, 1, 0.45, 0.12], E.inOut);
  const word = tween(f, B(9) - 8, B(10), [0, 1], E.out);
  const exit = tween(f, B(10.6), B(11), [1, 0], E.in);

  return (
    <BeatTransition t={{ type: "iris", progress: iris }}>
      <BackgroundEnvironment top={C.electricLight} bottom="#05286E" light={C.cyan} lightY={42} lightSize={60} lightOpacity={0.18 + 0.35 * halo} vignette={0.45} />
      <Stage3D perspective={1100} camera={`rotateX(${camRx}deg) rotateY(${camRy}deg)`}>
        {rows.map((r, i) => (
          <Node3D key={i} transform={`translate3d(${r.start + t * r.speed * (1 + flip / 45)}px, ${r.y}px, ${r.z}px)`}>
            <KineticText
              text={"DIGITALSUB DIGITALSUB DIGITALSUB"}
              size={300}
              color={r.fill ?? "transparent"}
              stroke={r.stroke}
              style={{ position: "relative", left: 0, top: 0 }}
            />
          </Node3D>
        ))}
        <Node3D transform={`translate3d(0px, ${-110 + float(f, 8, 160)}px, ${-380 * (1 - pop) + advance}px) rotateY(${flip}deg) rotateX(${float(f, 1.5, 200)}deg)`}>
          <AnimatedLogo reveal={reveal} width={700} halo={halo} sweep={tween(f, B(8), B(9.2), [0, 1], E.inOut)} />
        </Node3D>
        <Node3D transform={`translate3d(0px, ${300}px, ${advance * 0.6}px)`} style={{ opacity: exit }}>
          <Wordmark progress={word} size={84} />
        </Node3D>
      </Stage3D>
    </BeatTransition>
  );
};
