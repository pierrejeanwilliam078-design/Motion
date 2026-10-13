import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BackgroundEnvironment } from "../components/BackgroundEnvironment";
import { BeatTransition } from "../components/BeatTransition";
import { KineticText } from "../components/KineticText";
import { E, keys, springAt, tween } from "../lib/anim";
import { C, FONT } from "../lib/theme";
import { B } from "../lib/timing";
import { PROOF_CARD } from "./S06Trust";

// SCENE 07 — SOCIAL PROOF (b49–b53). The site's "500+" card expands to
// fullscreen; the number grows fast then settles; a wave crosses the frame.
export const S07Proof: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const expand = tween(f, B(48.3), B(49), [0, 1], E.inOut);
  const grow = springAt(f, B(48.7), { damping: 11, stiffness: 120 });
  const count = Math.round(tween(f, B(48.6), B(49.6), [0, 500], E.out));
  const cardY = PROOF_CARD.y + PROOF_CARD.h / 2 - 960;
  const y = cardY * (1 - grow) - 90 * grow;
  const scale = 0.24 + 0.76 * grow;
  const wave = tween(f, B(51), B(52.4), [0, 1], E.out);
  const bump = keys(f, [B(51), B(51) + 5, B(51) + 22], [1, 1.05, 1], E.out);
  const clients = tween(f, B(50.8), B(51.6), [0, 1], E.out);
  const collapse = tween(f, B(52.5), B(53), [1, 0], E.in);

  return (
    <BeatTransition t={{ type: "rect", progress: expand, from: PROOF_CARD }}>
      <BackgroundEnvironment top="#0B2A66" bottom={C.night} light={C.cyan} lightY={45} lightSize={70} lightOpacity={0.22 + 0.2 * (1 - wave)} grid gridOpacity={0.07} vignette={0.6} />
      <AbsoluteFill style={{ transform: `scale(${collapse})`, opacity: collapse }}>
        <KineticText
          text={`${count}+`}
          size={380}
          gradient={`linear-gradient(180deg, #FFFFFF 30%, ${C.cyan} 100%)`}
          letterSpacing={-0.04}
          style={{ transform: `translate(-50%,-50%) translateY(${y}px) scale(${scale * bump})` }}
          letterStyle={(i) => ({ transform: `translateY(${Math.sin(wave * Math.PI * 2 - i * 0.9) * 22 * (1 - wave)}px)` })}
        />
        <div
          style={{
            position: "absolute",
            top: 960 + 230,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.heading,
            fontWeight: 700,
            fontSize: 110,
            color: "#fff",
            letterSpacing: `${0.38 + (1 - clients) * 0.6}em`,
            paddingLeft: "0.38em",
            opacity: clients,
          }}
        >
          CLIENTS
        </div>
        {wave > 0 && wave < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 1500 * wave,
              top: 870 - 1500 * wave,
              width: 3000 * wave,
              height: 3000 * wave,
              borderRadius: "50%",
              border: `4px solid rgba(0,229,242,${0.8 * (1 - wave)})`,
              boxShadow: `0 0 60px rgba(0,229,242,${0.5 * (1 - wave)}), inset 0 0 60px rgba(0,229,242,${0.3 * (1 - wave)})`,
            }}
          />
        ) : null}
      </AbsoluteFill>
      {collapse < 1 ? (
        <div style={{ position: "absolute", left: 540 - 14, top: 960 - 14, width: 28, height: 28, borderRadius: 14, background: "#fff", boxShadow: `0 0 50px 18px ${C.cyan}`, opacity: 1 - collapse }} />
      ) : null}
    </BeatTransition>
  );
};
