// Rend la bande-son (musique + effets) en WAV 48 kHz avec le même code Web Audio que l'aperçu,
// via OfflineAudioContext dans Chromium headless. Sorties : public/audio/{music,sfx,mix}.wav (V1)
// et public/audio/v2/{music,sfx,mix}.wav (V2).
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'public', 'audio');

const bundle = await build({
  stdin: {
    contents: "export * from './src/audio/soundtrack'; export { scheduleSoundtrackV2 } from './src/v2/soundtrack2';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'iife',
  globalName: 'Soundtrack',
  write: false,
  target: 'es2020',
});

const candidates = [
  process.env.REMOTION_BROWSER,
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
const browser = await chromium.launch({ executablePath, channel: executablePath ? undefined : 'chrome' });
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ content: bundle.outputFiles[0].text });

// `node scripts/render-soundtrack.mjs 2` ne rend que la V2 (idem avec 1).
const only = Number(process.argv[2]) || 0;
for (const [version, dir] of [[1, outDir], [2, path.join(outDir, 'v2')]]) {
if (only && version !== only) continue;
await mkdir(dir, { recursive: true });
for (const kind of ['music', 'sfx', 'mix']) {
  const b64 = await page.evaluate(async ([k, v]) => {
    const S = window.Soundtrack;
    const bytes = await S.renderStem(k, v === 2 ? S.scheduleSoundtrackV2 : S.scheduleSoundtrack);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, [kind, version]);
  const file = path.join(dir, `${kind}.wav`);
  await writeFile(file, Buffer.from(b64, 'base64'));
  console.log('✓', path.relative(root, file));
}
}
await browser.close();
