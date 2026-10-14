import data from './timeline.json';

export type SceneId = keyof typeof data.scenes;

export const TIMELINE = data;
export const SCENES = data.scenes as Record<SceneId, [number, number]>;
export const W = data.words;
export const VO = data.voiceover;
export const SFX = data.sfx;
export const MUSIC = data.music;

/** Intervalles (frames) où la voix off parle : sert au ducking de la musique. */
export const VO_RANGES: [number, number][] = data.voiceover.clips.map((c) => [
  c.at,
  c.at + Math.round((c.srcOut - c.srcIn) * data.fps),
]);
