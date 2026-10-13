import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BackgroundEnvironment } from "../components/BackgroundEnvironment";
import { BeatTransition } from "../components/BeatTransition";
import { CheckCircleIcon } from "../components/Icons";
import { CurvedText, KineticText } from "../components/KineticText";
import { PaymentBadges } from "../components/PaymentBadges";
import { E, tween } from "../lib/anim";
import { C, FONT } from "../lib/theme";
import { B } from "../lib/timing";

const CHECK = { x: 540, y: 960 + 430 };

const Layer: React.FC<{ f: number; dark: boolean }> = ({ f, dark }) => {
  const rise = tween(f, B(31), B(32), [0, 1], E.out);
  const bend = tween(f, B(37.8), B(39.4), [-10, 120], E.inOut);
  const drift = tween(f, B(31), B(41), [47, 53], (x) => x);
  const label = tween(f, B(30.4), B(31.2), [0, 1], E.out);
  const check = tween(f, B(39), B(39) + 26, [0, 1], E.out);
  const simple = tween(f, B(40), B(40) + 14, [0, 1], E.out);
  return (
    <AbsoluteFill>
      {dark ? (
        <BackgroundEnvironment top="#0A2766" bottom={C.night} light={C.cyan} lightY={72} lightSize={70} lightOpacity={0.3} vignette={0.5} />
      ) : (
        <BackgroundEnvironment top="#FFFFFF" bottom="#EEF2F9" grid gridColor="rgba(14,27,61,0.7)" gridOpacity={0.07} gridShiftX={f * 0.4} vignette={0.06} />
      )}
      <KineticText
        text="PAYEZ EN"
        size={64}
        font={FONT.heading}
        color={dark ? "rgba(255,255,255,0.75)" : "#5B6478"}
        letterSpacing={0.32}
        style={{ transform: `translate(-50%,-50%) translateY(${-470 + (1 - label) * 30}px)`, opacity: label, fontWeight: 700 }}
      />
      {/* ARIARY: huge, slanted, then curving around the capsules */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${(1 - rise) * 260}px) skewX(-10deg) rotate(-6deg) scale(${1.25 - 0.25 * rise})`,
          opacity: rise,
          clipPath: `inset(0 -40% ${(1 - rise) * 60}% -40%)`,
        }}
      >
        <CurvedText
          id={dark ? "ariary-d" : "ariary-l"}
          text="ARIARY"
          width={1080}
          height={700}
          bend={bend}
          size={310}
          offset={drift}
          fill={dark ? "url(#ariaryGrad)" : C.ink}
          letterSpacing={-6}
          style={{ left: 0, top: 960 - 350 - 40 }}
          defs={
            <linearGradient id="ariaryGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={C.cyan} />
              <stop offset="100%" stopColor="#3D7BFF" />
            </linearGradient>
          }
        />
      </div>
      <AbsoluteFill style={{ perspective: 1400 }}>
        <PaymentBadges frame={f} dark={dark} />
      </AbsoluteFill>
      {check > 0 ? (
        <div style={{ position: "absolute", left: CHECK.x - 90, top: CHECK.y - 90 + 60 }}>
          <CheckCircleIcon size={180} color={dark ? C.cyan : C.electric} stroke={1.6} draw={check} />
        </div>
      ) : null}
      {dark && simple > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1660, display: "flex", justifyContent: "center", overflow: "hidden", height: 140 }}>
          <div
            style={{
              fontFamily: FONT.heading,
              fontWeight: 700,
              fontSize: 100,
              letterSpacing: "0.05em",
              color: "#fff",
              transform: `translateY(${(1 - simple) * 130}px)`,
            }}
          >
            PAIEMENT <span style={{ color: C.cyan }}>SIMPLE.</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// SCENE 05 — PAYMENT EXPERIENCE (b30–b41). White, then an inverse reveal to
// deep blue from the validation check.
export const S05Payment: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const iris = tween(f, B(29.5), B(30) + 12, [0, 1], E.inOut);
  const darkR = tween(f, B(39) + 4, B(40) + 4, [0, 1], E.inOut);
  const whip = tween(f, B(40.6), B(41.2), [0, 1], E.in);
  return (
    <BeatTransition t={{ type: "iris", progress: iris, ring: C.navyButton }}>
      <AbsoluteFill style={{ transform: `translateX(${-1080 * whip}px)`, filter: whip > 0.05 ? `blur(${whip * 14}px)` : undefined }}>
        <Layer f={f} dark={false} />
        <BeatTransition t={{ type: "iris", progress: darkR, x: CHECK.x, y: CHECK.y + 60, ring: C.cyan }}>
          <Layer f={f} dark />
        </BeatTransition>
      </AbsoluteFill>
    </BeatTransition>
  );
};
