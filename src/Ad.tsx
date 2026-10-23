import React from 'react';
import { CUES, VIDEO } from './timeline';
import { interp, ease } from './lib/motion';
import { FONT } from './theme';
import { Backdrop } from './components/Backdrop';
import { Intro } from './scenes/Intro';
import { ChatGPTScene, GeminiScene, ToolHeader } from './scenes/Tools';
import { ClaudeCanvaScene } from './scenes/ClaudeCanva';
import { TipScene } from './scenes/Tip';
import { BrandScene } from './scenes/Brand';
import type { SceneProps } from './scenes/types';

const I = CUES.intro;

/** Transition lumineuse ChatGPT → Gemini. */
function Flash({ t }: { t: number }) {
  const peak = CUES.chatgpt.flashPeak;
  const o = interp(t, [peak - 0.55, peak - 0.08, peak + 0.08, peak + 0.6], [0, 1, 1, 0]);
  if (o <= 0) return null;
  const s = interp(t, [peak - 0.55, peak + 0.6], [0.3, 2.4], ease.out);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 540 - 900,
          top: 700 - 900,
          width: 1800,
          height: 1800,
          borderRadius: '50%',
          transform: `scale(${s})`,
          background:
            'radial-gradient(circle, #FFFFFF 0%, #FFFFFF 28%, rgba(214, 228, 255, 0.95) 42%, rgba(160, 140, 255, 0.35) 56%, rgba(0, 217, 245, 0) 70%)',
        }}
      />
    </div>
  );
}

/**
 * Composition complète : une fonction pure du temps `t` (secondes).
 * Rendue telle quelle par l'aperçu (horloge temps réel) et par Remotion (t = frame / fps).
 */
export function Ad(props: SceneProps) {
  const { t } = props;
  // Masque « pilule → plein écran » qui révèle les scènes outils
  const insetY = interp(t, [I.maskStart, I.maskStart + 0.22, I.maskEnd], [50, 45.5, 0], ease.inOut);
  const insetX = interp(t, [I.maskStart, I.maskStart + 0.22, I.maskEnd], [50, 30, 0], ease.inOut);
  const radius = interp(t, [I.maskStart + 0.22, I.maskEnd], [120, 0], ease.inOut);
  const toolsVisible = t >= I.maskStart && t < CUES.brand.logoIn + 0.3;
  return (
    <div style={{ position: 'relative', width: VIDEO.width, height: VIDEO.height, overflow: 'hidden', fontFamily: FONT, background: '#F5F7FF', WebkitFontSmoothing: 'antialiased' }}>
      <Backdrop t={t} variant="intro" />
      <Intro {...props} />
      {toolsVisible && (
        <div style={{ position: 'absolute', inset: 0, clipPath: t < I.maskEnd ? `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${radius}px)` : undefined }}>
          <Backdrop t={t} variant="tools" />
          <ToolHeader {...props} />
          <ChatGPTScene {...props} />
          <GeminiScene {...props} />
          <ClaudeCanvaScene {...props} />
          <TipScene {...props} />
        </div>
      )}
      <Flash t={t} />
      <BrandScene {...props} />
    </div>
  );
}
