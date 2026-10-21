// Render a three.js scene to a PNG sequence with headless Chromium (SwiftShader WebGL).
//   node render3d.mjs <scene> <t0> <t1> <outdir> [--sub N] [--ext DIR]
// Frame k is written as <outdir>/<frame>.png where frame = round(t*25); with --sub N,
// N sub-frames spread over a 180° shutter are written as <frame>_<j>.png (motion blur).
// --ext DIR serves DIR under /ext/ (e.g. extracted footage frames for video textures).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { extname, join } from 'path';

const [scene, t0s, t1s, outdir, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const SUB = +opt('--sub', 1), EXT = opt('--ext', null), FPS = 25;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg' };
const root = process.cwd();
const srv = createServer(async (q, r) => {
  try {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const p = u.startsWith('/ext/') && EXT ? join(EXT, u.slice(5)) : join(root, u);
    const b = await readFile(p);
    r.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' }); r.end(b);
  } catch { r.writeHead(404); r.end(); }
}).listen(0);
const port = srv.address().port;
await mkdir(outdir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1082, height: 1920 } });
page.on('pageerror', e => console.error('page error:', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://localhost:${port}/stage.html?scene=${scene}`);
await page.waitForFunction(() => window.ready, null, { timeout: 300000 });
const f0 = Math.round(+t0s * FPS), f1 = Math.round(+t1s * FPS);
const t_start = Date.now();
for (let f = f0; f <= f1; f++) {
  for (let j = 0; j < SUB; j++) {
    const t = f / FPS + (SUB > 1 ? (j / (SUB - 1) - 0.5) * 0.5 / FPS : 0);
    const d = await page.evaluate(([t, f]) => window.render(t, { frame: f }), [t, f]);
    const name = SUB > 1 ? `${String(f).padStart(5, '0')}_${j}.png` : `${String(f).padStart(5, '0')}.png`;
    await writeFile(join(outdir, name), Buffer.from(d.split(',')[1], 'base64'));
  }
}
console.log(`${scene}: frames ${f0}-${f1} x${SUB} in ${((Date.now() - t_start) / 1000).toFixed(1)}s`);
await browser.close(); srv.close();
