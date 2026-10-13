import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BackgroundEnvironment, Node3D, Stage3D } from "../components/BackgroundEnvironment";
import { BeatTransition } from "../components/BeatTransition";
import { KineticText, RingText } from "../components/KineticText";
import { CHOISIR_Y, CatalogScreen, PhoneMockup } from "../components/PhoneMockup";
import { E, float, keys, springAt, tween } from "../lib/anim";
import { C } from "../lib/theme";
import { B } from "../lib/timing";

const PHONE_W = 560;
const PHONE_H = PHONE_W * 2.07;
const BEZEL = PHONE_W * 0.028;
const SCREEN_W = PHONE_W - 2 * BEZEL;
const K = SCREEN_W / 390;
const SCROLL = 34;
// Choisir button (card 1) relative to the phone's centre, in px
export const BTN = { x: BEZEL + 224 * K - PHONE_W / 2, y: BEZEL + (CHOISIR_Y - SCROLL) * K - PHONE_H / 2 };

const Headline: React.FC<{ f: number; text: string; beat: number; until: number }> = ({ f, text, beat, until }) => {
  const a = B(beat);
  const b = B(until);
  if (f < a - 2 || f > b + 2) return null;
  return (
    <KineticText
      text={text}
      size={150}
      color={C.ink}
      style={{ transform: "translate(-50%,-50%) translateY(-770px)" }}
      letterStyle={(i, n) => {
        const inn = tween(f, a + i * 1.1, a + 12 + i * 1.1, [1, 0], E.out);
        const out = tween(f, b - 11 + i * 0.6, b - 2 + i * 0.6, [0, 1], E.in);
        return {
          transform: `translateY(${inn * 160 - out * 160}px) rotateX(${inn * -70 + out * 70}deg)`,
          opacity: (1 - inn) * (1 - out),
          color: i === n - 1 ? C.cyan : undefined,
        };
      }}
    />
  );
};

// SCENE 04 — ONE CLICK EXPERIENCE (b22–b30)
export const S04OneClick: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const wipe = tween(f, B(21.5), B(22) + 18, [0, 1], E.inOut);
  const enter = springAt(f, B(22) - 4, { damping: 17, stiffness: 90 });
  const dolly = tween(f, B(28.2), B(29.4), [0, 1], E.inOut);
  const scale = 1 + 2.4 * dolly;
  const rx = (24 * (1 - enter) + 9) * (1 - dolly);
  const ry = (-22 * (1 - enter) - 12 + float(f, 3, 200)) * (1 - dolly);
  const y = 900 * (1 - enter) + 60 + float(f, 10, 160) * (1 - dolly);
  const tx = -BTN.x * scale * dolly;
  const ty = -BTN.y * scale * dolly - 60 * dolly;

  const ringIn = tween(f, B(22.5), B(23.5), [0, 1], E.out);
  const ringOut = tween(f, B(27.6), B(28.4), [0, 1], E.in);
  const ring = {
    text: "CHOISIR · CHOISIR · ",
    radius: 560 + 200 * ringOut,
    size: 200,
    rotation: 200 + (f - B(22)) * 0.9,
    tilt: -20,
    arc: 330,
    y: 360,
    color: C.ink,
    backColor: "#B9C3D8",
    opacity: ringIn * (1 - ringOut),
  };

  // touch indicator (inside the screen, 390-space)
  const touchIn = tween(f, B(24.2), B(24.8), [0, 1], E.out);
  const touchPress = keys(f, [B(25) - 3, B(25), B(25) + 8], [1, 0.78, 1]);
  const touchOut = tween(f, B(25.8), B(26.4), [0, 1], E.in);
  const tx390 = 224 + 120 * (1 - touchIn);
  const ty390 = CHOISIR_Y - SCROLL + 160 * (1 - touchIn);

  const fill = tween(f, B(29), B(29.6), [0, 1], E.in); // navy button grows to fullscreen

  return (
    <BeatTransition t={{ type: "wipeUp", progress: wipe }}>
      <BackgroundEnvironment top="#FFFFFF" bottom="#E8EEF8" light="#BFD3FF" lightY={30} lightSize={90} lightOpacity={0.7} grid gridColor="rgba(14,27,61,0.6)" gridOpacity={0.08} gridShiftY={-f * 0.5} vignette={0.08} />
      <Headline f={f} text="CHOISISSEZ." beat={23} until={25} />
      <Headline f={f} text="CLIQUEZ." beat={25} until={27} />
      <Headline f={f} text="PROFITEZ." beat={27} until={28.4} />
      <Stage3D perspective={1500}>
        <RingText {...ring} layer="back" />
        <Node3D transform={`translate3d(${tx}px, ${y + ty}px, 0px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`}>
          <PhoneMockup width={PHONE_W} glare={tween(f, B(22), B(28), [0.1, 0.9])}>
            <CatalogScreen
              screenWidth={SCREEN_W}
              scroll={tween(f, B(22.5), B(24), [0, SCROLL], E.inOut)}
              selected={tween(f, B(24) - 4, B(24) + 10, [0, 1], E.out)}
              press={keys(f, [B(25) - 2, B(25) + 3, B(25) + 16], [0, 1, 0.7])}
              tap={tween(f, B(25), B(25) + 28)}
            />
            {touchIn > 0 && touchOut < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: tx390 * K - 34,
                  top: ty390 * K - 34,
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.55)",
                  border: "3px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 10px 30px rgba(14,27,61,0.35)",
                  transform: `scale(${touchPress * (1 - touchOut * 0.6)})`,
                  opacity: touchIn * (1 - touchOut),
                }}
              />
            ) : null}
          </PhoneMockup>
        </Node3D>
        <RingText {...ring} layer="front" />
      </Stage3D>
      {fill > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 2300 * fill,
            top: 960 - 2300 * fill,
            width: 4600 * fill,
            height: 4600 * fill,
            borderRadius: "50%",
            background: C.navyButton,
          }}
        />
      ) : null}
    </BeatTransition>
  );
};
