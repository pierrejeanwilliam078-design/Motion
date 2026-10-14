import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT_FAMILY} from '../../components/BrandTypography';
import {Ripple} from '../../components/MotionGraphics';
import {EASE, keyframes, prog, springAt, SPRINGS} from '../../motion/presets';
import {CUES, FPS} from '../../timeline';
import {CloudLayer, Palm, Sea, Skyline, Sky, Sun} from '../Illustrations';
import {Marker, MaskWords} from '../KineticType';
import {MascotPuppet} from '../MascotPuppet';
import {PinPortal} from '../TransitionsV2';

/** V2 · 01 — « Dubaï, oui… mais à votre façon ! » (00:00–00:04) */
export const V2Scene01Dubai: React.FC<{f: number}> = ({f}) => {
	// Opening: a yellow pin drops on royal blue, then opens a portal onto Dubai.
	const drop = springAt(f, FPS, 0, SPRINGS.pop);
	const cam = keyframes(f, [10, 130], [1.08, 1.0], EASE.outQuint);

	const world = (
		<AbsoluteFill style={{transform: `scale(${cam})`}}>
			<Sky top="#86CBFF" bottom="#EAF6FF" />
			<Sun x={850} y={430} r={86} p={prog(f, 14, 24)} />
			<CloudLayer frame={f} count={4} y={[180, 640]} scale={[0.7, 1.2]} speed={-0.6} seed="s1c" />
			<Skyline frame={f} start={18} ground={1500} fill="#B8CDF5" detail="#FFFFFF" scale={0.92} offsetX={-60} order="left" />
			<Skyline frame={f} start={24} ground={1500} fill={BRAND.royal} detail="#8FB0F5" />
			<Sea y={1490} h={150} frame={f} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 1630, bottom: 0, background: 'linear-gradient(180deg, #F7EEDF, #EBDDC6)'}} />
			<Palm x={70} ground={1650} h={420} sway={Math.sin(f / 18) * 3} />
			<Palm x={1010} ground={1660} h={460} sway={Math.sin(f / 21 + 1) * 3} />
			<MascotPuppet pose="emirati" frame={f} x={540} bottom={1830} height={980} enterAt={30} blinks={[74, 112]} sway={2.2} />

			{/* Kinetic headline, synced to the voice */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center'}}>
				<MaskWords
					words={['DUBAÏ,', 'oui…']}
					frame={f}
					start={CUES.s1Dubai + 2}
					stagger={10}
					exitAt={CUES.s1Facon - 6}
					style={{fontSize: 150, fontWeight: 800, color: BRAND.navy, letterSpacing: '0.01em', lineHeight: 1.05}}
					wordStyle={(i) => (i === 1 ? {fontWeight: 600, color: BRAND.royal} : {})}
				/>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center'}}>
				<MaskWords words={['mais', 'à']} frame={f} start={CUES.s1Facon} stagger={3} style={{fontSize: 72, fontWeight: 600, color: BRAND.royal}} />
				<div style={{fontFamily: FONT_FAMILY, fontSize: 104, fontWeight: 800, color: BRAND.navy, marginTop: 4}}>
					<MaskWords
						words={['VOTRE', 'FAÇON !']}
						frame={f}
						start={CUES.s1Facon + 6}
						stagger={4}
						wordStyle={(i) => (i === 1 ? {} : {})}
						style={{fontSize: 104, fontWeight: 800}}
					/>
				</div>
				<div style={{display: 'flex', justifyContent: 'center', marginTop: -6}}>
					<div
						style={{
							height: 14,
							width: 520 * prog(f, CUES.s1Facon + 14, 16, EASE.outQuint),
							borderRadius: 7,
							background: BRAND.yellow,
						}}
					/>
				</div>
			</div>
		</AbsoluteFill>
	);

	const pinY = keyframes(f, [0, 10], [-200, 900], EASE.outQuint);
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${BRAND.royalBright}, ${BRAND.navy})`}}>
			{f < 16 ? (
				<>
					<Ripple x={540} y={960} p={prog(f, 6, 14)} radius={220} ellipse={0.35} color={BRAND.yellow} width={5} />
					<svg width={120} height={156} viewBox="0 0 100 130" style={{position: 'absolute', left: 480, top: pinY - 120, transform: `scale(${0.6 + 0.4 * drop})`}}>
						<path d="M50 128 C50 128 4 76 4 46 A46 46 0 0 1 96 46 C96 76 50 128 50 128 Z" fill={BRAND.yellow} />
						<circle cx="50" cy="46" r="17" fill="#fff" />
					</svg>
				</>
			) : null}
			<PinPortal frame={f} start={8} duration={18} cx={540} cy={900}>
				{world}
			</PinPortal>
		</AbsoluteFill>
	);
};
