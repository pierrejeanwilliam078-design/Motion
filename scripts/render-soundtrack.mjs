// Rend la bande-son (musique + effets) en WAV 48 kHz avec le même code Web Audio que l'aperçu,
// via OfflineAudioContext dans Chromium headless. Sortie : public/audio/{music,sfx,mix}.wav
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'public', 'audio');

const bundle = await build({
  entryPoints: [path.join(root, 'src/audio/soundtrack.ts')],
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

await mkdir(outDir, { recursive: true });
for (const kind of ['music', 'sfx', 'mix']) {
  const b64 = await page.evaluate(async (k) => {
    const bytes = await window.Soundtrack.renderStem(k);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, kind);
  const file = path.join(outDir, `${kind}.wav`);
  await writeFile(file, Buffer.from(b64, 'base64'));
  console.log('✓', path.relative(root, file));
}
await browser.close();
