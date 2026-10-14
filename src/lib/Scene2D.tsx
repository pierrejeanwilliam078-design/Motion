import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import layersJson from '../layers.json';
import {HEIGHT, WIDTH} from '../timeline';

export type LayerId = 's1_dubai' | 's2_phone' | 's3_airport' | 's4_car' | 's5_walk';

type PartMeta = {x: number; y: number; w: number; h: number; px: number; py: number};
type LayerMeta = {
	parts: Record<string, PartMeta>;
	box: [number, number, number, number];
	screen?: [number, number][];
	sparkles?: [number, number][];
};
export const LAYERS = layersJson as unknown as Record<LayerId, LayerMeta>;

/** Marge de cadrage : les plans (1296 x 2304) sont affichés à 106 % pour autoriser les mouvements. */
export const BASE_SCALE = 1.06;

export type Camera = {
	zoom: number; // 1 = cadrage de l'illustration d'origine
	panX: number; // px, au niveau de la mascotte
	panY: number;
	ox: number; // origine du zoom (0..1)
	oy: number;
	rotY?: number; // rotation 3D légère du plan mascotte (degrés)
};

export type PartTransform = {rotate?: number; scale?: number; x?: number; y?: number; opacity?: number};

export type Life = {sx?: number; sy?: number; rotate?: number; y?: number; x?: number};

type Props = {
	layer: LayerId;
	camera: Camera;
	/** part du mouvement caméra transmise au décor (parallaxe 2.5D) */
	parallax?: number;
	life?: Life;
	parts?: Record<string, PartTransform>;
	bgFx?: React.ReactNode;
	fgFx?: React.ReactNode;
	/** effets superposés à une partie (même transformation que la partie) */
	partFx?: Record<string, React.ReactNode>;
	bgBlur?: number;
	/** si faux : le décor n'est pas affiché (réutilisation de la mascotte seule) */
	showBg?: boolean;
	showFg?: boolean;
};

export const cameraTransform = (c: Camera, factor: number, cover = false) => {
	const s = BASE_SCALE * (1 + (c.zoom - 1) * factor);
	let px = c.panX * factor;
	let py = c.panY * factor;
	if (cover) {
		// le décor doit toujours couvrir l'image : on borne le déplacement
		const ox = c.ox * WIDTH;
		const oy = c.oy * HEIGHT;
		px = Math.min(ox * (s - 1), Math.max((WIDTH - ox) * (1 - s), px));
		py = Math.min(oy * (s - 1), Math.max((HEIGHT - oy) * (1 - s), py));
	}
	return `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px) scale(${s.toFixed(5)})`;
};

export const Scene2D: React.FC<Props> = ({
	layer,
	camera,
	parallax = 0.55,
	life = {},
	parts = {},
	bgFx,
	fgFx,
	partFx = {},
	bgBlur = 0,
	showBg = true,
	showFg = true,
}) => {
	const meta = LAYERS[layer];
	const origin = `${camera.ox * WIDTH}px ${camera.oy * HEIGHT}px`;
	const [bx0, , bx1, by1] = meta.box;
	const feet = `${((bx0 + bx1) / 2) * WIDTH}px ${by1 * HEIGHT}px`;

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			{showBg ? (
				<AbsoluteFill style={{transform: cameraTransform(camera, parallax, true), transformOrigin: origin}}>
					<Img
						src={staticFile(`images/${layer}/bg.jpg`)}
						style={{
							width: WIDTH,
							height: HEIGHT,
							filter: bgBlur > 0.05 ? `blur(${bgBlur}px)` : undefined,
							// repousse hors champ les bords adoucis par le flou
							transform: bgBlur > 0.05 ? `scale(${(1 + bgBlur * 0.008).toFixed(4)})` : undefined,
						}}
					/>
					{bgFx}
				</AbsoluteFill>
			) : null}
			{showFg ? (
				<AbsoluteFill style={{perspective: 1800, perspectiveOrigin: origin}}>
					<AbsoluteFill
						style={{
							transform: `${cameraTransform(camera, 1)} rotateY(${(camera.rotY ?? 0).toFixed(3)}deg)`,
							transformOrigin: origin,
						}}
					>
						<AbsoluteFill
							style={{
								transform: `translate(${(life.x ?? 0).toFixed(2)}px, ${(life.y ?? 0).toFixed(2)}px) rotate(${(life.rotate ?? 0).toFixed(3)}deg) scale(${(life.sx ?? 1).toFixed(5)}, ${(life.sy ?? 1).toFixed(5)})`,
								transformOrigin: feet,
							}}
						>
							<Img src={staticFile(`images/${layer}/fg.png`)} style={{width: WIDTH, height: HEIGHT}} />
							{fgFx}
							{Object.entries(meta.parts).map(([name, p]) => {
								const t = parts[name] ?? {};
								const left = p.x * WIDTH;
								const top = p.y * HEIGHT;
								return (
									<div
										key={name}
										style={{
											position: 'absolute',
											left,
											top,
											width: p.w * WIDTH,
											height: p.h * HEIGHT,
											opacity: t.opacity ?? 1,
											transformOrigin: `${p.px * WIDTH - left}px ${p.py * HEIGHT - top}px`,
											transform: `translate(${(t.x ?? 0).toFixed(2)}px, ${(t.y ?? 0).toFixed(2)}px) rotate(${(t.rotate ?? 0).toFixed(3)}deg) scale(${(t.scale ?? 1).toFixed(5)})`,
										}}
									>
										<Img src={staticFile(`images/${layer}/${name}.png`)} style={{width: '100%', height: '100%'}} />
										{partFx[name]}
									</div>
								);
							})}
						</AbsoluteFill>
					</AbsoluteFill>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

/** Respiration / rebond naturel, ancré aux pieds (aucune déformation du visage). */
export const idleLife = (frame: number, opts: {walk?: boolean; amp?: number; phase?: number} = {}): Life => {
	const amp = opts.amp ?? 1;
	const ph = opts.phase ?? 0;
	const t = frame / 30;
	if (opts.walk) {
		// cadence de marche ~1,9 pas/s : petit rebond + balancement
		const step = Math.sin(2 * Math.PI * 1.9 * t + ph);
		const bounce = Math.abs(Math.sin(Math.PI * 1.9 * t + ph));
		return {
			sy: 1 + 0.012 * amp * bounce,
			sx: 1 - 0.006 * amp * bounce,
			rotate: 0.55 * amp * step,
			y: -3 * amp * bounce,
		};
	}
	const breath = Math.sin(2 * Math.PI * 0.9 * t + ph);
	return {sy: 1 + 0.008 * amp * breath, sx: 1 - 0.004 * amp * breath, rotate: 0.3 * amp * Math.sin(2 * Math.PI * 0.45 * t + ph)};
};
