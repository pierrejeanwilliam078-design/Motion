import React from 'react';
import { VIDEO } from '../timeline';
import { ease, interp, progress } from '../lib/motion';
import { FONT } from '../theme';
import { Backdrop } from '../components/Backdrop';
import type { SceneProps } from '../scenes/types';
import { Camera, Flash, Glitch, MotionBlurDefs, TriWipe, beatPunch } from './fx';
import { Intro2 } from './Intro2';
import { ChatGPT2, Gemini2, Header2, ToolProgress2 } from './Tools2';
import { ClaudeCanva2 } from './ClaudeCanva2';
import { Tip2 } from './Tip2';
import { Brand2 } from './Brand2';
import { CUES2 } from './timeline2';

const C = CUES2.chatgpt;
const G = CUES2.gemini;
const V = CUES2.canva;

/** Grille de points qui s'illumine sur les temps forts. */
function BeatGrid({ t }: { t: number }) {
  const o = Math.min(1, beatPunch(t) / 0.02);
  if (o < 0.02) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(31, 91, 255, 0.5) 2px, transparent 2.4px)',
        backgroundSize: '46px 46px',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 45% at 50% 50%, #000 0%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 60% 45% at 50% 50%, #000 0%, transparent 100%)',
        opacity: o * 0.5,
      }}
    />
  );
}

/**
 * VERSION 2 — composition complète, fonction pure du temps `t`.
 * Mêmes textes et mêmes logos que la V1 ; rythme, transitions et sound design plus énergiques.
 */
export function Ad2(props: SceneProps) {
  const { t } = props;
  const whipOut = ease.in(progress(t, C.whipStart, C.whipMid));
  const whipIn = 1 - ease.out(progress(t, C.whipMid, C.whipMid + 0.38));
  const blur = t < C.whipMid ? whipOut * 70 : t < C.whipMid + 0.38 ? whipIn * 70 : 0;
  const streak = interp(t, [C.whipMid - 0.12, C.whipMid, C.whipMid + 0.2], [0, 1, 0]);
  const toolsVisible = t >= CUES2.intro.zoomEnd - 0.05 && t < CUES2.brand.logoIn + 0.05;
  return (
    <div style={{ position: 'relative', width: VIDEO.width, height: VIDEO.height, overflow: 'hidden', fontFamily: FONT, background: '#F5F7FF', WebkitFontSmoothing: 'antialiased' }}>
      <MotionBlurDefs amount={blur} />
      <Camera t={t}>
        <Intro2 {...props} />
        {toolsVisible && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Backdrop t={t} variant="tools" />
            <BeatGrid t={t} />
            <Header2 {...props} />
            <ToolProgress2 t={t} />
            {t < C.whipMid + 0.02 && (
              <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-whipOut * 1300}px)`, filter: blur > 0.5 ? 'url(#v2-mblur)' : undefined }}>
                <ChatGPT2 {...props} />
              </div>
            )}
            {t >= G.logoIn - 0.02 && t < G.wipeSwitch + 0.02 && (
              <div style={{ position: 'absolute', inset: 0, transform: `translateX(${whipIn * 1300}px)`, filter: blur > 0.5 ? 'url(#v2-mblur)' : undefined }}>
                <Gemini2 {...props} />
              </div>
            )}
            <Glitch t={t} start={V.glitchStart} end={V.cut}>
              <ClaudeCanva2 {...props} />
            </Glitch>
            <Tip2 {...props} />
          </div>
        )}
        <Brand2 {...props} />
      </Camera>
      {streak > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 560,
            height: 420,
            background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)',
            opacity: streak,
            transform: `scaleY(${0.3 + streak * 0.7})`,
          }}
        />
      )}
      <TriWipe t={t} start={G.wipeStart} switchAt={G.wipeSwitch} />
      <Flash t={t} at={CUES2.intro.zoomEnd} before={0.08} after={0.32} />
      <Flash t={t} at={CUES2.intro.morphEnd} before={0.02} after={0.18} color="rgba(255,255,255,0.7)" />
    </div>
  );
}
