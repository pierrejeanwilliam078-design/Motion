// Extrait la silhouette de Madagascar (Natural Earth 1:50m via world-atlas)
// et projette les villes avec la même projection (équirectangulaire corrigée).
import fs from 'node:fs';
import {feature} from 'topojson-client';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const geo = feature(topo, topo.objects.countries);
const mdg = geo.features.find((f) => f.id === '450');
const polys = mdg.geometry.type === 'Polygon' ? [mdg.geometry.coordinates] : mdg.geometry.coordinates;
// garder l'île principale (plus grand anneau)
const ring = polys.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
const lat0 = -19 * Math.PI / 180;
const k = Math.cos(lat0);
const lons = ring.map((p) => p[0]), lats = ring.map((p) => p[1]);
const minX = Math.min(...lons) * k, maxX = Math.max(...lons) * k;
const minY = -Math.max(...lats), maxY = -Math.min(...lats);
const H = 1000; const s = H / (maxY - minY); const W = (maxX - minX) * s;
const proj = ([lon, lat]) => [+((lon * k - minX) * s).toFixed(1), +((-lat - minY) * s).toFixed(1)];
const d = 'M' + ring.map((p) => proj(p).join(' ')).join('L') + 'Z';
const cities = {
  antananarivo: proj([47.5079, -18.8792]),
  toamasina: proj([49.4023, -18.1492]),
};
const out = `// Généré par scripts/madagascar.mjs — Natural Earth 1:50m (domaine public), via world-atlas.
export const MADAGASCAR = {
  width: ${W.toFixed(1)},
  height: ${H},
  path: '${d}',
  cities: ${JSON.stringify(cities)} as Record<'antananarivo' | 'toamasina', [number, number]>,
};
`;
fs.writeFileSync('src/data/madagascar.ts', out);
console.log('W', W.toFixed(1), 'pts', ring.length, cities);
