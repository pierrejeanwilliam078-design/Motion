import React from "react";
import { useCurrentFrame } from "remotion";
import captions from "../data/captions.json";
import { C, FONT, tween, vo } from "../theme";
import { useLayout } from "./core";

type Line = (typeof captions.lines)[number];

/**
 * Sous-titres animés synchronisés mot à mot sur la voix off.
 * Les phrases marquées `onScreen` (déjà écrites en grand) sont masquées ici
 * pour éviter le doublon, mais restent dans le fichier SRT.
 */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, v } = useLayout();
  const lines = captions.lines as Line[];

  const idx = lines.findIndex((l, i) => {
    const next = lines[i + 1];
    const end = Math.min(vo(l.end) + 8, next ? vo(next.start) : Infinity);
    return frame >= vo(l.start) && frame < end;
  });
  if (idx < 0) return null;
  const line = lines[idx];
  if (line.onScreen) return null;

  const next = lines[idx + 1];
  const start = vo(line.start);
  const end = Math.min(vo(line.end) + 8, next ? vo(next.start) : Infinity);
  const o = Math.min(tween(frame, start - 1, start + 5), tween(frame, end - 5, end, [1, 0]));
  const y = (1 - tween(frame, start - 1, start + 7)) * 14;
  const size = v ? 46 : 38;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: v ? 150 : 64,
        display: "flex",
        justifyContent: "center",
        opacity: o,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          maxWidth: v ? W - 120 : Math.min(1500, W - 200),
          padding: v ? "16px 30px" : "12px 28px",
          borderRadius: 16,
          background: "rgba(10,18,25,0.78)",
          border: "1px solid rgba(148,169,184,0.16)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          fontFamily: FONT.sans,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          textAlign: "center",
          color: C.white,
          maxHeight: H,
        }}
      >
        {line.words.map((w, i) => {
          const ws = vo(w.s);
          const we = vo(w.e);
          const said = frame >= ws;
          const active = frame >= ws && frame <= we + 2;
          return (
            <span
              key={i}
              style={{
                color: active ? C.teal : said ? C.white : "rgba(148,169,184,0.75)",
                transition: "none",
                textShadow: active ? "0 0 18px rgba(45,198,190,0.45)" : undefined,
              }}
            >
              {w.w}
              {i < line.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};
