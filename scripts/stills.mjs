// Rendu rapide d'images de contrôle : node scripts/stills.mjs 0 50 100 ...
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';

const comp = process.env.COMP || 'GSN40';
const frames = process.argv.slice(2).map(Number);
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id: comp, puppeteerInstance: browser});
fs.mkdirSync('out/stills', {recursive: true});
for (const frame of frames) {
  await renderStill({composition, serveUrl, frame, output: `out/stills/${comp}-f${String(frame).padStart(4, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 80, puppeteerInstance: browser});
  console.log('frame', frame);
}
await browser.close({silent: true});
