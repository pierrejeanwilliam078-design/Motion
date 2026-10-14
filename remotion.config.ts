import {Config} from '@remotion/cli/config';

// Rendu H.264 haute qualité, 1920×1080 @ 25 fps (voir src/Root.tsx).
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
