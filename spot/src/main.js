// Chaîne de rendu : scènes → profondeur de champ → transitions → bloom → étalonnage.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { range, loadImage } from './util.js';
import { IMG } from './ui.js';
import * as S from './scenes.js';
import { initOverlay, updateOverlay } from './overlay.js';

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);
const SAMPLES = +(Q.get('samples') ?? 4);
const DOF_TAPS = +(Q.get('dof') ?? 40);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);

function rt(depth = false, samples = 0) {
  const r = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples });
  if (depth) r.depthTexture = new THREE.DepthTexture(W, H);
  return r;
}
const rtScene = [rt(true, SAMPLES), rt(true, SAMPLES)];
const rtDof = [rt(), rt()];
const rtMix = rt();

const dofMat = new THREE.ShaderMaterial({
  defines: { TAPS: DOF_TAPS },
  uniforms: { tColor: { value: null }, tDepth: { value: null }, near: { value: 0.05 }, far: { value: 100 }, focus: { value: 5 }, aperture: { value: 1 }, maxBlur: { value: 12 }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: /* glsl */ `
    #include <packing>
    varying vec2 vUv; uniform sampler2D tColor, tDepth; uniform float near, far, focus, aperture, maxBlur; uniform vec2 res;
    float lin(vec2 uv){ return perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far) * -1.0; }
    float coc(float z){ return clamp(abs(z - focus) / max(z, 0.001) * aperture * 22.0, 0.0, maxBlur); }
    void main(){
      float z = lin(vUv); float r = coc(z);
      vec4 acc = vec4(texture2D(tColor, vUv).rgb, 1.0);
      if (r > 0.6) {
        const float GA = 2.39996323;
        for (int i = 1; i < TAPS; i++) {
          float fi = float(i); float rr = sqrt(fi / float(TAPS)) * r;
          vec2 o = vec2(cos(fi * GA), sin(fi * GA)) * rr / res;
          float zs = lin(vUv + o); float rs = coc(zs);
          float w = (zs < z) ? smoothstep(0.0, 1.0, rs - rr + 1.0) : 1.0;
          acc += vec4(texture2D(tColor, vUv + o).rgb * w, w);
        }
      }
      gl_FragColor = vec4(acc.rgb / acc.a, 1.0);
    }`,
});
const dofQuad = new FullScreenQuad(dofMat);

const mixMat = new THREE.ShaderMaterial({
  uniforms: { tA: { value: null }, tB: { value: null }, p: { value: 0 }, mode: { value: 0 }, blurA: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: /* glsl */ `
    varying vec2 vUv; uniform sampler2D tA, tB; uniform float p; uniform int mode; uniform vec2 blurA, res;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 zoomBlur(sampler2D t, vec2 uv, float s0, float amt){
      vec3 c = vec3(0.); vec2 d = uv - 0.5; float j = hash(uv * res);
      for (int i = 0; i < 36; i++){ float s = s0 * (1.0 - amt * (float(i) + j) / 36.0); c += texture2D(t, clamp(0.5 + d * s, 0.001, 0.999)).rgb; }
      return c / 36.0;
    }
    vec3 dirBlur(sampler2D t, vec2 uv, vec2 dir){
      vec3 c = vec3(0.);
      for (int i = 0; i < 20; i++){ float f = float(i) / 19.0 - 0.5; c += texture2D(t, uv + dir * f / res).rgb; }
      return c / 20.0;
    }
    void main(){
      vec2 uv = vUv; vec3 col;
      if (mode == 0) {
        col = length(blurA) > 0.5 ? dirBlur(tA, uv, blurA) : texture2D(tA, uv).rgb;
      } else if (mode == 1) {
        float e = p * p * (3. - 2. * p);
        vec3 a = zoomBlur(tA, uv, 1.0 - 0.45 * e, 0.35 * sin(3.14159 * min(e * 1.4, 1.0)));
        vec3 b = zoomBlur(tB, uv, 1.0 + 0.5 * (1.0 - e), 0.3 * (1.0 - e));
        col = mix(a, b, smoothstep(0.3, 0.7, e));
        float fl = pow(sin(3.14159 * e), 3.0);
        col += vec3(0.45, 0.8, 1.0) * fl * 0.2 * (1.0 - length(uv - 0.5));
      } else if (mode == 2) {
        float e = p * p * (3. - 2. * p);
        vec2 off = vec2(0.55, 0.0);
        vec3 a = dirBlur(tA, uv + off * e, vec2(220.0 * sin(3.14159 * e), 0.0));
        vec3 b = dirBlur(tB, uv - off * (1.0 - e), vec2(220.0 * sin(3.14159 * e), 0.0));
        col = mix(a, b, smoothstep(0.35, 0.65, e));
      } else {
        float d = (uv.x * 0.55 + uv.y) / 1.55;
        float edge = p * 1.3 - 0.15;
        float m = smoothstep(edge - 0.05, edge + 0.05, d);
        col = mix(texture2D(tB, uv).rgb, texture2D(tA, uv).rgb, m);
        float band = exp(-pow((d - edge) / 0.045, 2.0));
        col += mix(vec3(0.22, 0.87, 0.76), vec3(1.0), 0.5) * band * 1.4;
      }
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const mixQuad = new FullScreenQuad(mixMat);

const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.26, 0.5, 0.95);

const gradeMat = new THREE.ShaderMaterial({
  uniforms: { tIn: { value: rtMix.texture }, frame: { value: 0 }, res: { value: new THREE.Vector2(W, H) }, fade: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: /* glsl */ `
    varying vec2 vUv; uniform sampler2D tIn; uniform float frame, fade; uniform vec2 res;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + frame * 0.618) * 43758.5453); }
    vec3 neutral(vec3 color){
      const float startCompression = 0.8 - 0.04; const float desaturation = 0.15;
      float x = min(color.r, min(color.g, color.b));
      float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
      color -= offset;
      float peak = max(color.r, max(color.g, color.b));
      if (peak < startCompression) return color;
      float d = 1. - startCompression;
      float newPeak = 1. - d * d / (peak + d - startCompression);
      color *= newPeak / peak;
      float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
      return mix(color, vec3(newPeak), g);
    }
    vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
    void main(){
      vec2 uv = vUv; vec2 d = uv - 0.5;
      float ca = 0.0012 * dot(d, d) * 4.0;
      vec3 c;
      c.r = texture2D(tIn, uv + d * ca).r;
      c.g = texture2D(tIn, uv).g;
      c.b = texture2D(tIn, uv - d * ca).b;
      c = neutral(max(c, 0.0));
      float v = smoothstep(1.05, 0.35, length(d * vec2(1.0, 0.75)));
      c *= mix(0.78, 1.0, v);
      c = toSRGB(clamp(c, 0.0, 1.0));
      c += (hash(uv * res) - 0.5) * 0.022;
      c *= 1.0 - fade;
      gl_FragColor = vec4(c, 1.0);
    }`,
});
const gradeQuad = new FullScreenQuad(gradeMat);

let scenes;
const WINDOWS = [
  { s: 's1', a: 0, b: 4.15 },
  { s: 's2', a: 3.85, b: 8.15 },
  { s: 's3', a: 7.85, b: 14.15 },
  { s: 'sp', a: 13.85, b: 25.15 },
  { s: 's6', a: 24.85, b: 30.1 },
];
const TRANS = [
  { a: 3.85, b: 4.15, mode: 1 },
  { a: 7.85, b: 8.15, mode: 2 },
  { a: 13.85, b: 14.15, mode: 3 },
  { a: 24.85, b: 25.15, mode: 1 },
];

function renderScene(sc, t, i) {
  sc.update(t);
  renderer.setRenderTarget(rtScene[i]);
  renderer.render(sc.scene, sc.camera);
  if (!sc.dof) return rtScene[i].texture;
  dofMat.uniforms.tColor.value = rtScene[i].texture;
  dofMat.uniforms.tDepth.value = rtScene[i].depthTexture;
  dofMat.uniforms.near.value = sc.camera.near;
  dofMat.uniforms.far.value = sc.camera.far;
  dofMat.uniforms.focus.value = sc.dof.focus;
  dofMat.uniforms.aperture.value = sc.dof.aperture;
  dofMat.uniforms.maxBlur.value = sc.dof.maxBlur;
  renderer.setRenderTarget(rtDof[i]);
  dofQuad.render(renderer);
  return rtDof[i].texture;
}

window.syncGPU = () => {
  const gl = renderer.getContext();
  const px = new Uint8Array(4);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
};
window.renderAt = async (t) => {
  const act = WINDOWS.filter((w) => t >= w.a && t < w.b).map((w) => scenes[w.s]);
  const tr = TRANS.find((x) => t >= x.a && t < x.b);
  const texA = renderScene(act[0], t, 0);
  mixMat.uniforms.tA.value = texA;
  mixMat.uniforms.blurA.value.set(0, 0);
  if (act[0].blurDir) mixMat.uniforms.blurA.value.copy(act[0].blurDir);
  if (tr && act[1]) {
    mixMat.uniforms.tB.value = renderScene(act[1], t, 1);
    mixMat.uniforms.p.value = range(t, tr.a, tr.b);
    mixMat.uniforms.mode.value = tr.mode;
  } else {
    mixMat.uniforms.mode.value = 0;
  }
  renderer.setRenderTarget(rtMix);
  mixQuad.render(renderer);
  const bA = act[0].bloom ?? 0.26, bB = tr && act[1] ? act[1].bloom ?? 0.26 : bA;
  bloom.strength = tr && act[1] ? bA + (bB - bA) * range(t, tr.a, tr.b) : bA;
  bloom.render(renderer, null, rtMix, 0, false);
  renderer.setRenderTarget(null);
  gradeMat.uniforms.frame.value = Math.round(t * 30);
  gradeMat.uniforms.fade.value = 1 - range(t, 0, 0.12);
  gradeQuad.render(renderer);
  updateOverlay(t);
  return true;
};

async function init() {
  const fonts = [500, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px Montserrat`, 'ÀÉabc'));
  await Promise.all(fonts);
  const svg = await (await fetch('assets/wordmark.svg')).text();
  const svgImg = async (color) => loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('currentColor', color)));
  [IMG.tile, IMG.symbol, IMG.wmWhite, IMG.wmNavy] = await Promise.all([loadImage('assets/logo_tile.png'), loadImage('assets/logo_symbol.png'), svgImg('#F7F9FF'), svgImg('#0B1030')]);
  const tl = new THREE.TextureLoader();
  const [tile, symbol, wood, woodRough] = await Promise.all(['assets/logo_tile.png', 'assets/logo_symbol.png', 'assets/wood.jpg', 'assets/wood_rough.jpg'].map((u) => tl.loadAsync(u)));
  for (const t of [tile, symbol]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  }
  const assets = { tile, symbol, wood, woodRough };
  S.initEnv(renderer);
  scenes = { s1: S.scene1(assets), s2: S.scene2(assets), s3: S.scene3(assets), sp: S.scenePhone(assets), s6: S.scene6(assets) };
  initOverlay(svg);
  // pré-compilation des shaders
  for (const t of [1, 5, 10, 16, 27]) await window.renderAt(t);
  window.READY = true;
}
init().catch((e) => {
  console.error(e);
  window.INIT_ERROR = String(e && e.stack ? e.stack : e);
});
