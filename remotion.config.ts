import { Config } from "@remotion/cli/config";

// Rendu MP4 H.264, 30 fps, qualité élevée.
// Images intermédiaires en PNG : sortie en yuv420p standard (le JPEG produit du yuvj420p).
Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
Config.setEntryPoint("src/index.ts");

// Navigateur personnalisé (facultatif) : REMOTION_BROWSER=/chemin/vers/chrome npm run render
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
