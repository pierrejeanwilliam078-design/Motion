import React from 'react';
import {Img, staticFile} from 'remotion';
import {HAND} from '../fonts';
import {tw} from '../lib/anim';

/**
 * Cadre Polaroid. La photo est affichée sans déformation (object-fit: cover
 * dans un cadre au ratio d'origine) et « se développe » à l'arrivée :
 * surexposée et désaturée, puis couleurs normales.
 */
export const Polaroid: React.FC<{
  src: string;
  ratio: number;
  width: number;
  caption?: string;
  develop?: number; // 0 → 1
  tape?: boolean;
  tapeAngle?: number;
}> = ({src, ratio, width, caption, develop = 1, tape = true, tapeAngle = -4}) => {
  const pad = width * 0.045;
  const imgW = width - pad * 2;
  const imgH = imgW / ratio;
  const bottom = caption ? width * 0.17 : pad * 2.6;
  return (
    <div
      style={{
        position: 'relative',
        width,
        padding: pad,
        paddingBottom: bottom,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F2EA 100%)',
        borderRadius: 6,
        boxShadow: '0 30px 60px rgba(0,0,0,0.38), 0 6px 14px rgba(0,0,0,0.22)',
      }}
    >
      <div style={{width: imgW, height: imgH, overflow: 'hidden', background: '#222', position: 'relative'}}>
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `brightness(${1 + (1 - develop) * 1.4}) saturate(${0.25 + develop * 0.85}) contrast(${0.8 + develop * 0.25})`,
          }}
        />
        {/* reflet glacé du papier photo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 35%)',
          }}
        />
      </div>
      {caption ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: bottom * 0.12,
            height: bottom * 0.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: HAND,
            fontWeight: 700,
            fontSize: width * 0.085,
            color: '#2B2B3A',
            opacity: tw(develop, 0.4, 1, 0, 1),
          }}
        >
          {caption}
        </div>
      ) : null}
      {tape ? (
        <div
          style={{
            position: 'absolute',
            top: -width * 0.035,
            left: '50%',
            width: width * 0.32,
            height: width * 0.075,
            transform: `translateX(-50%) rotate(${tapeAngle}deg)`,
            background: 'rgba(255,240,200,0.72)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        />
      ) : null}
    </div>
  );
};
