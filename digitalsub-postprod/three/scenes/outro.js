// 48.0–51.3 s · brand reveal: dark studio, mirror floor, chrome spheres; the official logo (unchanged image,
// unlit) emerges with a dolly-in and a light sweep. The URL is 2D type composited below the logo.
import { THREE, W, H, makeRenderer, studioEnv, mats, photoBackground, prog, outExpo, inout3, mix } from '../lib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const T0 = 48.05;
export async function setup() {
  const renderer = makeRenderer({ alpha: false });
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  photoBackground(scene, 0x0a0f33, 0x010207);
  scene.fog = new THREE.Fog(0x03051a, 12, 40);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 200);

  const mirror = new Reflector(new THREE.PlaneGeometry(60, 60), { textureWidth: 1082, textureHeight: 1920, color: 0x353d60 });
  mirror.rotation.x = -Math.PI / 2; mirror.position.y = -1.2; scene.add(mirror);
  const dim = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x02030c, transparent: true, opacity: 0.82 }));
  dim.rotation.x = -Math.PI / 2; dim.position.y = -1.19; scene.add(dim);

  const img = await new THREE.TextureLoader().loadAsync('logo.png');
  img.colorSpace = THREE.SRGBColorSpace; img.anisotropy = 8;
  const LW = 3.0, LH = LW * img.image.height / img.image.width;  // uniform scale only
  const logoMat = new THREE.MeshBasicMaterial({ map: img, transparent: true, toneMapped: false, opacity: 0 });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), logoMat);
  logo.position.set(0, 0.35, 0); scene.add(logo);

  const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.025), new THREE.MeshBasicMaterial({ color: 0x46e3f5, toneMapped: false, transparent: true }));
  line.position.set(0, -0.62, 0.01); scene.add(line);

  const spheres = [[-2.6, 2.9, -7, 0.45], [2.9, 3.4, -10, 0.65], [-2.1, -0.7, -4, 0.2], [2.3, -0.8, -4, 0.24], [0.3, 4.6, -13, 0.5], [-4.4, 0.6, -13, 0.6]]
    .map(([x, y, z, r], i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), i % 2 ? mats.chrome() : mats.satin(0x6d4bd8));
      m.position.set(x, y, z); m.userData = { y, ph: i }; scene.add(m); return m; });
  const sweep = new THREE.SpotLight(0xffffff, 0, 30, 0.35, 0.7); sweep.position.set(0, 6, 4); scene.add(sweep, sweep.target);

  return {
    renderer,
    update(t) {
      const u = t - T0;
      const d = outExpo(prog(u, 0.0, 2.2));
      cam.position.set(mix(1.6, 0, d), mix(1.4, 0.25, d), mix(17, 12.4, d));
      cam.lookAt(0, mix(0.9, 0.2, d), 0);
      const r = outExpo(prog(u, 0.35, 1.0));
      logoMat.opacity = r;
      logo.position.y = 0.35 + 0.12 * (1 - r);
      logo.rotation.y = 0;
      const l = outExpo(prog(u, 1.0, 0.7));
      line.scale.x = Math.max(0.001, 1.3 * l); line.material.opacity = l;
      const s = prog(u, 1.4, 1.1);
      sweep.target.position.set(mix(-6, 6, s), -1.2, 0); sweep.intensity = 500 * Math.sin(Math.PI * s);
      spheres.forEach(m => { m.position.y = m.userData.y + 0.15 * Math.sin(u * 1.2 + m.userData.ph); });
      renderer.render(scene, cam);
    },
  };
}
