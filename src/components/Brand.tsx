import React from 'react';
import {COLORS} from '../timeline';
import {FONT} from '../fonts';

/** Pictogramme de localisation TIAVOYAGES (repris de la casquette et du sac à dos). */
export const PinIcon: React.FC<{height: number; style?: React.CSSProperties; ring?: string; dot?: string}> = ({
	height,
	style,
	ring = '#FFFFFF',
	dot = COLORS.blue,
}) => (
	<svg viewBox="0 0 100 128" height={height} width={(height * 100) / 128} style={{overflow: 'visible', ...style}}>
		<path
			d="M50 2C23.5 2 3 22.6 3 49.2c0 30.6 36.6 66.8 43.6 73.4a4.9 4.9 0 0 0 6.8 0C60.4 116 97 79.8 97 49.2 97 22.6 76.5 2 50 2Z"
			fill={COLORS.yellow}
		/>
		<path
			d="M50 2C23.5 2 3 22.6 3 49.2c0 30.6 36.6 66.8 43.6 73.4a4.9 4.9 0 0 0 6.8 0C60.4 116 97 79.8 97 49.2 97 22.6 76.5 2 50 2Z"
			fill="none"
			stroke={COLORS.yellowDeep}
			strokeOpacity={0.35}
			strokeWidth={3}
		/>
		<circle cx={50} cy={48} r={25} fill={ring} />
		<circle cx={50} cy={48} r={12} fill={dot} />
	</svg>
);

/**
 * Logotype « TIAV[pin]YAGES » : le « O » est remplacé par le pictogramme,
 * comme sur la casquette de la mascotte.
 * pinDrop / pinScale permettent d'animer le pictogramme séparément.
 */
export const Wordmark: React.FC<{
	size: number;
	color?: string;
	pinDrop?: number;
	pinScale?: number;
	letterSpacing?: number;
}> = ({size, color = COLORS.blue, pinDrop = 0, pinScale = 1, letterSpacing = 0.02}) => {
	const text: React.CSSProperties = {
		fontFamily: FONT,
		fontWeight: 800,
		fontSize: size,
		color,
		letterSpacing: `${letterSpacing}em`,
		lineHeight: 1,
	};
	return (
		<div style={{display: 'flex', alignItems: 'flex-end', whiteSpace: 'nowrap'}}>
			<span style={text}>TIAV</span>
			<span
				style={{
					display: 'inline-flex',
					margin: `0 ${size * 0.03}px`,
					transform: `translateY(${pinDrop - size * 0.02}px) scale(${pinScale})`,
					transformOrigin: '50% 100%',
				}}
			>
				<PinIcon height={size * 0.98} />
			</span>
			<span style={text}>YAGES</span>
		</div>
	);
};

/** Avion stylisé (pictogramme « flight », Material Icons — licence Apache 2.0). */
export const PlaneGlyph: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({
	size,
	color = '#fff',
	style,
}) => (
	<svg viewBox="0 0 24 24" width={size} height={size} style={style}>
		<path
			fill={color}
			d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
		/>
	</svg>
);
