import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BackgroundEnvironment } from "../components/BackgroundEnvironment";
import { ChatIcon, LightningIcon, ShieldCheckIcon, UsersIcon } from "../components/Icons";
import { KineticText, MotionTrail } from "../components/KineticText";
import { E, float, springAt, tween } from "../lib/anim";
import { C, FONT } from "../lib/theme";
import { B } from "../lib/timing";

// Card styled after the "Pourquoi DigitalSubMG ?" section of digitalsub.org
export const SiteCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  text: string;
  width?: number;
  style?: React.CSSProperties;
  big?: boolean;
}> = ({ icon, title, text, width = 860, style, big }) => (
  <div
    style={{
      width,
      padding: big ? "40px 44px" : "34px 40px",
      borderRadius: 34,
      background: "#fff",
      border: `2px solid ${C.border}`,
      boxShadow: "0 30px 70px rgba(14,27,61,0.12)",
      display: "flex",
      alignItems: "center",
      gap: 32,
      fontFamily: FONT.ui,
      ...style,
    }}
  >
    <div style={{ width: 104, height: 104, flex: "0 0 104px", borderRadius: 26, background: "#EEF1F5", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
    <div>
      <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: big ? 56 : 50, color: C.ink, lineHeight: 1.05 }}>{title}</div>
      <div style={{ fontSize: 33, color: "#5B6478", marginTop: 8, lineHeight: 1.3 }}>{text}</div>
    </div>
  </div>
);

export const PROOF_CARD = { x: 110, y: 1330, w: 860, h: 260, r: 34 };

// SCENE 06 — SPEED & TRUST (b41–b49)
export const S06Trust: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const whip = tween(f, B(40.6), B(41.2), [1, 0], E.in);
  const settle = tween(f, B(41.2), B(41.8), [1, 0], E.out);

  // RAPIDE — crosses the screen horizontally
  const rapideEnd = B(44.6);
  const rapide = (ff: number) => {
    const inn = tween(ff, B(42.3), B(43), [1, 0], E.out);
    const out = tween(ff, rapideEnd - 8, rapideEnd + 6, [0, 1], E.in);
    const x = 1600 * inn - 1700 * out - (ff - B(43)) * 1.2;
    return <KineticText text="RAPIDE." size={215} color={C.ink} style={{ transform: `translate(-50%,-50%) translate(${x}px, -80px) skewX(${-14 * inn + 14 * out}deg) scaleY(1.7)` }} />;
  };
  const rapideCard = tween(f, B(42.6), B(43.4), [1, 0], E.out) * 900 - tween(f, rapideEnd - 6, rapideEnd + 8, [0, 1], E.in) * 1400;

  // SÉCURISÉ — vertical mask
  const secA = B(44.9);
  const secB = B(46.2);
  const secCard = springAt(f, secA + 4, { damping: 16 });

  // ASSISTANCE — behind a floating WhatsApp card
  const asA = B(46.4);
  const asIn = tween(f, asA - 4, asA + 12, [0, 1], E.out);
  const wa = springAt(f, asA + 2, { damping: 13, stiffness: 130 });
  const notif = springAt(f, B(47.5), { damping: 10, stiffness: 200 });
  const proof = springAt(f, B(47.6), { damping: 16 });
  const leave = tween(f, B(48.1), B(48.6), [0, 1], E.in);

  return (
    <AbsoluteFill style={{ transform: `translateX(${1080 * whip}px)`, filter: whip > 0.05 ? `blur(${whip * 14}px)` : undefined }}>
      <BackgroundEnvironment top="#F8FAFD" bottom="#EEF2F8" vignette={0.05} />
      {/* site heading */}
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", opacity: 1 - settle }}>
        <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 26, letterSpacing: "0.22em", color: "#5B6478" }}>NOS ENGAGEMENTS</div>
        <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 76, color: "#0B1020", marginTop: 14 }}>
          Pourquoi <span style={{ color: "#1E3A8A" }}>DigitalSubMG</span> ?
        </div>
      </div>

      {f < rapideEnd + 10 ? <MotionTrail frame={f} render={rapide} samples={5} spacing={0.8} strength={0.75} /> : null}
      {f > B(42.4) && f < rapideEnd + 10 ? (
        <div style={{ position: "absolute", left: 110 + rapideCard, top: 1240 }}>
          <SiteCard big icon={<LightningIcon size={60} color={C.ink} draw={tween(f, B(43), B(43.8))} />} title="Activation Instantanée" text="Recevez vos accès en quelques minutes après confirmation du paiement." />
        </div>
      ) : null}

      {f > secA - 6 && f < secB + 12 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 960 - 80 - 170, height: 340, overflow: "hidden" }}>
            <KineticText
              text="SÉCURISÉ."
              size={168}
              color={C.ink}
              style={{ transform: "translate(-50%,-50%) scaleY(1.7)" }}
              letterStyle={(i) => {
                const inn = tween(f, secA - 4 + i * 1.3, secA + 10 + i * 1.3, [1, 0], E.out);
                const out = tween(f, secB - 2 + i * 0.6, secB + 8 + i * 0.6, [0, 1], E.in);
                return { transform: `translateY(${inn * 330 + out * 330}px)` };
              }}
            />
          </div>
          <div style={{ position: "absolute", left: 110, top: 1240, transform: `translateY(${(1 - secCard) * 500}px)`, opacity: 1 - tween(f, secB, secB + 10) }}>
            <SiteCard big icon={<ShieldCheckIcon size={60} color="#15803D" draw={tween(f, secA + 4, secA + 30)} />} title="Paiement Sécurisé" text="Airtel Money & MVola" />
          </div>
        </>
      ) : null}

      {f > asA - 6 ? (
        <>
          <KineticText
            text="ASSISTANCE"
            size={168}
            color={C.ink}
            style={{ transform: `translate(-50%,-50%) translate(${60 - (f - asA) * 1.6}px, -80px) scale(${0.85 + 0.15 * asIn}, ${(0.85 + 0.15 * asIn) * 1.7})`, opacity: asIn * (1 - leave) }}
          />
          {/* floating WhatsApp card in front of the word */}
          <div
            style={{
              position: "absolute",
              left: 540 - 330,
              top: 960 - 80 - 130 + float(f, 10, 120),
              width: 660,
              perspective: 1200,
              opacity: 1 - leave,
            }}
          >
            <div
              style={{
                transform: `translateY(${(1 - wa) * 700}px) rotateX(${8 + (1 - wa) * 30}deg) rotateY(${-14 + float(f, 4, 160)}deg)`,
                borderRadius: 40,
                background: `linear-gradient(150deg, #34E27A 0%, ${C.whatsapp} 45%, #12A150 100%)`,
                padding: "40px 44px",
                display: "flex",
                alignItems: "center",
                gap: 30,
                boxShadow: "0 50px 100px rgba(18,161,80,0.38), inset 0 2px 0 rgba(255,255,255,0.4)",
                color: "#fff",
              }}
            >
              <div style={{ position: "relative" }}>
                <ChatIcon size={120} color="#fff" stroke={1.7} draw={tween(f, asA + 4, asA + 26)} />
                <div style={{ position: "absolute", right: -4, top: -4, width: 38, height: 38, borderRadius: 19, background: "#FF3B30", border: "4px solid #fff", transform: `scale(${notif})`, fontFamily: FONT.ui, fontWeight: 800, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>1</div>
              </div>
              <div>
                <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 64, lineHeight: 1 }}>WhatsApp</div>
                <div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 34, opacity: 0.92, marginTop: 10 }}>Support 24/7 · à l'écoute</div>
              </div>
            </div>
          </div>
          {/* the 500+ card that becomes the next scene */}
          <div style={{ position: "absolute", left: PROOF_CARD.x, top: PROOF_CARD.y, transform: `translateY(${(1 - proof) * 600}px)` }}>
            <SiteCard width={PROOF_CARD.w} style={{ height: PROOF_CARD.h, boxSizing: "border-box" }} icon={<UsersIcon size={56} color={C.ink} draw={tween(f, B(47.8), B(48.4))} />} title="500+" text="Clients satisfaits" />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
