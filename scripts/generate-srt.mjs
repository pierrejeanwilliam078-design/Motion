// Génère le fichier de sous-titres SRT à partir de src/data/captions.json.
// Les temps du JSON sont relatifs au fichier de voix off : on ajoute le
// décalage défini dans src/data/timeline.json (voiceover.offsetSeconds).
// Usage : npm run srt
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const captions = JSON.parse(fs.readFileSync(path.join(root, "src/data/captions.json"), "utf8"));
const timeline = JSON.parse(fs.readFileSync(path.join(root, "src/data/timeline.json"), "utf8"));
const offset = timeline.voiceover.offsetSeconds;

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms % 1000, 3)}`;
};

const lines = captions.lines;
const blocks = lines.map((l, i) => {
  const next = lines[i + 1];
  // Laisse la ligne affichée un peu après la fin de la phrase, sans chevaucher la suivante.
  const end = Math.min(l.end + 0.25, next ? next.start : Infinity);
  return `${i + 1}\n${stamp(l.start + offset)} --> ${stamp(end + offset)}\n${l.text.replace(/ /g, " ")}\n`;
});

const outDir = path.join(root, "subtitles");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "miarina-media-ad.fr.srt");
fs.writeFileSync(out, blocks.join("\n"), "utf8");
console.log(`${lines.length} sous-titres → ${path.relative(root, out)}`);
