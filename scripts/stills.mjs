// Renders preview stills of chosen frames (bundles once).
// Usage: node scripts/stills.mjs out/stills 10 40 120 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'TiavoyagesPremium', browserExecutable});
for (const f of frames) {
	const output = path.join(outDir, `f${String(f).padStart(3, '0')}.jpg`);
	await renderStill({serveUrl, composition, frame: Number(f), output, imageFormat: 'jpeg', jpegQuality: 90, browserExecutable, scale: Number(process.env.SCALE ?? 0.5)});
	console.log('still', f);
}
