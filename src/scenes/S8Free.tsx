import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Burst } from "../components/brand";
import { useLayout } from "../components/core";
import { AndroidIcon, CardIcon, MegaphoneIcon, UserIcon, WindowsIcon } from "../components/icons";
import { SceneShell } from "../components/SceneShell";
import { C, EASE, FONT, hash, keys, sceneFrames, tween, vo } from "../theme";

const S = sceneFrames("s8-gratuit");
const at = (t: number) => vo(t) - S.from;

const Platform: React.FC<{ at: number; icon: React.ReactNode; label: string; size: number }> = ({ at: a, icon, label, size }) => {
  const frame = useCurrentFrame();
  const p = tween(frame, a, a + 12, [0, 1], EASE.out);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.32,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`,
        filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
      }}
    >
      <div
        style={{
          width: size * 1.25,
          height: size * 1.25,
          borderRadius: size * 0.3,
          background: C.bg2,
          border: "1.5px solid rgba(45,198,190,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 40px rgba(45,198,190,0.25)",
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: size, letterSpacing: "-0.03em", color: C.white }}>{label}</div>
    </div>
  );
};

const NoRow: React.FC<{ at: number; icon: React.ReactNode; label: string; size: number }> = ({ at: a, icon, label, size }) => {
  const frame = useCurrentFrame();
  const p = tween(frame, a, a + 12, [0, 1], EASE.out);
  const strike = tween(frame, a + 6, a + 16, [0, 1], EASE.out);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.45,
        opacity: p,
        transform: `translateX(${(1 - p) * -60}px)`,
      }}
    >
      <div style={{ position: "relative", width: size * 1.2, height: size * 1.2 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 99,
            border: `2px solid ${C.teal}`,
            background: "rgba(45,198,190,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div
          style={{
            position: "absolute",
            left: size * 0.12,
            top: size * 0.58,
            width: size * 0.96 * strike,
            height: 4,
            borderRadius: 4,
            background: C.teal,
            transform: "rotate(-40deg)",
            transformOrigin: `${size * 0.48}px 2px`,
            boxShadow: "0 0 10px rgba(45,198,190,0.9)",
          }}
        />
      </div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: size, letterSpacing: "-0.03em", color: C.white }}>
        <span style={{ color: C.teal }}>SANS</span> {label}
      </div>
    </div>
  );
};

export const S8Free: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();

  const winAt = at(35.14);
  const andAt = at(35.86);
  const noAt = [at(36.68), at(37.56), at(38.64)];
  const slowAt = at(39.6);
  const freeAt = at(41.94);

  // Phase 1 → 2 : la ligne des plateformes remonte quand les « SANS » arrivent.
  const up = tween(frame, noAt[0] - 10, noAt[0] + 6, [0, 1], EASE.inOut);
  // Phase 3 : ralenti, tout s'assombrit avant le mot-clé.
  const slow = tween(frame, slowAt, freeAt - 2, [0, 1], EASE.inOut);
  const hit = frame >= freeAt;
  const k = tween(frame, freeAt, freeAt + 7, [0, 1], EASE.out);
  const shake = hit ? Math.max(0, 1 - (frame - freeAt) / 12) : 0;
  const sx = shake * 18 * (hash(frame) - 0.5);
  const sy = shake * 18 * (hash(frame + 31) - 0.5);
  const flash = keys(frame, [freeAt - 1, freeAt + 1, freeAt + 10], [0, 0.7, 0]);

  const pSize = v ? 92 : 84;
  const nSize = v ? 70 : 66;
  const platY = keys(up, [0, 1], [H * 0.5, v ? H * 0.2 : H * 0.17]);
  const platScale = keys(up, [0, 1], [1, v ? 0.72 : 0.62]);
  const dim = 1 - 0.75 * slow;
  const drift = 1 - 0.04 * slow;

  const freeSize = v ? 175 : 300;
  const pulse = hit ? 0.5 + 0.5 * Math.sin((frame - freeAt) / 5) : 0;

  return (
    <SceneShell duration={S.duration}>
      <AbsoluteFill style={{ background: `rgba(5,10,14,${0.55 * slow * (hit ? 0.4 : 1)})` }} />
      {!hit && (
        <AbsoluteFill style={{ opacity: dim, transform: `scale(${drift})` }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: platY,
              display: "flex",
              flexDirection: v ? "column" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: v ? 30 : 60,
              transform: `translateY(-50%) scale(${platScale})`,
            }}
          >
            <Platform at={winAt} size={pSize} label="WINDOWS" icon={<WindowsIcon size={pSize * 0.62} color={C.teal} />} />
            <div
              style={{
                fontFamily: FONT.sans,
                fontWeight: 300,
                fontSize: pSize * 1.1,
                color: C.teal,
                opacity: tween(frame, winAt + 8, winAt + 16),
                lineHeight: 1,
              }}
            >
              +
            </div>
            <Platform at={andAt} size={pSize} label="ANDROID" icon={<AndroidIcon size={pSize * 0.66} color={C.teal} />} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: v ? H * 0.42 : H * 0.36,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: v ? 44 : 34,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: v ? 44 : 34 }}>
              <NoRow at={noAt[0]} size={nSize} label="COMPTE" icon={<UserIcon size={nSize * 0.6} color={C.white} />} />
              <NoRow at={noAt[1]} size={nSize} label="PUBLICITÉ" icon={<MegaphoneIcon size={nSize * 0.6} color={C.white} />} />
              <NoRow at={noAt[2]} size={nSize} label="ABONNEMENT" icon={<CardIcon size={nSize * 0.6} color={C.white} />} />
            </div>
          </div>
        </AbsoluteFill>
      )}
      {/* Montée d'énergie avant le mot-clé */}
      {!hit && slow > 0 && (
        <div
          style={{
            position: "absolute",
            left: W / 2 - 300,
            top: H / 2 - 300,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,198,190,0.45), transparent 65%)",
            transform: `scale(${0.2 + 0.9 * slow ** 2})`,
            opacity: slow,
          }}
        />
      )}
      {hit && (
        <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(45,198,190,${0.35 + 0.15 * pulse}), rgba(14,23,31,0) 60%)`,
            }}
          />
          {[0, 1, 2].map((i) => {
            const d = (frame - freeAt - i * 6) / 30;
            if (d < 0 || d > 1) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: W / 2,
                  top: H / 2,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: `${3 * (1 - d) + 1}px solid ${C.teal}`,
                  transform: `translate(-50%, -50%) scale(${20 + d * 160})`,
                  opacity: (1 - d) * 0.7,
                }}
              />
            );
          })}
          <Burst at={freeAt} x={W / 2} y={H / 2} count={40} spread={v ? 560 : 820} />
          <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                fontFamily: FONT.sans,
                fontWeight: 900,
                fontSize: freeSize,
                letterSpacing: "-0.05em",
                color: C.white,
                transform: `scale(${keys(k, [0, 0.7, 1], [2.4, 0.94, 1], (t) => t)})`,
                opacity: k,
                textShadow: `0 0 ${60 + 40 * pulse}px rgba(45,198,190,0.85), 0 0 140px rgba(45,198,190,0.5)`,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              GRATUIT<span style={{ color: C.teal }}> !</span>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: C.white, opacity: flash, mixBlendMode: "screen" }} />
    </SceneShell>
  );
};
