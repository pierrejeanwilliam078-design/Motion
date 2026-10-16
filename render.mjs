// Rend l'animation index.html en vidéo MP4 1080x1920 (ou en images fixes).
//
//   node render.mjs                      -> output/fanokafana-2026-2027.mp4
//   node render.mjs --stills 2,6,12,20   -> output/stills/t_XX.png (contrôle)
//   options : --fps 30  --workers 4  --out output/fichier.mp4
//
// Nécessite : playwright (Chromium) et ffmpeg dans le PATH.
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const FPS = +(args.fps || 30);
const DURATION = 35;
const WORKERS = +(args.workers || 4);
const OUT = path.resolve(ROOT, args.out || 'output/fanokafana-2026-2027.mp4');
const URL = pathToFileURL(path.join(ROOT, 'index.html')).href + '?render';
const launchOpts = existsSync('/opt/pw-browsers/chromium') ? {} : {};

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(URL);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
}

async function shoot(page, t, file, type = 'png') {
  await page.evaluate(tt => window.renderAt(tt), t);
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 95 } : {}), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
}

const browser = await chromium.launch(launchOpts);

if (args.stills) {
  const dir = path.join(ROOT, 'output/stills');
  mkdirSync(dir, { recursive: true });
  const page = await openPage(browser);
  for (const s of String(args.stills).split(',')) {
    const t = +s;
    await shoot(page, t, path.join(dir, `t_${t.toFixed(2).padStart(5, '0')}.png`));
    console.log('still', t);
  }
  await browser.close();
  process.exit(0);
}

const total = Math.round(DURATION * FPS);
const tmp = path.join(ROOT, 'output/.frames');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
let done = 0;
const started = Date.now();
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const page = await openPage(browser);
  for (let f = w; f < total; f += WORKERS) {
    await shoot(page, f / FPS, path.join(tmp, `f_${String(f).padStart(5, '0')}.jpg`), 'jpeg');
    if (++done % 60 === 0) console.log(`${done}/${total} images (${((Date.now() - started) / 1000).toFixed(0)} s)`);
  }
}));
await browser.close();

mkdirSync(path.dirname(OUT), { recursive: true });
const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f_%05d.jpg'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
  '-movflags', '+faststart', '-t', String(DURATION), OUT], { stdio: 'inherit' });
if (ff.status !== 0) process.exit(ff.status);
rmSync(tmp, { recursive: true, force: true });
console.log('OK ->', OUT);
