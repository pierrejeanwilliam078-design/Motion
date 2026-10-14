import React from 'react';
import {BRAND, FONT_FAMILY} from '../components/BrandTypography';
import {EASE, prog} from '../motion/presets';

/** Words that slide up from a mask, one by one. */
export const MaskWords: React.FC<{
	words: string[];
	frame: number;
	start: number;
	stagger?: number;
	exitAt?: number;
	style?: React.CSSProperties;
	wordStyle?: (i: number) => React.CSSProperties;
}> = ({words, frame, start, stagger = 3, exitAt, style, wordStyle}) => (
	<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.25em', fontFamily: FONT_FAMILY, ...style}}>
		{words.map((w, i) => {
			const p = prog(frame, start + i * stagger, 18, EASE.outQuint);
			const e = exitAt === undefined ? 0 : prog(frame, exitAt + i * 2, 12, EASE.inQuart);
			return (
				<span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0.04em 0.02em'}}>
					<span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110 - e * 110}%)`, ...(wordStyle ? wordStyle(i) : {})}}>{w}</span>
				</span>
			);
		})}
	</div>
);

/** Yellow marker highlight that wipes behind a word. */
export const Marker: React.FC<{frame: number; start: number; children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({
	frame,
	start,
	children,
	color = BRAND.yellow,
	style,
}) => {
	const p = prog(frame, start, 14, EASE.outQuint);
	return (
		<span style={{position: 'relative', display: 'inline-block', ...style}}>
			<span
				style={{
					position: 'absolute',
					left: '-0.12em',
					right: '-0.12em',
					top: '18%',
					bottom: '6%',
					background: color,
					borderRadius: '0.14em',
					transform: `scaleX(${p})`,
					transformOrigin: '0% 50%',
					zIndex: 0,
				}}
			/>
			<span style={{position: 'relative', zIndex: 1}}>{children}</span>
		</span>
	);
};
