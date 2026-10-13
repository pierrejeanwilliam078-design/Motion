import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BackgroundEnvironment, Node3D, Stage3D } from "../components/BackgroundEnvironment";
import { BeatTransition } from "../components/BeatTransition";
import { CurvedText, KineticText, MotionTrail, RingText } from "../components/KineticText";
import { Box3D, ProductCard3D } from "../components/ProductCard3D";
import { E, float, keys, springAt, tween } from "../lib/anim";
import { C, FONT, PRODUCT_LIGHT } from "../lib/theme";
import { B } from "../lib/timing";

// SCENE 03 — PRODUCT SHOWCASE (b11–b22). Five products, five different
// entrances, each with its name in monumental type partly hidden by the card.
const HITS = { netflix: B(11), prime: B(13), chatgpt: B(15), spotify: B(17), canva: B(19), end: B(21.4) };

const Netflix: React.FC<{ f: number }> = ({ f }) => {
  const f0 = HITS.netflix;
  const next = HITS.prime;
  if (f < f0 - 12 || f > next + 8) return null;
  const inP = tween(f, f0 - 10, f0 + 22, [0, 1], E.out);
  const out = tween(f, next - 14, next + 4, [0, 1], E.in);
  const orbit = tween(f, f0, next, [-14, 10], E.inOut);
  const dolly = tween(f, f0, next, [0, 200], E.inOut);
  const bend = tween(f, f0 - 4, f0 + 36, [0, 230], E.out);
  return (
    <Stage3D perspective={1300} camera={`translateZ(${dolly}px) rotateY(${tween(f, f0, next, [5, -5])}deg)`}>
      <Node3D transform={`translate3d(0px, -470px, -220px) scale(${1 + out * 1.8}, ${1 - out * 0.2})`} style={{ opacity: tween(f, f0 - 8, f0 + 6) * (1 - out) }}>
        <CurvedText id="nfx" text="NETFLIX" width={1080} height={420} bend={bend} size={280} fill={PRODUCT_LIGHT.netflix} style={{ left: -540, top: -210 }} />
      </Node3D>
      <Node3D transform={`translate3d(0px, 470px, -220px) scale(${1 + out * 1.8}, ${1 - out * 0.2})`} style={{ opacity: 0.7 * tween(f, f0, f0 + 12) * (1 - out) }}>
        <CurvedText id="nfx2" text="NETFLIX" width={1080} height={420} bend={-bend} size={280} stroke={PRODUCT_LIGHT.netflix} strokeWidth={4} style={{ left: -540, top: -210 }} />
      </Node3D>
      <ProductCard3D
        src="products/netflix.png"
        pose={{ x: -680 * (1 - inP), y: float(f, 12, 150), z: 1300 * out, ry: -90 * (1 - inP) + orbit + 40 * out, rz: -5 * (1 - inP) }}
        glow={PRODUCT_LIGHT.netflix}
        glowOpacity={0.55}
        sweep={tween(f, f0 + 10, f0 + 46)}
        opacity={1 - tween(f, next - 2, next + 6)}
      />
    </Stage3D>
  );
};

const Prime: React.FC<{ f: number }> = ({ f }) => {
  const f0 = HITS.prime;
  const next = HITS.chatgpt;
  if (f < f0 - 10 || f > next + 10) return null;
  const t = f - f0;
  const inP = tween(f, f0 - 8, f0 + 22, [0, 1], E.out);
  const out = tween(f, next - 10, next + 6, [0, 1], E.in);
  const txt = tween(f, f0 - 4, f0 + 14, [0, 1], E.out);
  const blur = 18 * (1 - inP);
  return (
    <Stage3D perspective={1300} camera={`rotateX(${tween(f, f0, next, [4, -2])}deg)`}>
      <Node3D transform={`translate3d(${260 - t * 3.2 - out * 900}px, -480px, ${-900 + txt * 700}px)`} style={{ opacity: txt }}>
        <KineticText text="PRIME" size={290} color="#fff" style={{ position: "relative", left: 0, top: 0 }} />
      </Node3D>
      <Node3D transform={`translate3d(${-260 + t * 3.2 + out * 900}px, 480px, ${-900 + txt * 700}px)`} style={{ opacity: txt }}>
        <KineticText text="VIDEO" size={290} color={PRODUCT_LIGHT.prime} style={{ position: "relative", left: 0, top: 0 }} />
      </Node3D>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
        <ProductCard3D
          src="products/prime-video.png"
          pose={{ x: -1500 * out, y: float(f, 10, 140, 40), z: -3200 * (1 - inP), ry: tween(f, f0, next, [10, -8]) - 30 * out, rx: 4 }}
          glow={PRODUCT_LIGHT.prime}
          glowOpacity={0.6}
          sweep={tween(f, f0 + 14, f0 + 48)}
        />
      </div>
    </Stage3D>
  );
};

const ChatGPT: React.FC<{ f: number }> = ({ f }) => {
  const f0 = HITS.chatgpt;
  const next = HITS.spotify;
  if (f < f0 - 10 || f > next + 10) return null;
  const t = f - f0;
  const inP = tween(f, f0 - 10, f0 + 22, [0, 1], E.out);
  const out = tween(f, next - 10, next + 6, [0, 1], E.in);
  return (
    <Stage3D perspective={1200} originY="40%">
      {/* perspective-warped floor typography travelling toward the camera */}
      <Node3D transform={`translate3d(0px, 600px, -150px) rotateX(60deg)`} style={{ opacity: tween(f, f0 - 6, f0 + 8) * (1 - out) }}>
        <KineticText
          text="CHATGPT"
          size={330}
          gradient={`linear-gradient(180deg, ${C.cyan} 0%, #ffffff 100%)`}
          style={{ position: "relative", left: 0, top: 0, transform: `translateY(${-420 + t * 5}px)` }}
        />
      </Node3D>
      <Node3D transform={`translate3d(0px, -540px, -400px)`} style={{ opacity: 0.45 * tween(f, f0, f0 + 10) * (1 - out) }}>
        <KineticText text="CHATGPT" size={250} stroke={`3px ${C.cyan}`} style={{ position: "relative", left: 0, top: 0 }} />
      </Node3D>
      <ProductCard3D
        src="products/chatgpt.png"
        pose={{ x: 420 * (1 - inP) - 260 * out, y: float(f, 10, 150, 80), ry: 80 * (1 - inP) + tween(f, f0, next, [-10, 12]) - 105 * out, rz: 4 * (1 - inP) }}
        glow={C.cyan}
        glowOpacity={0.85}
        sweep={tween(f, f0 + 2, f0 + 34)}
        edgeColor="#e9eef3"
      />
    </Stage3D>
  );
};

const Spotify: React.FC<{ f: number }> = ({ f }) => {
  const f0 = HITS.spotify;
  const next = HITS.canva;
  if (f < f0 - 10 || f > next + 10) return null;
  const t = f - f0;
  const r = tween(f, f0 - 8, f0 + 16, [0, 1300], E.inOut);
  const out = tween(f, next - 10, next + 6, [0, 1], E.in);
  const pop = springAt(f, f0 - 6, { damping: 14 });
  const rot = 120 + t * 1.4 + out * 60;
  const ring = { text: "SPOTIFY · SPOTIFY · ", radius: 520, size: 180, rotation: rot, tilt: -24, arc: 330, y: 130, color: PRODUCT_LIGHT.spotify, backColor: "rgba(30,215,96,0.4)" };
  const clip = r >= 1299 ? undefined : `circle(${r}px at 540px 960px)`;
  return (
    <AbsoluteFill style={{ clipPath: clip }}>
      <Stage3D perspective={1400}>
        <RingText {...ring} layer="back" />
        <ProductCard3D
          src="products/spotify.png"
          pose={{ z: -300 * (1 - pop) - 700 * out, scale: 1 - out * 0.3, ry: float(f, 6, 180), y: float(f, 10, 150, 20) }}
          glow={PRODUCT_LIGHT.spotify}
          glowOpacity={0.6}
          sweep={tween(f, f0 + 8, f0 + 40)}
          opacity={1 - out}
        />
        <RingText {...ring} layer="front" />
      </Stage3D>
      {r < 1299 ? (
        <div style={{ position: "absolute", left: 540 - r, top: 960 - r, width: 2 * r, height: 2 * r, borderRadius: "50%", boxShadow: `inset 0 0 0 5px ${PRODUCT_LIGHT.spotify}`, opacity: 0.8 }} />
      ) : null}
    </AbsoluteFill>
  );
};

const CanvaFront: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg, #0D1226 0%, #141B3A 55%, #1C1146 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 44 }}>
    <div style={{ position: "absolute", left: -80, right: -80, top: 120, height: 190, background: "linear-gradient(90deg, #00C4CC, #7D2AE8)", transform: "rotate(-14deg)", opacity: 0.9, filter: "blur(2px)" }} />
    <div style={{ position: "absolute", left: -80, right: -80, top: 150, height: 6, background: "rgba(255,255,255,0.7)", transform: "rotate(-14deg)" }} />
    <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 104, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>Canva</div>
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
      <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 40, color: "#fff", background: "linear-gradient(90deg, #00C4CC, #7D2AE8)", padding: "6px 22px", borderRadius: 999 }}>PRO</div>
      <div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 30, color: "rgba(255,255,255,0.75)" }}>Premium</div>
    </div>
  </div>
);

const Canva: React.FC<{ f: number }> = ({ f }) => {
  const f0 = HITS.canva;
  if (f < f0 - 10 || f > B(22) + 6) return null;
  const t = f - f0;
  const render = (ff: number) => {
    const inP = springAt(ff, f0 - 8, { damping: 13, stiffness: 150 });
    const out = tween(ff, HITS.end, B(22), [0, 1], E.in);
    const y = 1500 * (1 - inP) - 1900 * out + float(ff, 10, 150);
    return (
      <Stage3D perspective={1300}>
        <Node3D transform={`translate3d(0px, ${y}px, 0px) rotateX(10deg) rotateY(${-26 + float(ff, 6, 170)}deg) rotateZ(${8 * (1 - inP)}deg)`}>
          <Box3D w={440} h={580} d={120} front={<CanvaFront />} side="linear-gradient(180deg, #00C4CC, #7D2AE8)" top="#2A1F5A" sweep={tween(ff, f0 + 10, f0 + 44)} />
        </Node3D>
      </Stage3D>
    );
  };
  const moving = f < f0 + 14 || f > HITS.end;
  return (
    <>
      <AbsoluteFill style={{ opacity: tween(f, f0 - 6, f0 + 6) }}>
        <KineticText
          text="CANVA"
          size={330}
          gradient="linear-gradient(90deg, #00C4CC, #7D2AE8)"
          style={{ transform: `translate(-50%,-50%) translate(-330px, ${-200 + t * 7}px) rotate(-90deg)` }}
        />
        <KineticText text="PRO" size={330} color="transparent" stroke="4px #ffffff" style={{ transform: `translate(-50%,-50%) translate(350px, ${300 - t * 7}px) rotate(90deg)` }} />
      </AbsoluteFill>
      <AbsoluteFill>{moving ? <MotionTrail frame={f} render={render} samples={4} spacing={0.9} strength={0.6} /> : render(f)}</AbsoluteFill>
    </>
  );
};

// Prices as displayed on digitalsub.org (client screenshot). Canva Pro's price
// was not in the screenshots, so no chip is shown for it.
const PRICES: [number, number, string, string][] = [
  [HITS.netflix, HITS.prime, "19 000 MGA", "/ mois"],
  [HITS.prime, HITS.chatgpt, "15 000 MGA", "/ mois"],
  [HITS.chatgpt, HITS.spotify, "12 000 MGA", "/ semaine"],
  [HITS.spotify, HITS.canva, "10 000 MGA", "/ mois"],
];

const PriceChip: React.FC<{ f: number }> = ({ f }) => (
  <>
    {PRICES.map(([a, b, price, per]) => {
      const p = tween(f, a + 4, a + 18, [0, 1], E.out) * (1 - tween(f, b - 8, b, [0, 1], E.in));
      if (p <= 0) return null;
      return (
        <div key={price} style={{ position: "absolute", left: 0, right: 0, top: 1690, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "18px 36px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)", color: "#fff", fontFamily: FONT.ui }}>
            <span style={{ fontSize: 30, opacity: 0.7, fontWeight: 500 }}>à partir de</span>
            <span style={{ fontFamily: FONT.heading, fontSize: 46, fontWeight: 700 }}>{price}</span>
            <span style={{ fontSize: 30, opacity: 0.7, fontWeight: 500 }}>{per}</span>
          </div>
        </div>
      );
    })}
  </>
);

export const S03Products: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const enter = tween(f, B(10.6), B(11) + 10, [0, 1], E.inOut);
  const lights: [number, string][] = [
    [HITS.netflix, PRODUCT_LIGHT.netflix],
    [HITS.prime, PRODUCT_LIGHT.prime],
    [HITS.chatgpt, C.cyan],
    [HITS.spotify, PRODUCT_LIGHT.spotify],
    [HITS.canva, PRODUCT_LIGHT.canva],
  ];
  const beatPulse = keys(f % (B(13) - B(11)), [0, 4, 40], [1, 0.9, 0.55], E.out);
  return (
    <BeatTransition t={{ type: "diagonal", progress: enter }}>
      <BackgroundEnvironment top="#0A1E44" bottom={C.nightDeep} grid gridShiftX={-f * 0.8} gridOpacity={0.1} vignette={0.6} />
      {lights.map(([s, color], i) => {
        const e = i < lights.length - 1 ? lights[i + 1][0] : B(22);
        const w = keys(f, [s - 10, s + 4, e - 6, e + 8], [0, 1, 1, 0]);
        return w > 0 ? (
          <AbsoluteFill key={i} style={{ background: `radial-gradient(70% 45% at 50% 52%, ${color} 0%, transparent 70%)`, opacity: w * 0.38 * beatPulse }} />
        ) : null;
      })}
      <Netflix f={f} />
      <Prime f={f} />
      <ChatGPT f={f} />
      <Spotify f={f} />
      <Canva f={f} />
      <PriceChip f={f} />
    </BeatTransition>
  );
};
