import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {EASE, prog} from '../motion/presets';

/** TIAVOYAGES palette (sampled from the supplied artwork). */
export const BRAND = {
	royal: '#1F4FD1',
	royalBright: '#2E6BF0',
	navy: '#0B1F5C',
	navyDeep: '#071337',
	white: '#FFFFFF',
	yellow: '#FFC21A',
	yellowSoft: '#FFD95A',
	turquoise: '#2EC4D6',
	mist: '#EEF4FF',
	mistDeep: '#DCE7FB',
	success: '#1FB27A',
} as const;

export const FONT_FAMILY = 'Montserrat';

// Montserrat (SIL OFL) is bundled locally in public/fonts so renders never
// depend on the network.
const WEIGHTS = [500, 600, 700, 800] as const;
let fontsRequested = false;
export const loadBrandFonts = () => {
	if (fontsRequested || typeof document === 'undefined') {
		return;
	}
	fontsRequested = true;
	const handle = delayRender('Loading Montserrat');
	Promise.all(
		WEIGHTS.map((w) =>
			new FontFace(
				FONT_FAMILY,
				`url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}) format('woff2')`,
				{weight: String(w)},
			)
				.load()
				.then((face) => document.fonts.add(face)),
		),
	)
		.then(() => continueRender(handle))
		.catch((err) => {
			console.error(err);
			continueRender(handle);
		});
};

/**
 * Word-by-word masked rise. Each word slides up from behind its own
 * baseline mask — clean, no bouncing.
 */
export const RiseText: React.FC<{
	text: string;
	frame: number;
	start: number;
	stagger?: number;
	duration?: number;
	style?: React.CSSProperties;
	distance?: number;
}> = ({text, frame, start, stagger = 3, duration = 18, style, distance = 1.1}) => {
	const words = text.split(' ');
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				flexWrap: 'wrap',
				columnGap: '0.28em',
				fontFamily: FONT_FAMILY,
				...style,
			}}
		>
			{words.map((w, i) => {
				const p = prog(frame, start + i * stagger, duration, EASE.outQuint);
				return (
					<span
						key={`${w}-${i}`}
						style={{display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em', marginBottom: '-0.08em'}}
					>
						<span
							style={{
								display: 'inline-block',
								transform: `translateY(${(1 - p) * distance * 100}%)`,
								opacity: Math.min(1, p * 1.6),
							}}
						>
							{w}
						</span>
					</span>
				);
			})}
		</div>
	);
};
