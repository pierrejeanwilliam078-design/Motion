import React from 'react';
import {FONTS} from '../../config/theme';
import {MADAGASCAR} from '../../data/madagascar';
import {EASE, clamp01, lerp, prog} from '../../lib/motion';
import {bezier} from '../../scenes/mapCamera';
import {Abs, BlindsWipe, CircleReveal, Marquee, P2, PinIcon, Slam, Sticker, StripeWipe, WIDE, fitSize, project} from '../kit';
import T from '../timeline.json';

const W = T.words;

/**
 * V2 · SCÈNE 02 — 6 → 12 s — Carte 3D inclinée en orbite (silhouette exacte, Natural Earth),
 * trajectoire Antananarivo → Toamasina, puis typographie en écho « NOUVELLES OPPORTUNITÉS ».
 */
const TANA = MADAGASCAR.cities.antananarivo;
const TOAM = MADAGASCAR.cities.toamasina;
const MID: [number, number] = [300, 470]; // centre du plan (unités carte) : île entière visible, trajet à droite du centre
const K = 0.95; // px de plan par unité carte
const ROUTE: [number, number][] = [TANA, [TANA[0] + 30, TANA[1] - 60], [TOAM[0] - 50, TOAM[1] - 42], TOAM];
const CENTER = {cx: 900, cy: 560};

const LabelCard: React.FC<{x: number; y: number; name: string; coords: string; dark?: boolean; p: number; align?: 'left' | 'right'}> = ({x, y, name, coords, dark, p, align = 'left'}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${align === 'left' ? '28px' : 'calc(-100% - 28px)'}, -50%) scale(${lerp(0.4, 1, p)})`,
      transformOrigin: align === 'left' ? '0% 50%' : '100% 50%',
      opacity: clamp01(p * 2),
      background: dark ? P2.ink : P2.white,
      color: dark ? P2.white : P2.ink,
      borderRadius: 18,
      padding: '14px 22px',
      boxShadow: '0 10px 0 rgba(3,16,41,0.18)',
    }}
  >
    <div style={{fontFamily: FONTS.wide, fontWeight: 900, fontSize: 30, lineHeight: 1}}>{name}</div>
    <div style={{fontFamily: FONTS.body, fontWeight: 600, fontSize: 18, letterSpacing: '0.12em', marginTop: 8, opacity: 0.7}}>{coords}</div>
  </div>
);

export const V2_Scene02_Route: React.FC<{f: number}> = ({f}) => {
  const zoomIn = prog(f, 146, 172, EASE.out);
  const cam = {d: 1700, rx: 40, rz: lerp(-16, -4, prog(f, 146, 250, EASE.out)), s: lerp(0.55, 1, zoomIn) * lerp(1, 1.22, prog(f, 206, 240, EASE.inOut)), ...CENTER};
  const toPlane = (p: [number, number]) => [(p[0] - MID[0]) * K, (p[1] - MID[1]) * K] as [number, number];
  const scr = (p: [number, number]) => {
    const [u, v] = toPlane(p);
    return project(u, v, cam);
  };
  const route = prog(f, 176, 210, EASE.inOut);
  const car = bezier(ROUTE, route);
  const carS = scr(car);
  const tanaS = scr(TANA);
  const toamS = scr(TOAM);
  const pTana = prog(f, 170, 182, EASE.overshoot);
  const pToam = prog(f, 210, 222, EASE.overshoot);
  const routeD = `M ${ROUTE[0].join(' ')} C ${ROUTE[1].join(' ')} ${ROUTE[2].join(' ')} ${ROUTE[3].join(' ')}`;

  const oppSize = fitSize('OPPORTUNITÉS', 1720, 170);
  const nouvSize = 150;

  return (
    <Abs>
      <StripeWipe f={f} start={140} color={P2.orange} />
      {f >= 150 ? (
        <Abs>
          {/* typographie de fond : TRAJECTOIRE */}
          <Marquee text="TRAJECTOIRE  " spec={WIDE(230)} f={f} speed={-6} top={70} outline="rgba(3,16,41,0.35)" opacity={prog(f, W.trajectoire - 6, W.trajectoire + 4)} />
          <Marquee text="TRAJECTOIRE  " spec={WIDE(230)} f={f} speed={6} top={780} outline="rgba(3,16,41,0.35)" offset={500} opacity={prog(f, W.trajectoire, W.trajectoire + 10)} />

          {/* plan 3D */}
          <div
            style={{
              position: 'absolute',
              left: CENTER.cx - 1000,
              top: CENTER.cy - 1000,
              width: 2000,
              height: 2000,
              transform: `perspective(${cam.d}px) rotateX(${cam.rx}deg) rotateZ(${cam.rz}deg) scale(${cam.s})`,
              transformOrigin: '1000px 1000px',
            }}
          >
            <svg width={2000} height={2000}>
              <g transform={`translate(1000 1000) scale(${K}) translate(${-MID[0]} ${-MID[1]})`}>
                {/* trame de points */}
                {Array.from({length: 26}).map((_, i) =>
                  Array.from({length: 26}).map((__, j) => (
                    <circle key={`${i}-${j}`} cx={MID[0] - 650 + i * 52} cy={MID[1] - 650 + j * 52} r={2.2} fill={P2.ink} opacity={0.18} />
                  )),
                )}
                <path d={MADAGASCAR.path} fill="#012A47" transform="translate(0 14)" />
                <path d={MADAGASCAR.path} fill={P2.navy} />
                <path d={MADAGASCAR.path} fill="none" stroke={P2.electric} strokeWidth={1.6} opacity={0.7} />
                <path d={routeD} fill="none" stroke={P2.white} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${route} 1`} />
              </g>
            </svg>
          </div>

          {/* repères (espace écran) */}
          {f >= 176 && route < 1 ? <div style={{position: 'absolute', left: carS[0] - 16, top: carS[1] - 16, width: 32, height: 32, borderRadius: 16, background: P2.white, boxShadow: `0 0 0 8px rgba(255,255,255,0.35)`}} /> : null}
          {pTana > 0 ? (
            <>
              <div style={{position: 'absolute', left: tanaS[0] - 26, top: tanaS[1] - 50, transform: `scale(${pTana})`, transformOrigin: '50% 100%'}}>
                <PinIcon size={52} color={P2.white} dot={P2.navy} />
              </div>
              <LabelCard x={tanaS[0]} y={tanaS[1] + 40} name="ANTANANARIVO" coords="18°53′S · 47°30′E" p={pTana} align="right" />
            </>
          ) : null}
          {pToam > 0 ? (
            <>
              <div style={{position: 'absolute', left: toamS[0] - 32, top: toamS[1] - 62, transform: `scale(${pToam})`, transformOrigin: '50% 100%'}}>
                <PinIcon size={64} color={P2.orange} dot={P2.ink} />
              </div>
              <LabelCard x={toamS[0]} y={toamS[1] - 92} name="TOAMASINA" coords="18°09′S · 49°24′E" p={pToam} dark />
            </>
          ) : null}
        </Abs>
      ) : null}

      {/* NOUVELLES OPPORTUNITÉS — écho typographique */}
      <CircleReveal f={f} start={234} dur={10} x={toamS[0]} y={toamS[1]} color={P2.ink}>
        <Marquee text="NOUVELLES · " spec={WIDE(nouvSize)} f={f} speed={9} top={110} outline={P2.electric} />
        <Marquee text="NOUVELLES · " spec={WIDE(nouvSize)} f={f} speed={-9} top={440} outline={P2.electric} offset={300} opacity={0.6} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 275, display: 'flex', justifyContent: 'center'}}>
          <Slam text="NOUVELLES" spec={WIDE(nouvSize)} f={f} start={244} stagger={0.5} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center'}}>
          <Slam text="OPPORTUNITÉS" spec={WIDE(oppSize)} f={f} start={254} stagger={0.5} color={P2.orange} />
        </div>
        <div style={{position: 'absolute', left: 1240, top: 860}}>
          <Sticker text="DEVENEZ EXPOSANT" f={f} start={267} rot={-6} bg={P2.white} color={P2.ink} size={44} stamp />
        </div>
      </CircleReveal>

      <BlindsWipe f={f} start={292} color={P2.paper} />
    </Abs>
  );
};
