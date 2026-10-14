import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile} from 'remotion';
import {HEIGHT, WIDTH} from '../timeline';

export const ORIGINAL_VIDEO = staticFile('original/tiavoyages-dubai-9x16.mp4');
/** Mascot cut-out of the original video (VP9 + alpha), frame-aligned with ORIGINAL_VIDEO. */
export const MASCOT_MATTE = staticFile('original/mascot-matte.webm');

/** One frame of the original video (or of its mascot matte). */
export const OriginalFrame: React.FC<{srcFrame: number; matte?: boolean; style?: React.CSSProperties}> = ({
	srcFrame,
	matte = false,
	style,
}) => (
	<Freeze frame={Math.round(srcFrame)}>
		<OffthreadVideo
			src={matte ? MASCOT_MATTE : ORIGINAL_VIDEO}
			muted
			transparent={matte}
			style={{position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT, ...style}}
		/>
	</Freeze>
);

/** The mascot, isolated from its background — used so graphics can pass BEHIND the character. */
export const MascotLayer: React.FC<{srcFrame: number; style?: React.CSSProperties}> = ({srcFrame, style}) => (
	<OriginalFrame srcFrame={srcFrame} matte style={style} />
);

export type CameraState = {scale: number; x: number; y: number; rotate?: number};

/** Keeps the camera inside the plate so no border can ever appear. */
export const clampCamera = (c: CameraState): CameraState => {
	const s = Math.max(1, c.scale);
	const mx = ((s - 1) * WIDTH) / 2 - 1;
	const my = ((s - 1) * HEIGHT) / 2 - 1;
	return {
		scale: s,
		x: Math.max(-mx, Math.min(mx, c.x)),
		y: Math.max(-my, Math.min(my, c.y)),
		rotate: c.rotate ?? 0,
	};
};

export const cameraTransform = (c: CameraState) =>
	`translate(${c.x}px, ${c.y}px) scale(${c.scale}) rotate(${c.rotate ?? 0}deg)`;

/**
 * Layered stage for one shot:
 *   plate (original video, optional depth-of-field blur)
 *   → behind  (world-locked graphics that pass behind the mascot)
 *   → mascot  (matte cut-out, sharp)
 *   → front   (world-locked graphics in front)
 *   → hud     (screen-locked graphics, not affected by the camera)
 */
export const SceneStage: React.FC<{
	srcFrame: number;
	camera: CameraState;
	bgBlur?: number;
	behind?: React.ReactNode;
	front?: React.ReactNode;
	hud?: React.ReactNode;
	useMatte?: boolean;
	vignette?: number;
}> = ({srcFrame, camera, bgBlur = 0, behind, front, hud, useMatte = true, vignette = 0.2}) => {
	const cam = clampCamera(camera);
	return (
		<AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#0B1F5C'}}>
			<AbsoluteFill style={{transform: cameraTransform(cam), transformOrigin: '50% 50%'}}>
				<OriginalFrame srcFrame={srcFrame} style={bgBlur > 0.05 ? {filter: `blur(${bgBlur}px)`} : undefined} />
				{behind ? <AbsoluteFill>{behind}</AbsoluteFill> : null}
				{useMatte ? <MascotLayer srcFrame={srcFrame} /> : null}
				{front ? <AbsoluteFill>{front}</AbsoluteFill> : null}
			</AbsoluteFill>
			{vignette > 0 ? (
				<AbsoluteFill
					style={{
						background: `radial-gradient(ellipse 85% 70% at 50% 46%, rgba(7,19,55,0) 58%, rgba(7,19,55,${vignette}) 100%)`,
						pointerEvents: 'none',
					}}
				/>
			) : null}
			{hud ? <AbsoluteFill>{hud}</AbsoluteFill> : null}
		</AbsoluteFill>
	);
};
