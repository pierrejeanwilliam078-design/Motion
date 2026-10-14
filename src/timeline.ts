/**
 * Master timeline of the TIAVOYAGES premium edit.
 *
 * All values are in frames at 30 fps (900 frames = 30 s).
 * The output timeline is locked 1:1 to the ORIGINAL video timeline so that the
 * untouched voice-over / music stays in sync with the picture: inside every
 * scene the source frame equals the output frame. Only around transitions does
 * the source time ease in / ease out (speed ramp) so that the original
 * cross-fades of the source video are never shown.
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 900;

export const sec = (s: number) => Math.round(s * FPS);

export type SceneId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6';

export type SceneTiming = {
	/** First output frame on which the scene is visible (transition overlap included). */
	from: number;
	/** Exclusive end frame. */
	to: number;
	/** Clean frame range of the original video for this shot (no fades). */
	clean: [number, number];
};

/** Cut points measured on the original video (frame-difference analysis). */
export const CUTS = {
	s1s2: 120, // 00:04.0
	s2s3: 270, // 00:09.0
	s3s4: 420, // 00:14.0
	s4s5: 576, // 00:19.2
	s5s6: 756, // 00:25.2
} as const;

export const TRANSITION_HALF = 8; // each wipe lasts 16 frames, centred on the cut
export const IRIS_HALF = 12; // final brand iris lasts 24 frames

export const SCENES: Record<SceneId, SceneTiming> = {
	s1: {from: 0, to: CUTS.s1s2 + TRANSITION_HALF, clean: [14, 114]},
	s2: {from: CUTS.s1s2 - TRANSITION_HALF, to: CUTS.s2s3 + TRANSITION_HALF, clean: [128, 265]},
	s3: {from: CUTS.s2s3 - TRANSITION_HALF, to: CUTS.s3s4 + TRANSITION_HALF, clean: [277, 415]},
	s4: {from: CUTS.s3s4 - TRANSITION_HALF, to: CUTS.s4s5 + TRANSITION_HALF, clean: [427, 564]},
	s5: {from: CUTS.s4s5 - TRANSITION_HALF, to: CUTS.s5s6 + IRIS_HALF, clean: [578, 746]},
	s6: {from: CUTS.s5s6 - IRIS_HALF, to: DURATION, clean: [764, 899]},
};

/**
 * Voice-over / music cues measured on the original soundtrack
 * (voice-band energy envelope, 100 ms resolution). Values are output frames.
 */
export const CUES = {
	s1Dubai: sec(0.45), // « Dubaï, oui… »
	s1Facon: sec(1.8), // « …mais à votre façon ! »
	s2Phrase1: sec(4.4),
	s2Phrase2: sec(5.4),
	s2Phrase3: sec(6.2),
	s2Phrase4: sec(6.9),
	s3Phrase1: sec(9.5),
	s3Phrase2: sec(11.6),
	s4Phrase1: sec(14.4),
	s4Phrase2: sec(15.2),
	s4Phrase3: sec(16.6),
	s5Phrase1: sec(19.4),
	s5Phrase2: sec(20.2),
	s5Phrase3: sec(22.2),
	s6Phrase1: sec(25.7),
	s6Phrase2: sec(26.6),
	s6Phrase3: sec(27.6),
	s6Phrase4: sec(28.5),
} as const;

/**
 * Maps an absolute output frame to a frame of the original video.
 * Identity inside the clean range, quadratic ease-in at the head and
 * ease-out at the tail so that motion slows down smoothly into a hold
 * while the transition covers the picture.
 */
export const mapSourceFrame = (frame: number, scene: SceneTiming): number => {
	const {from, to, clean} = scene;
	const [s, e] = clean;
	const kIn = Math.max(0, s - from);
	const kOut = Math.max(0, to - 1 - e);
	let src = frame;
	if (kIn > 0 && frame < s + kIn) {
		const u = Math.max(0, (frame - from) / (2 * kIn));
		src = s + kIn * u * u;
	} else if (kOut > 0 && frame > e - kOut) {
		const u = Math.min(1, (frame - (e - kOut)) / (2 * kOut));
		src = e - kOut + kOut * (1 - (1 - u) * (1 - u));
	}
	return Math.min(e, Math.max(s, src));
};
