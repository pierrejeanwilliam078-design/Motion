import React, { useId } from 'react';
import { CANVA_PATH, CLAUDE_PATH, GEMINI_PATH, OPENAI_PATH, WHATSAPP_PATH } from '../brand-paths';
import { COLORS } from '../theme';

type MarkProps = { size: number; style?: React.CSSProperties };

/** Tuile d'application blanche contenant le logo ChatGPT (OpenAI). */
export function ChatGPTMark({ size, style, spin = 0 }: MarkProps & { spin?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: '#FFFFFF',
        boxShadow: '0 24px 60px rgba(10, 15, 44, 0.16), inset 0 0 0 1.5px rgba(10, 15, 44, 0.06)',
        display: 'grid',
        placeItems: 'center',
        ...style,
      }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} style={{ transform: `rotate(${spin}deg)` }}>
        <path d={OPENAI_PATH} fill="#0D0D0D" />
      </svg>
    </div>
  );
}

export function GeminiMark({ size, style }: MarkProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <defs>
        <linearGradient id={`gm${id}`} x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="0.5" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#E0739A" />
        </linearGradient>
      </defs>
      <path d={GEMINI_PATH} fill={`url(#gm${id})`} />
    </svg>
  );
}

export function ClaudeMark({ size, style }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <path d={CLAUDE_PATH} fill={COLORS.claude} />
    </svg>
  );
}

export function CanvaMark({ size, style }: MarkProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <defs>
        <linearGradient id={`cv${id}`} x1="0" y1="2" x2="24" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00C4CC" />
          <stop offset="0.55" stopColor="#3B5BFF" />
          <stop offset="1" stopColor="#7D2AE8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11.6" fill="#FFFFFF" />
      <path d={CANVA_PATH} fill={`url(#cv${id})`} />
    </svg>
  );
}

export function WhatsAppMark({ size, style }: MarkProps) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: COLORS.whatsapp, display: 'grid', placeItems: 'center', ...style }}>
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58}>
        <path d={WHATSAPP_PATH} fill="#FFFFFF" />
      </svg>
    </div>
  );
}
