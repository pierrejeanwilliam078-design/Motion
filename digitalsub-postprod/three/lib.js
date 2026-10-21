// Shared three.js toolkit for the DigitalSub 3D scenes (PBR studio, materials, 3D type).
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE, RoundedBoxGeometry };
export const W = 1082, H = 1920;
export const C = { navy: 0x070b22, navy2: 0x0e1640, cyan: 0x46e3f5, violet: 0x8b5cf6, white: 0xffffff };

export function makeRenderer({ alpha = true } = {}) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha, preserveDrawingBuffer: true, premultipliedAlpha: false });
  r.setSize(W, H); r.setPixelRatio(1);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(0x000000, alpha ? 0 : 1);
  document.body.appendChild(r.domElement);
  return r;
}

// Photographic studio environment: gradient sky with a bright horizon band and
// softbox strips in white, cyan and violet. Gives chrome and glass real reflections.
export function studioEnv(renderer, { warm = 1 } = {}) {
  const env = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 v; void main(){ v = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 v; void main(){
      float y = v.y;
      float front = smoothstep(-0.3, 0.7, v.z);
      vec3 floorC = vec3(0.012,0.014,0.035), top = vec3(0.09,0.06,0.20);
      vec3 c = y < 0. ? mix(vec3(0.16,0.17,0.24), floorC, smoothstep(0.,0.45,-y)) : mix(vec3(0.85,0.88,1.0), top, smoothstep(0.,0.5,y));
      c += vec3(1.8) * exp(-pow(y / 0.018, 2.));                       // razor horizon
      float bands = smoothstep(0.10,0.115,y) * (1. - smoothstep(0.27,0.285,y))
                  + 0.7 * smoothstep(-0.34,-0.325,y) * (1. - smoothstep(-0.21,-0.195,y));
      c = mix(c, vec3(2.4), bands * front);                              // studio light bars
      c *= mix(1., 0.12, front * smoothstep(0.015,0.03,y) * (1. - smoothstep(0.085,0.10,y)));  // dark gap
      c *= mix(1., 0.2, front * smoothstep(-0.19,-0.17,y) * (1. - smoothstep(-0.03,-0.015,y)));
      gl_FragColor = vec4(c,1.); }`,
  }));
  env.add(sky);
  const strip = (color, k, pos, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  strip(0xffffff, 8 * warm, [0, 14, 6], 18, 3);       // key softbox above
  strip(0x46e3f5, 5, [-16, 2, 4], 2, 14);              // cyan rim left
  strip(0x8b5cf6, 5, [16, 1, 4], 2, 14);               // violet rim right
  strip(0xffffff, 3, [0, -3, 16], 14, 1.2);            // low fill strip in front
  strip(0xffffff, 4, [-9, 8, -12], 6, 2);              // back kicker
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.015).texture;
  pm.dispose();
  return tex;
}

export const mats = {
  chrome: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.25 }),
  darkChrome: () => new THREE.MeshPhysicalMaterial({ color: 0x9aa3c7, metalness: 1, roughness: 0.18, envMapIntensity: 1.1 }),
  glass: (tint = 0xffffff) => new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: 0.06, transmission: 1, thickness: 0.6, ior: 1.45, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4, attenuationColor: new THREE.Color(tint), attenuationDistance: 3 }),
  // Glass without the transmission pass (not available in the software WebGL renderer): a thin tinted
  // sheet whose opacity rises at grazing angles (Fresnel) plus clearcoat studio reflections.
  glassPanel: (tint = 0xc9d2ff, base = 0.16) => {
    const m = new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02,
      transparent: true, opacity: 1, envMapIntensity: 2.2, depthWrite: false });
    m.userData.glass = base;
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
        float fres = pow(1. - abs(dot(normalize(vViewPosition), normal)), 2.5);
        diffuseColor.a = clamp(${base.toFixed(3)} + 0.75 * fres, 0., 1.) * opacity;
        #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'glassPanel' + base;
    return m;
  },
  frosted: (tint = 0xbfc8ff) => new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: 0.35, transmission: 1, thickness: 0.4, ior: 1.4, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.2 }),
  inflated: (color) => new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.4, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 1.0 }),
  satin: (color) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.6, roughness: 0.32, clearcoat: 0.6, envMapIntensity: 1.1 }),
};

const fonts = {};
export async function font(file) {
  if (!fonts[file]) {
    const l = new TTFLoader();
    l.reversed = file.endsWith('.otf');  // CFF outlines wind the other way
    fonts[file] = new Font(l.parse(await (await fetch(file)).arrayBuffer()));
  }
  return fonts[file];
}

// Clone a PBR material for 3D type: front faces are shaded as if softly convex across the
// cap height (per-pixel), so the studio horizon and light bars sweep cleanly across letters.
export function typeMat(base, bulge = 0.9) {
  const m = base.clone();
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute float bulgeY;\nvarying float vBulgeY;\nvarying vec3 vBulgeN;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>\n vBulgeY = bulgeY; vBulgeN = normalMatrix * vec3(0., ${bulge.toFixed(3)} * min(bulgeY, 1.5), 1.);`);
    sh.fragmentShader = 'varying float vBulgeY;\nvarying vec3 vBulgeN;\n' + sh.fragmentShader.replace('#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n if (vBulgeY < 10.) normal = normalize(vBulgeN);');
  };
  m.customProgramCacheKey = () => 'type' + bulge;
  return m;
}

export function text3d(str, f, { size = 1, depth = 0.3, bevel = 0.03, bevelSeg = 6, curve = 10, align = 'center', bulge = 0.9 } = {}) {
  const g = new TextGeometry(str, { font: f, size, depth, curveSegments: curve, bevelEnabled: bevel > 0, bevelThickness: bevel * 1.4, bevelSize: bevel, bevelSegments: bevelSeg });
  g.computeBoundingBox();
  const b = g.boundingBox;
  const dx = align === 'left' ? -b.min.x : -(b.min.x + b.max.x) / 2;
  g.translate(dx, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2);
  g.computeVertexNormals();
  // Per-vertex height across the cap (front faces only) for the convex chrome shading in typeMat().
  const n = g.attributes.normal, p = g.attributes.position, hh = (b.max.y - b.min.y) / 2;
  const by = new Float32Array(n.count);
  for (let i = 0; i < n.count; i++) by[i] = n.getZ(i) > 0.9 ? p.getY(i) / hh : 99;
  g.setAttribute('bulgeY', new THREE.BufferAttribute(by, 1));
  g.userData.bulge = bulge;
  return g;
}

// Canvas-drawn label as a texture (for flat UI text on glass, URLs, etc.)
export function labelTexture(lines, { w = 1024, h = 256, bg = null, font = '700 120px "Inter Display"', color = '#ffffff', align = 'center' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = color; x.textBaseline = 'middle'; x.textAlign = align;
  (Array.isArray(lines) ? lines : [lines]).forEach((l, i, a) => { x.font = l.font || font; x.fillStyle = l.color || color;
    x.fillText(l.text ?? l, align === 'left' ? 40 : w / 2, h * (i + 0.5) / a.length); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// easing
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, t0, d) => clamp((t - t0) / d);
export const out3 = x => 1 - Math.pow(1 - clamp(x), 3);
export const out5 = x => 1 - Math.pow(1 - clamp(x), 5);
export const inout3 = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const outExpo = x => { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
export const inoutExpo = x => { x = clamp(x); if (x === 0 || x === 1) return x; return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2; };
export const outBack = (x, s = 1.4) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
export const mix = (a, b, k) => a + (b - a) * k;

// Overlay stage: transparent canvas over the footage; helpers map screen pixels to world units.
export function overlayStage({ envWarm = 1 } = {}) {
  const renderer = makeRenderer({ alpha: true });
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer, { warm: envWarm });
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 400);
  cam.position.set(0, 0, 20);
  const U = H / (2 * 20 * Math.tan(THREE.MathUtils.degToRad(15)));  // px per world unit at z = 0
  const at = (x, y, z = 0) => new THREE.Vector3((x - W / 2) / U, -(y - H / 2) / U, z);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8b5cf6, 1.0); rim.position.set(-6, -2, -4); scene.add(rim);
  return { renderer, scene, cam, U, at };
}

// Fit a centred text mesh to a target width in pixels (overlay stage units).
export function fitWidth(mesh, px, U) {
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox;
  const s = (px / U) / (b.max.x - b.min.x);
  mesh.userData.base = s; mesh.scale.setScalar(s);
  return mesh;
}

// Show/hide a mesh tree with an opacity factor (keeps PBR shading).
export function fade(obj, a) {
  obj.visible = a > 0.003;
  obj.traverse(o => {
    if (!o.material || o.userData.noFade) return;
    const glass = o.material.userData.glass !== undefined;
    o.material.transparent = glass || a < 0.999; o.material.opacity = a; o.material.depthWrite = !glass && a >= 0.999;
  });
}

export function photoBackground(scene, top = 0x0c1238, bottom = 0x03040c) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#' + new THREE.Color(top).getHexString()); g.addColorStop(1, '#' + new THREE.Color(bottom).getHexString());
  x.fillStyle = g; x.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}

// One mesh per glyph (letter-by-letter animation, extra tracking for fat bevels). Returns a centred Group.
export function textLetters(str, f, mat, { size = 1, depth = 0.2, bevel = 0.08, bevelSeg = 10, curve = 14, tracking = 0.08 } = {}) {
  const grp = new THREE.Group();
  const k = size / f.data.resolution;
  let x = 0;
  for (const ch of str) {
    const gl = f.data.glyphs[ch] || f.data.glyphs['?'];
    if (ch !== ' ') {
      const g = text3d(ch, f, { size, depth, bevel, bevelSeg, curve, bulge: 0, align: 'left' });
      g.translate(0, 0, 0);
      const m = new THREE.Mesh(g, mat);
      m.position.x = x;
      grp.add(m);
    }
    x += gl.ha * k + tracking * size;
  }
  const w = x - tracking * size;
  grp.children.forEach(m => { m.position.x -= w / 2; });
  grp.userData.width = w;
  return grp;
}
