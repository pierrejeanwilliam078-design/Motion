import React from 'react';
import {Audio, staticFile} from 'remotion';

/**
 * The ORIGINAL soundtrack (French male voice-over + music), stream-copied
 * from tiavoyages-dubai-9x16.mp4 without re-encoding. Never altered:
 * no volume change, no pitch/speed change, no trimming.
 * The final export re-muxes this exact AAC stream (see scripts/render.sh).
 */
export const OriginalAudio: React.FC = () => <Audio src={staticFile('audio/original-soundtrack.m4a')} />;
