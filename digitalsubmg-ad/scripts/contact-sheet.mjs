// Renders a set of frames and assembles them into one contact-sheet PNG.
// Usage: node scripts/contact-sheet.mjs out/sheet.png 30,100,150 [scale] [cols]
// Env: BROWSER=/path/to/chrome-headless-shell (optional)
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [out = "out/sheet.png", list = "0", scaleArg = "0.35", colsArg = "4"] = process.argv.slice(2);
const frames = list.split(",").map(Number);
const scale = Number(scaleArg);
const tmp = path.join(path.dirname(out), "_frames");
mkdirSync(tmp, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable: process.env.BROWSER ?? null });
const composition = await selectComposition({ serveUrl, id: "DigitalSubAd", puppeteerInstance: browser });
const files = [];
for (const frame of frames) {
  const output = path.join(tmp, `f${String(frame).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale, puppeteerInstance: browser, imageFormat: "png" });
  files.push(output);
}
await browser.close({ silent: true });

const cols = Number(colsArg);
const inputs = files.flatMap((f) => ["-i", f]);
const labels = files.map((_, i) => `[${i}:v]drawtext=text='${frames[i]}':x=12:y=12:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`);
const layout = files.map((_, i) => `${(i % cols) === 0 ? "0" : Array.from({ length: i % cols }, () => "w0").join("+")}_${Math.floor(i / cols) === 0 ? "0" : Array.from({ length: Math.floor(i / cols) }, () => "h0").join("+")}`).join("|");
const graph = `${labels.join(";")};${files.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${files.length}:layout=${layout}:fill=0x222222`;
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", graph, out]);
console.log(out);
