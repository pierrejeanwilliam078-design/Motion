import React from 'react';
import { COLORS } from '../theme';

const fill: React.CSSProperties = { position: 'absolute', inset: 0 };

/** Fond clair à gradients subtils, avec halos qui dérivent lentement et grille de points pour la profondeur. */
export function Backdrop({ t, variant = 'intro' }: { t: number; variant?: 'intro' | 'tools' }) {
  const blobs =
    variant === 'intro'
      ? [
          { x: 160, y: 380, r: 820, c: 'rgba(0, 217, 245, 0.30)', ph: 0 },
          { x: 960, y: 760, r: 900, c: 'rgba(107, 28, 240, 0.22)', ph: 2 },
          { x: 420, y: 1640, r: 980, c: 'rgba(31, 91, 255, 0.20)', ph: 4 },
        ]
      : [
          { x: 980, y: 260, r: 860, c: 'rgba(0, 217, 245, 0.22)', ph: 1 },
          { x: 80, y: 1100, r: 900, c: 'rgba(107, 28, 240, 0.14)', ph: 3 },
          { x: 900, y: 1780, r: 860, c: 'rgba(31, 91, 255, 0.18)', ph: 5 },
        ];
  return (
    <div style={{ ...fill, background: `linear-gradient(180deg, #FAFBFF 0%, ${COLORS.paper} 55%, ${COLORS.paperDeep} 100%)`, overflow: 'hidden' }}>
      {blobs.map((b, i) => {
        const x = b.x + Math.sin(t * 0.35 + b.ph) * 70;
        const y = b.y + Math.cos(t * 0.28 + b.ph) * 60;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - b.r / 2,
              top: y - b.r / 2,
              width: b.r,
              height: b.r,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${b.c} 0%, transparent 68%)`,
            }}
          />
        );
      })}
      <div
        style={{
          ...fill,
          backgroundImage: 'radial-gradient(rgba(10, 15, 44, 0.11) 1.7px, transparent 2px)',
          backgroundSize: '46px 46px',
          backgroundPosition: `${(t * 4) % 46}px ${(t * 7) % 46}px`,
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, #000 0%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, #000 0%, transparent 100%)',
          opacity: 0.55,
        }}
      />
    </div>
  );
}
