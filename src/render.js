// Rend teaser.html image par image avec Chromium (Playwright) et assemble la vidéo avec ffmpeg.
//
//   node src/render.js                          -> dist/open-days-teaser.mp4 (1920x1080, 30 i/s)
//   node src/render.js --stills 3.4,12.2,31     -> build/still-XX.XX.jpg (contrôle visuel)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const FPS = Number(opt('--fps', 30));
const OUT = path.resolve(ROOT, opt('--out', 'dist/open-days-teaser.mp4'));
const AUDIO = path.resolve(ROOT, opt('--audio', 'build/soundtrack.wav'));
const stills = opt('--stills', null);

// Serveur statique local : en file://, le logo rendrait le canvas non exportable.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.m4a': 'audio/mp4' };
function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/src/teaser.html?render`);
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.TIMELINE.duration);
  const grab = t => page.evaluate(tt => { window.renderFrame(tt); return document.getElementById('c').toDataURL('image/jpeg', 0.96); }, t);

  if (stills) {
    fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
    for (const s of stills.split(',').map(Number)) {
      const url = await grab(s);
      const file = path.join(ROOT, 'build', `still-${s.toFixed(2)}.jpg`);
      fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
      console.log(file);
    }
    await browser.close();
    server.close();
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', AUDIO,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });

  const frames = Math.round(duration * FPS);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const url = await grab(f / FPS);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`\rimage ${f}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  console.log(`\n${OUT}`);
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
