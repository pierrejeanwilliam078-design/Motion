import React from "react";
import { Img, staticFile } from "remotion";
import { C, FONT } from "../lib/theme";
import { CartIcon, EyeIcon, GridIcon, SlidersIcon } from "./Icons";

/** Generic smartphone (no brand): body, bezel, island, screen glare. */
export const PhoneMockup: React.FC<{
  width?: number;
  children: React.ReactNode;
  glare?: number; // 0..1 position of the screen reflection
}> = ({ width = 600, children, glare = 0.3 }) => {
  const height = width * 2.07;
  const r = width * 0.16;
  const bezel = width * 0.028;
  return (
    <div style={{ position: "relative", width, height, transformStyle: "preserve-3d" }}>
      {/* body thickness */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: r,
            background: i === 5 ? "#1a1f2b" : "#2b3140",
            transform: `translateZ(${-(i + 1) * 3}px)`,
            boxShadow: i === 5 ? "0 60px 120px rgba(7,21,47,0.45), 0 20px 40px rgba(7,21,47,0.25)" : undefined,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          background: "linear-gradient(145deg, #3a4254 0%, #10141d 45%, #2a3142 100%)",
          padding: bezel,
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: r - bezel, overflow: "hidden", background: C.paper }}>
          {children}
          {/* dynamic island */}
          <div style={{ position: "absolute", top: width * 0.03, left: "50%", width: width * 0.3, height: width * 0.07, marginLeft: -width * 0.15, borderRadius: 999, background: "#05070b" }} />
          {/* glass reflection */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(115deg, transparent ${glare * 100 - 25}%, rgba(255,255,255,0.22) ${glare * 100}%, transparent ${glare * 100 + 18}%)`,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Data shown on digitalsub.org's catalogue (screenshot provided by the client).
export const CATALOG = [
  { img: "products/netflix.png", cat: "STREAMING & VOD", name: "Netflix Premium 4K", desc: "Profitez de vos films et séries préférés avec la meilleure qualité…", price: "19 000 MGA", per: "/ mois" },
  { img: "products/prime-video.png", cat: "STREAMING & VOD", name: "Prime Video", desc: "Films, séries et Originals Amazon Prime Video en HD/4K…", price: "15 000 MGA", per: "/ mois" },
  { img: "products/chatgpt.png", cat: "INTELLIGENCE ARTIFICIELLE", name: "Abonnement ChatGPT", desc: "Assistant IA d'OpenAI : rédaction, code, traduction…", price: "12 000 MGA", per: "/ semaine" },
  { img: "products/spotify.png", cat: "MUSIQUE", name: "Spotify Premium", desc: "Musique en streaming sans pub, écoute hors-ligne…", price: "10 000 MGA", per: "/ mois" },
];

const PILLS = [
  { t: "Tous les services", n: 27, active: true },
  { t: "Streaming & VOD", n: 5 },
  { t: "Intelligence Artificielle", n: 6 },
  { t: "Musique", n: 3 },
];

/**
 * Faithful mobile rendition of the digitalsub.org catalogue (layout and
 * content from the client's screenshots). Rendered at 390 px and scaled.
 */
export const CatalogScreen: React.FC<{
  screenWidth: number;
  scroll: number; // px (390-space)
  selected: number; // 0..1 highlight of card 0
  press: number; // 0..1 "Choisir" pressed state
  tap: number; // 0..1 ripple progress (0 = none)
}> = ({ screenWidth, scroll, selected, press, tap }) => {
  const k = screenWidth / 390;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 390, transform: `scale(${k})`, transformOrigin: "0 0", fontFamily: FONT.ui, color: C.ink }}>
      {/* status + header */}
      <div style={{ height: 54 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 12px", background: "rgba(245,247,251,0.95)" }}>
        <Img src={staticFile("brand/logo.png")} style={{ height: 30 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
            <CartIcon size={18} color={C.ink} />
          </div>
          <div style={{ height: 36, padding: "0 14px", borderRadius: 18, background: C.whatsapp, color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center" }}>WhatsApp</div>
        </div>
      </div>
      <div style={{ transform: `translateY(${-scroll}px)` }}>
        <div style={{ display: "flex", gap: 8, padding: "10px 18px 16px", whiteSpace: "nowrap" }}>
          {PILLS.map((p) => (
            <div
              key={p.t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                background: p.active ? "#13234A" : "#fff",
                color: p.active ? "#fff" : "#374151",
                border: p.active ? "none" : `1px solid ${C.border}`,
              }}
            >
              {p.active ? <GridIcon size={14} color="#fff" /> : null}
              {p.t}
              <span style={{ opacity: 0.6, fontWeight: 500 }}>{p.n}</span>
            </div>
          ))}
        </div>
        {CATALOG.map((c, i) => {
          const sel = i === 0 ? selected : 0;
          return (
            <div
              key={c.name}
              style={{
                margin: "0 18px 18px",
                borderRadius: 22,
                background: "#fff",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                boxShadow: `0 ${6 + sel * 18}px ${18 + sel * 30}px rgba(14,27,61,${0.06 + sel * 0.14}), 0 0 0 ${sel * 3}px rgba(0,229,242,${sel})`,
                transform: `translateY(${-sel * 6}px) scale(${1 + sel * 0.015})`,
              }}
            >
              <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                <Img src={staticFile(c.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.95)", borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "#22c55e" }} />
                  EN STOCK
                </div>
              </div>
              <div style={{ padding: "14px 18px 18px" }}>
                <div style={{ fontSize: 10.5, letterSpacing: "0.12em", color: "#6b7280", fontWeight: 600 }}>{c.cat}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, fontFamily: FONT.heading }}>{c.name}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.45 }}>{c.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 14 }}>
                  <div style={{ fontSize: 23, fontWeight: 700, fontFamily: FONT.heading }}>{c.price}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{c.per}</div>
                </div>
                <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 2 }}>à partir de</div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <div style={{ width: 48, height: 46, borderRadius: 12, background: "#F1F3F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <EyeIcon size={18} color={C.ink} />
                  </div>
                  <div
                    style={{
                      position: "relative",
                      flex: 1,
                      height: 46,
                      borderRadius: 12,
                      background: i === 0 && press > 0 ? `color-mix(in srgb, ${C.navyButton} ${100 - press * 100}%, ${C.electric})` : C.navyButton,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      overflow: "hidden",
                      transform: `scale(${i === 0 ? 1 - press * 0.05 : 1})`,
                    }}
                  >
                    <SlidersIcon size={16} color="#fff" />
                    Choisir
                    {i === 0 && tap > 0 && tap < 1 ? (
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          width: 320 * tap,
                          height: 320 * tap,
                          marginLeft: -160 * tap,
                          marginTop: -160 * tap,
                          borderRadius: "50%",
                          background: `rgba(0,229,242,${0.45 * (1 - tap)})`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Y position (390-space, before scroll) of the first card's Choisir button center. */
export const CHOISIR_Y = 54 + 54 + 58 + 200 + 14 + 16 + 26 + 50 + 37 + 14 + 14 + 23;
