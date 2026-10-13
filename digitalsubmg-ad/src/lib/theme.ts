import { continueRender, delayRender, staticFile } from "remotion";
import fonts from "../data/fonts.json";

// Fonts are bundled in public/fonts (Google Fonts, SIL Open Font License) so
// renders never depend on the network.
if (typeof document !== "undefined") {
  const handle = delayRender("Loading fonts");
  Promise.all(
    fonts.map((f) => {
      const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format('woff2')`, {
        weight: f.weight,
        unicodeRange: f.unicodeRange,
        display: "block",
      });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

export const FONT = {
  display: "ArchivoBlack", // XXL kinetic typography
  heading: "SpaceGrotesk", // brand / site headings (digitalsub.org uses a grotesk)
  ui: "InterTight", // interface text
};

export const C = {
  night: "#07152F",
  nightDeep: "#030A18",
  black: "#02050C",
  electric: "#073B9B",
  electricLight: "#0B57D8",
  cyan: "#00E5F2",
  white: "#FFFFFF",
  paper: "#F5F7FB",
  ink: "#0E1B3D", // site headings navy
  navyButton: "#1E2E55", // site "Choisir" button
  gray: "#6B7280",
  border: "#E5E9F0",
  violet: "#7B3FF2",
  magenta: "#D63AF9", // logo gradient end
  whatsapp: "#25D366",
};

// Product accents (lighting only — never redrawn logos).
export const PRODUCT_LIGHT = {
  netflix: "#E50914",
  prime: "#1A98FF",
  chatgpt: "#10A37F",
  spotify: "#1ED760",
  canva: "#7D2AE8",
};
