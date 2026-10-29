import { Config } from "@remotion/cli/config";

// Rendu MP4 H.264, 30 fps, qualité élevée.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
Config.setEntryPoint("src/index.ts");

// Navigateur personnalisé (facultatif) : REMOTION_BROWSER=/chemin/vers/chrome npm run render
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
