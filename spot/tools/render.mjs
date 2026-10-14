// Rendu image par image dans Chromium headless (WebGL logiciel).
// Usage :
//   node tools/render.mjs --out frames --from 0 --to 900 [--step 1] [--workers 3]
//   node tools/render.mjs --out stills --times 1,5.5,10
// Nécessite un serveur HTTP sur la racine du dossier spot (voir tools/build.sh).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []),
);
const URL = args.url || 'http://localhost:8765/index.html';
const OUT = args.out || 'frames';
const FPS = 30;
fs.mkdirSync(OUT, { recursive: true });

let jobs;
if (args.times) jobs = args.times.split(',').map((s) => ({ t: +s, name: `t${(+s).toFixed(2)}.png` }));
else {
  const from = +(args.from || 0), to = +(args.to || 900), step = +(args.step || 1);
  jobs = [];
  for (let f = from; f < to; f += step) jobs.push({ t: f / FPS, name: `f${String(f).padStart(4, '0')}.png` });
}
jobs = jobs.filter((j) => args.force || !fs.existsSync(path.join(OUT, j.name)));
const workers = Math.max(1, Math.min(+(args.workers || 1), jobs.length));

async function worker(id, list) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => m.type() === 'error' && console.log(`[w${id}]`, m.text()));
  page.on('pageerror', (e) => console.log(`[w${id}] pageerror`, e.message));
  await page.goto(URL);
  await page.waitForFunction('window.READY || window.INIT_ERROR', null, { timeout: 180000 });
  const err = await page.evaluate('window.INIT_ERROR');
  if (err) throw new Error(err);
  // capture CDP directe (PNG sans perte, encodage rapide)
  const cdp = await page.context().newCDPSession(page);
  let n = 0;
  for (const j of list) {
    await page.evaluate((t) => window.renderAt(t), j.t);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } });
    fs.writeFileSync(path.join(OUT, j.name), Buffer.from(shot.data, 'base64'));
    if (++n % 30 === 0) console.log(`[w${id}] ${n}/${list.length}`);
  }
  await browser.close();
}

const t0 = Date.now();
const parts = Array.from({ length: workers }, (_, i) => jobs.filter((_, k) => k % workers === i));
await Promise.all(parts.map((p, i) => worker(i, p)));
console.log(`rendu ${jobs.length} images en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
