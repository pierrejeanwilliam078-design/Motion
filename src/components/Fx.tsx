import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {HEIGHT, WIDTH} from '../timeline';

/** Flou directionnel (motion blur) via filtre SVG anisotrope. */
export const DirBlur: React.FC<{id: string; x: number; y: number; children: React.ReactNode}> = ({id, x, y, children}) => {
	if (x < 0.25 && y < 0.25) return <AbsoluteFill>{children}</AbsoluteFill>;
	return (
		<AbsoluteFill>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
					<feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} edgeMode="duplicate" />
				</filter>
			</svg>
			<AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

/**
 * Reflet lumineux qui balaie une zone définie par un masque (PNG alpha).
 * progress : 0 → 1 (position de la bande), angle en degrés.
 */
export const MaskedSweep: React.FC<{
	mask: string;
	progress: number;
	opacity: number;
	angle?: number;
	width?: number;
	color?: string;
}> = ({mask, progress, opacity, angle = 115, width = 14, color = 'rgba(255,255,255,0.95)'}) => {
	if (opacity <= 0.001) return null;
	const c = -30 + progress * 160; // position en %
	const url = `url(${staticFile(mask)})`;
	return (
		<AbsoluteFill
			style={{
				opacity,
				mixBlendMode: 'screen',
				background: `linear-gradient(${angle}deg, transparent ${c - width}%, ${color} ${c}%, transparent ${c + width}%)`,
				WebkitMaskImage: url,
				maskImage: url,
				WebkitMaskSize: `${WIDTH}px ${HEIGHT}px`,
				maskSize: `${WIDTH}px ${HEIGHT}px`,
			}}
		/>
	);
};

/** Lumière douce ajoutée sur une zone masquée (intérieur de voiture, panneaux…). */
export const MaskedGlow: React.FC<{mask: string; opacity: number; color: string}> = ({mask, opacity, color}) => {
	if (opacity <= 0.001) return null;
	const url = `url(${staticFile(mask)})`;
	return (
		<AbsoluteFill
			style={{
				opacity,
				mixBlendMode: 'screen',
				background: color,
				WebkitMaskImage: url,
				maskImage: url,
				WebkitMaskSize: `${WIDTH}px ${HEIGHT}px`,
				maskSize: `${WIDTH}px ${HEIGHT}px`,
			}}
		/>
	);
};

/** Petite étincelle (scintillement de l'eau, reflets). */
export const Glint: React.FC<{x: number; y: number; size: number; opacity: number; rotate?: number}> = ({
	x,
	y,
	size,
	opacity,
	rotate = 0,
}) => {
	if (opacity <= 0.01) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				opacity,
				mixBlendMode: 'screen',
				transform: `rotate(${rotate}deg)`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(220,245,255,0.55) 18%, rgba(255,255,255,0) 55%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 0,
					width: 2,
					height: '100%',
					marginLeft: -1,
					background: 'linear-gradient(transparent, white, transparent)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: 0,
					height: 2,
					width: '100%',
					marginTop: -1,
					background: 'linear-gradient(90deg, transparent, white, transparent)',
				}}
			/>
		</div>
	);
};
