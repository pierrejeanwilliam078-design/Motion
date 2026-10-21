// 16.30–24.95 s · camera journey over a mirror floor past three frosted-glass step tiles (01, 02, 03).
// The step texts are 2D type, placed over each tile while the camera holds on it.
import { THREE, RoundedBoxGeometry, W, H, makeRenderer, studioEnv, mats, photoBackground, prog, inout3, inoutExpo, outExpo, mix } from '../lib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

// tile i: position, yaw; camera holds [start, end]
const TILES = [[[0, 2.1, 0], 0, 17.0, 19.15], [[5.2, 2.1, -7], -0.42, 19.55, 21.7], [[-0.6, 2.1, -14], 0.38, 22.35, 24.4]];
export const HOLD_DIST = 12.5;

export async function setup() {
  const renderer = makeRenderer({ alpha: false });
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  photoBackground(scene, 0x0b1036, 0x020309);
  scene.fog = new THREE.Fog(0x04061a, 14, 42);
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.05, 200);

  const mirror = new Reflector(new THREE.PlaneGeometry(80, 80), { textureWidth: 1082, textureHeight: 1920, color: 0x3a4466 });
  mirror.rotation.x = -Math.PI / 2; scene.add(mirror);
  const dim = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: 0x03040f, transparent: true, opacity: 0.7 }));
  dim.rotation.x = -Math.PI / 2; dim.position.y = 0.01; scene.add(dim);

  const key = new THREE.SpotLight(0xffffff, 300, 40, 0.6, 0.6); key.position.set(3, 12, 8); scene.add(key);
  const rim = new THREE.PointLight(0x8b5cf6, 60, 30); rim.position.set(-6, 3, -10); scene.add(rim);

  const tiles = TILES.map(([p, yaw], i) => {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new RoundedBoxGeometry(3.4, 4.2, 0.2, 8, 0.32), mats.glassPanel(0xc9d2ff, 0.22));
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x46e3f5, transparent: true, opacity: 0, toneMapped: false });
    const glow = new THREE.Group();  // thin light frame around the active tile
    [[0, 2.14, 3.3, 0.05], [0, -2.14, 3.3, 0.05], [1.74, 0, 0.05, 4.1], [-1.74, 0, 0.05, 4.1]].forEach(([x, y, w, h]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), glowMat); b.position.set(x, y, 0.12); glow.add(b); });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.22), new THREE.MeshBasicMaterial({ color: 0x46e3f5, toneMapped: false }));
    strip.position.y = -2.1;
    g.add(glow, slab, strip);
    g.position.set(...p); g.rotation.y = yaw;
    g.userData = { glowMat };
    scene.add(g); return g;
  });

  const props = [];
  const geoms = [new THREE.SphereGeometry(0.5, 64, 48), new RoundedBoxGeometry(0.8, 0.8, 0.8, 6, 0.08)];
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(geoms[i % 3 === 0 ? 1 : 0], i % 2 ? mats.chrome() : mats.satin(0x8b5cf6));
    const s = 0.3 + Math.random() * 0.9;
    m.scale.setScalar(s);
    m.position.set((Math.random() - 0.5) * 22, 0.6 + Math.random() * 6, 4 - Math.random() * 26);
    m.userData = { ph: Math.random() * 6, y: m.position.y };
    props.push(m); scene.add(m);
  }

  const view = i => {
    const g = tiles[i], n = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
    return { pos: g.position.clone().add(n.multiplyScalar(HOLD_DIST)).add(new THREE.Vector3(0, 0.35, 0)), look: g.position.clone() };
  };
  const V = [0, 1, 2].map(view);
  const start = { pos: new THREE.Vector3(9, 9, 16), look: new THREE.Vector3(0, 1, -4) };
  const end = { pos: V[2].look.clone().add(new THREE.Vector3(Math.sin(0.38), 0, Math.cos(0.38)).multiplyScalar(0.45)), look: V[2].look.clone() };
  const KEYS = [[16.30, start], [17.05, V[0]], [19.15, V[0]], [19.70, V[1]], [21.70, V[1]], [22.30, V[2]], [24.40, V[2]], [24.95, end]];

  return {
    renderer,
    update(t) {
      let a = KEYS[0][1], b = KEYS[0][1], k = 0;
      for (let i = 0; i < KEYS.length - 1; i++) if (t >= KEYS[i][0]) { a = KEYS[i][1]; b = KEYS[i + 1][1]; k = prog(t, KEYS[i][0], KEYS[i + 1][0] - KEYS[i][0]); }
      const e = KEYS[0][0] <= t && t < KEYS[1][0] ? outExpo(k) : inoutExpo(k);  // whip-in, then eased moves
      const drift = new THREE.Vector3(0.04 * Math.sin(t * 0.7), 0.03 * Math.sin(t * 0.9), 0);
      cam.position.lerpVectors(a.pos, b.pos, e).add(drift);
      cam.lookAt(new THREE.Vector3().lerpVectors(a.look, b.look, e));
      cam.rotation.z += 0.02 * Math.sin(t * 0.6);
      tiles.forEach((g, i) => {
        const [, , t0, t1] = TILES[i];
        g.userData.glowMat.opacity = inout3(prog(t, t0 - 0.1, 0.4)) * (1 - inout3(prog(t, t1, 0.4)));
        g.children[0].visible = g.userData.glowMat.opacity > 0.01;
      });
      props.forEach(m => { m.position.y = m.userData.y + 0.18 * Math.sin(t * 0.8 + m.userData.ph); m.rotation.set(t * 0.2 + m.userData.ph, t * 0.3, 0); });
      renderer.render(scene, cam);
    },
    camera: cam,
    tiles,
  };
}
