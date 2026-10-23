// Transforme dist/index.html (build Vite autonome) en fragment publiable comme page Artifact :
// le titre, les métadonnées, les styles et les scripts sont conservés, sans le squelette <html>.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join('\n');
const title = pick(/<title>[\s\S]*?<\/title>/g);
const metas = pick(/<meta name="claude:[^>]*>/g);
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1].replace(/<script[\s\S]*?<\/script>/g, '').trim() ?? '';
await mkdir('artifact', { recursive: true });
await writeFile('artifact/digitalsub-motion.html', [title, metas, styles, body, scripts].join('\n'));
console.log('✓ artifact/digitalsub-motion.html');
