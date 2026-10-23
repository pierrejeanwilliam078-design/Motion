import { Config } from '@remotion/cli/config';

// Rendu MP4 : H.264, yuv420p (compatible smartphones et réseaux sociaux), AAC.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setOverwriteOutput(true);
// Navigateur local facultatif (sinon Remotion télécharge Chrome Headless Shell).
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
