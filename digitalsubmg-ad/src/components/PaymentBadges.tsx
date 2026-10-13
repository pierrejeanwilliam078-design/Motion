import React from "react";
import { C, FONT } from "../lib/theme";
import { E, springAt, tween } from "../lib/anim";
import { B } from "../lib/timing";

// Text capsules, exactly like the payment chips on digitalsub.org's hero
// (no operator logos are redrawn). Accent dots use each operator's colour.
export const PAYMENTS = [
  { label: "MVola", dot: "#FFCC00", beat: 35, from: { x: -900, y: -60, rz: -28, ry: 0 } },
  { label: "Orange Money", dot: "#FF7900", beat: 36.5, from: { x: 900, y: 40, rz: 24, ry: 0 } },
  { label: "Airtel Money", dot: "#E40000", beat: 38.5, from: { x: 0, y: 700, rz: 0, ry: 70 } },
] as const;

export const SLOT_Y = [-170, 0, 170];

export const Capsule: React.FC<{ label: string; dot: string; dark: boolean; glow?: number }> = ({ label, dot, dark, glow = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 26,
      padding: "0 56px",
      height: 132,
      borderRadius: 999,
      fontFamily: FONT.heading,
      fontWeight: 700,
      fontSize: 62,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      color: dark ? "#fff" : C.ink,
      background: dark ? "rgba(13,30,66,0.78)" : "rgba(255,255,255,0.92)",
      border: dark ? "2px solid rgba(255,255,255,0.18)" : `2px solid ${C.border}`,
      boxShadow: dark
        ? `0 30px 70px rgba(0,0,0,0.45), 0 0 ${60 * glow}px rgba(0,229,242,${0.6 * glow})`
        : `0 30px 70px rgba(14,27,61,0.16), 0 0 ${60 * glow}px rgba(0,229,242,${0.5 * glow})`,
      backdropFilter: "blur(10px)",
    }}
  >
    <span style={{ width: 30, height: 30, borderRadius: 15, background: dot, boxShadow: `0 0 0 8px ${dot}33` }} />
    {label}
  </div>
);

/** The three capsules slide in, spin and lock into a perfect column. */
export const PaymentBadges: React.FC<{ frame: number; dark: boolean; alignBeat?: number }> = ({ frame, dark, alignBeat = 39 }) => {
  const align = tween(frame, B(alignBeat) - 18, B(alignBeat), [0, 1], E.inOut);
  return (
    <>
      {PAYMENTS.map((p, i) => {
        const s = springAt(frame, B(p.beat) - 10, { damping: 15, stiffness: 120 });
        const x = p.from.x * (1 - s);
        // before alignment, capsules sit slightly staggered; then snap into the column
        const stagger = [-40, 50, -20][i] * (1 - align);
        const y = SLOT_Y[i] + p.from.y * (1 - s);
        const rz = p.from.rz * (1 - s) + [-4, 3, -2][i] * (1 - align);
        const ry = p.from.ry * (1 - s);
        return (
          <div
            key={p.label}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate3d(${x + stagger}px, ${y}px, ${60 * (1 - s)}px) rotateY(${ry}deg) rotateZ(${rz}deg)`,
              opacity: s > 0.01 ? 1 : 0,
            }}
          >
            <Capsule label={p.label} dot={p.dot} dark={dark} glow={tween(frame, B(alignBeat), B(alignBeat) + 20, [1, 0]) * align} />
          </div>
        );
      })}
    </>
  );
};
