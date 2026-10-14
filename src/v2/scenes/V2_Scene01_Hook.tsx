import React from 'react';
import {FONTS} from '../../config/theme';
import {fontStyle, textWidth} from '../../components/Typography';
import {EASE, keys, lerp, prog} from '../../lib/motion';
import {Abs, CircleReveal, Marquee, P2, Rise, Slam, Sticker, WIDE, fitSize, outlineFilter, shake} from '../kit';
import T from '../timeline.json';

const W = T.words;

/**
 * V2 · SCÈNE 01 — 0 → 6 s — Un mot par temps, coupes franches.
 * « AU-DELÀ » est plus grand que le cadre « Antananarivo » : à l'intérieur il est plein,
 * à l'extérieur il n'est plus qu'un contour → il déborde littéralement du cadre.
 */
const BOX = {x: 340, y: 300, w: 1240, h: 520};

export const V2_Scene01_Hook: React.FC<{f: number}> = ({f}) => {
  const [sx, sy] = shake(f, W.auDela, 12);
  // impulsion d'ouverture
  const dot = prog(f, 0, 6, EASE.overshoot) * (1 - prog(f, 6, 12, EASE.in));
  const ring = prog(f, 0, 16, EASE.out);

  const show = (a: number, b: number) => f >= a && f < b;
  const grandesSize = 400;
  const oppSpec = WIDE(250);
  const audSize = fitSize('AU-DELÀ', 1640, 280);
  const audSpec = WIDE(audSize);
  const audW = textWidth('AU-DELÀ', audSpec);
  const audEnter = prog(f, W.auDela - 3, W.auDela + 5, EASE.out);
  const audExit = prog(f, 130, 146, EASE.in);
  const audX = 960 - audW / 2 + lerp(-1500, 0, audEnter) + 40 * prog(f, W.auDela + 5, 130, EASE.soft) + 2200 * audExit;
  const audY = BOX.y + BOX.h / 2 - audSize * 0.5 - 30;
  const box = prog(f, 84, 92, EASE.overshoot);
  const boxOut = prog(f, 128, 146, EASE.in);
  const boxScale = lerp(0.7, 1, box) * lerp(1, 2.6, boxOut);

  return (
    <Abs style={{background: P2.ink, transform: `translate(${sx}px, ${sy}px)`}}>
      {f < 14 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <circle cx={960} cy={540} r={70 * dot} fill={P2.electric} />
          <circle cx={960} cy={540} r={40 + 900 * ring} fill="none" stroke={P2.electric} strokeWidth={6 * (1 - ring)} />
        </svg>
      ) : null}

      {show(W.etSi, W.vos) ? (
        <Abs style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Slam text="ET SI" spec={WIDE(240)} f={f} start={W.etSi} stagger={1.2} />
        </Abs>
      ) : null}

      {show(W.vos, W.grandes) ? (
        <Abs style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26}}>
          <Rise text="VOS" spec={WIDE(120, 700)} f={f} start={W.vos} color={P2.electric} />
          <Rise text="PROCHAINES" spec={WIDE(fitSize('PROCHAINES', 1700, 200))} f={f} start={W.prochaines} stagger={0.5} dur={7} />
        </Abs>
      ) : null}

      {show(W.grandes, W.opportunites) ? (
        <Abs style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: P2.electric}}>
          <div style={{...fontStyle(WIDE(grandesSize)), color: P2.ink, transform: `scale(${lerp(1.25, 1, prog(f, W.grandes, W.grandes + 6, EASE.out))})`}}>GRANDES</div>
        </Abs>
      ) : null}

      {show(W.opportunites - 3, W.se) ? (
        <CircleReveal f={f} start={W.opportunites - 3} dur={7} color={P2.orange}>
          <Marquee text="OPPORTUNITÉS · " spec={oppSpec} f={f} speed={-34} top={150} outline={P2.navy} />
          <Marquee text="OPPORTUNITÉS · " spec={oppSpec} f={f} speed={30} top={415} color={P2.navy} offset={600} />
          <Marquee text="OPPORTUNITÉS · " spec={oppSpec} f={f} speed={-26} top={680} outline={P2.navy} offset={200} />
        </CircleReveal>
      ) : null}

      {show(W.se, 84) ? (
        <Abs style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0}}>
          <Rise text="SE TROUVAIENT" spec={WIDE(fitSize('SE TROUVAIENT', 1500, 150))} f={f} start={W.se} stagger={0.5} dur={7} />
          {[0, 1, 2].map((i) => {
            const b = Math.max(0, Math.sin((f - W.trouvaient - i * 3) * 0.45));
            return <div key={i} style={{width: 26, height: 26, borderRadius: 13, background: P2.orange, marginLeft: 14, transform: `translateY(${-30 * b}px)`, opacity: prog(f, W.trouvaient, W.trouvaient + 4)}} />;
          })}
        </Abs>
      ) : null}

      {/* cadre « Antananarivo » */}
      {f >= 84 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: BOX.x,
              top: BOX.y,
              width: BOX.w,
              height: BOX.h,
              border: `6px solid ${P2.white}`,
              borderRadius: 40,
              transform: `scale(${boxScale})`,
              opacity: box * (1 - boxOut),
            }}
          >
            <div style={{position: 'absolute', left: 34, top: 28, fontFamily: FONTS.body, fontWeight: 700, fontSize: 24, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)'}}>
              ANTANANARIVO · 18°53′S 47°30′E
            </div>
          </div>
          {/* AU-DELÀ : contour hors cadre, plein dans le cadre */}
          {f >= W.auDela - 3 ? (
            <>
              <div style={{position: 'absolute', left: audX, top: audY, ...fontStyle(audSpec), color: '#000', filter: outlineFilter(P2.electric)}}>AU-DELÀ</div>
              <div style={{position: 'absolute', inset: 0, clipPath: `inset(${BOX.y}px ${1920 - BOX.x - BOX.w}px ${1080 - BOX.y - BOX.h}px ${BOX.x}px round 40px)`, opacity: 1 - boxOut}}>
                <div style={{position: 'absolute', left: audX, top: audY, ...fontStyle(audSpec), color: P2.white}}>AU-DELÀ</div>
              </div>
            </>
          ) : null}
          <div style={{position: 'absolute', left: 960, top: BOX.y + BOX.h - 40, transform: `translateX(-50%) translateY(${keys(f, [130, 146], [0, 500], EASE.in)}px)`}}>
            <Sticker text="D'ANTANANARIVO ?" f={f} start={W.dAntananarivo} rot={-3} bg={P2.orange} color={P2.ink} size={50} style={{position: 'relative'}} />
          </div>
        </>
      ) : null}
    </Abs>
  );
};
