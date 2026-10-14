import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {BRAND} from '../components/BrandTypography';
import {EASE, prog} from '../motion/presets';

/* V2 transition language: brand-shape morphs (pin portal), stacked colour
   panels, cloud pass, speed panels. */

const PIN_SVG = (fill: string) =>
	`url("data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130'><path d='M50 128 C50 128 4 76 4 46 A46 46 0 0 1 96 46 C96 76 50 128 50 128 Z' fill='${fill}'/></svg>`,
	)}")`;

/**
 * Pin portal: a yellow TIAVOYAGES-style pin grows from (cx, cy); the next
 * shot appears inside a second pin that follows just behind it.
 */
export const PinPortal: React.FC<{frame: number; start: number; duration: number; cx: number; cy: number; children: React.ReactNode}> = ({
	frame,
	start,
	duration,
	cx,
	cy,
	children,
}) => {
	const pOuter = prog(frame, start, duration, EASE.inOut);
	const pInner = prog(frame, start + 3, duration - 1, EASE.inOut);
	if (pOuter <= 0) {
		return null;
	}
	if (pInner >= 1) {
		return <AbsoluteFill>{children}</AbsoluteFill>;
	}
	const size = (p: number) => 20 + p * p * 5200;
	const maskFor = (p: number): React.CSSProperties => {
		const w = size(p);
		const h = w * 1.3;
		const pos = `${cx - w / 2}px ${cy - h * 0.55}px`;
		return {
			WebkitMaskImage: PIN_SVG('#000'),
			maskImage: PIN_SVG('#000'),
			WebkitMaskSize: `${w}px ${h}px`,
			maskSize: `${w}px ${h}px`,
			WebkitMaskPosition: pos,
			maskPosition: pos,
			WebkitMaskRepeat: 'no-repeat',
			maskRepeat: 'no-repeat',
		};
	};
	return (
		<>
			<AbsoluteFill style={{background: BRAND.yellow, ...maskFor(pOuter)}} />
			{pInner > 0 ? <AbsoluteFill style={maskFor(pInner)}>{children}</AbsoluteFill> : null}
		</>
	);
};

/** Three rounded colour panels sweep up; the shots swap behind them. Returns which side is visible. */
export const PanelStack: React.FC<{frame: number; at: number; half: number}> = ({frame, at, half}) => {
	const colors = [BRAND.yellow, BRAND.royal, BRAND.navy];
	const items = colors.map((c, i) => {
		const pin = prog(frame, at - half + i * 2, half, EASE.outExpo);
		const pout = prog(frame, at + i * 2 - 2, half, EASE.inQuart);
		if (pin <= 0 || pout >= 1) {
			return null;
		}
		const y = (1 - pin) * 2000 - pout * 2100;
		return (
			<div
				key={i}
				style={{
					position: 'absolute',
					left: -40,
					right: -40,
					top: y - 60,
					height: 2040,
					borderRadius: 120,
					background: c,
					boxShadow: '0 -20px 60px rgba(7,19,55,0.25)',
				}}
			/>
		);
	});
	return <AbsoluteFill style={{pointerEvents: 'none'}}>{items}</AbsoluteFill>;
};

/** Big white clouds rush across the frame (flying through the sky). */
export const CloudPass: React.FC<{frame: number; at: number; half: number}> = ({frame, at, half}) => {
	const p = prog(frame, at - half, half * 2, EASE.inOutSine);
	if (p <= 0 || p >= 1) {
		return null;
	}
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{new Array(22).fill(0).map((_, i) => {
				const r = 260 + random(`cp-r-${i}`) * 320;
				const y = random(`cp-y-${i}`) * 2100 - 100;
				const lag = random(`cp-l-${i}`) * 0.35;
				const q = Math.min(1, Math.max(0, (p - lag * 0.5) / (1 - lag * 0.5)));
				const x = 1700 - q * 3000 + random(`cp-x-${i}`) * 400;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - r,
							top: y - r,
							width: r * 2,
							height: r * 2,
							borderRadius: '50%',
							background: 'radial-gradient(circle at 45% 40%, #FFFFFF 55%, #EAF3FF 75%, rgba(234,243,255,0) 100%)',
						}}
					/>
				);
			})}
			<AbsoluteFill style={{background: '#F4F9FF', opacity: Math.max(0, Math.min(1, 1 - Math.abs(p - 0.5) * 4.5))}} />
		</AbsoluteFill>
	);
};

/** Horizontal speed panels (left → right). */
export const SpeedPanels: React.FC<{frame: number; at: number; half: number}> = ({frame, at, half}) => {
	const rows = 8;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{new Array(rows).fill(0).map((_, i) => {
				const d = Math.round(random(`sp-${i}`) * 4);
				const pin = prog(frame, at - half + d, half, EASE.outExpo);
				const pout = prog(frame, at + d - 1, half, EASE.inQuart);
				if (pin <= 0 || pout >= 1) {
					return null;
				}
				const x = -1300 + pin * 1300 + pout * 1400;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - 40,
							top: (1920 / rows) * i - 2,
							width: 1200,
							height: 1920 / rows + 4,
							borderRadius: '0 140px 140px 0',
							background: i % 3 === 0 ? BRAND.yellow : i % 3 === 1 ? BRAND.royal : BRAND.navy,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Which shot is visible during a covering transition (panels / clouds). */
export const swapped = (frame: number, at: number) => frame >= at;
