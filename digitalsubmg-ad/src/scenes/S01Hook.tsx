import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BackgroundEnvironment } from "../components/BackgroundEnvironment";
import { KineticText, MotionTrail } from "../components/KineticText";
import { E, keys, tween } from "../lib/anim";
import { C } from "../lib/theme";
import { B } from "../lib/timing";

// SCENE 01 — THE HOOK (b0–b6). Light line -> PREMIUM opens from it, rotates to
// fill the vertical frame, becomes the backdrop for EN / UN / CLIC, cyan pulse.
export const S01Hook: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;

  const flash = keys(f, [0, 3, 50], [1, 0.95, 0.42], E.out);
  const push = tween(f, 0, B(6), [1, 1.16], E.speedRamp);
  const suck = tween(f, B(5.5), B(5.75) + 4, [1, 0], E.in);

  // light line
  const lineX = tween(f, 0, 20, [-1400, 0], E.out);
  const lineW = keys(f, [0, 16, 26], [700, 1500, 2400], E.out);
  const lineOpacity = keys(f, [0, 2, 24, 40], [0, 1, 1, 0]);

  // PREMIUM: opens vertically from the line, then rotates to vertical
  const rot = tween(f, B(2), B(3.6), [0, -90], E.speedRamp);
  const warp = keys(f, [B(2), B(2.8), B(3.6)], [0, 22, 0], E.inOut); // perspective warp during the turn
  const length = tween(f, B(2), B(3.6), [1, 1.06], E.inOut);
  const thick = tween(f, B(2), B(3.6), [1, 1.55], E.inOut);
  const backdrop = tween(f, B(4) - 4, B(4) + 8, [0, 1], E.out);
  // readable in full first (fits the width), then grows while turning to fill the height
  const fit = keys(f, [16, B(2), B(3.6)], [0.56, 0.6, 1], E.inOut);

  const premium = (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%,-50%) rotateZ(${rot}deg) rotateX(${warp}deg) scale(${length * fit}, ${thick * fit})`,
      }}
    >
      <KineticText
        text="PREMIUM"
        size={330}
        style={{ transform: "translate(-50%,-50%)" }}
        gradient={`linear-gradient(180deg, #FFFFFF 20%, #9EBBFF 100%)`}
        letterStyle={(i) => {
          const delay = Math.abs(i - 3) * 3;
          const open = tween(f, 16 + delay, 50 + delay, [0, 1], E.out);
          return { transform: `scaleY(${Math.max(0.015, open)})`, opacity: (open > 0 ? 1 : 0) * (1 - backdrop * 0.86) };
        }}
      />
      <KineticText
        text="PREMIUM"
        size={330}
        style={{ transform: "translate(-50%,-50%)", opacity: backdrop * 0.55 }}
        stroke={`3px ${C.cyan}`}
      />
    </div>
  );

  const word = (text: string, beat: number, y: number, size: number, dir: 1 | -1, color: string) => {
    const t0 = B(beat) - 6;
    if (f < t0) return null;
    return (
      <MotionTrail
        frame={f}
        samples={4}
        spacing={0.8}
        strength={0.7}
        render={(ff) => {
          const enter = tween(ff, t0, t0 + 10, [1, 0], E.out);
          const drift = (ff - t0) * 0.9 * dir; // letters keep travelling
          return (
            <KineticText
              text={text}
              size={size}
              color={color}
              style={{ transform: `translate(-50%,-50%) translate(${-dir * enter * 1500 + drift}px, ${y}px) skewX(${-dir * enter * 18}deg)` }}
              letterStyle={(i, n) => {
                const lag = tween(ff, t0 + (dir > 0 ? i : n - i) * 1.2, t0 + 10 + (dir > 0 ? i : n - i) * 1.2, [1, 0], E.out);
                return { transform: `translateX(${-dir * lag * 220}px)` };
              }}
            />
          );
        }}
      />
    );
  };

  const pulse = tween(f, B(5.75) - 6, B(5.75) + 6, [0, 1], E.out);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BackgroundEnvironment top={C.black} bottom="#030B1E" light={C.electricLight} lightY={55} lightSize={90} lightOpacity={flash} vignette={0.7} />
      <AbsoluteFill style={{ transform: `scale(${push * (0.25 + 0.75 * suck)})`, opacity: 0.2 + 0.8 * suck, perspective: 1600 }}>
        {premium}
        {word("EN", 4, -300, 300, 1, C.white)}
        {word("UN", 4.5, -20, 300, -1, C.white)}
        {word("CLIC", 5, 290, 330, 1, C.cyan)}
      </AbsoluteFill>
      {/* light line */}
      <div
        style={{
          position: "absolute",
          left: 540 + lineX - lineW / 2,
          top: 958,
          width: lineW,
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, transparent, ${C.cyan} 40%, #fff 50%, ${C.cyan} 60%, transparent)`,
          boxShadow: `0 0 40px 8px ${C.cyan}`,
          opacity: lineOpacity,
        }}
      />
      {/* cyan pulse that triggers the next scene */}
      {pulse > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 60,
            top: 960 - 60,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, #fff 0%, ${C.cyan} 35%, transparent 70%)`,
            transform: `scale(${pulse * 1.6})`,
            boxShadow: `0 0 120px 40px rgba(0,229,242,${0.6 * pulse})`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
