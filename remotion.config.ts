import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setAudioBitrate('192k');
Config.setConcurrency(null);

// Facultatif : utiliser un Chrome/Chromium déjà installé au lieu du
// téléchargement automatique de Remotion.
// Exemple : REMOTION_CHROME=/chemin/vers/chrome npm run render
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
