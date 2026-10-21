// 44.5–48.15 s · a dark glass plate tilts into place and settles flat; the URL is drawn on it in 2D once it rests.
import { THREE, RoundedBoxGeometry, overlayStage, mats, fade, prog, outExpo, outBack, inout3, mix } from '../lib.js';

export async function setup() {
  const S = overlayStage();
  const w = 900 / S.U, h = 210 / S.U;
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.4, 8, 0.7), new THREE.MeshPhysicalMaterial({
    color: 0x0b1030, metalness: 0.3, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.9, envMapIntensity: 1.4 }));
  const rim = new THREE.Mesh(new RoundedBoxGeometry(w + 0.08, h + 0.08, 0.3, 8, 0.74), mats.chrome());
  rim.position.z = -0.08;
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.05), new THREE.MeshBasicMaterial({ color: 0x46e3f5, toneMapped: false }));
  bar.position.set(0, -h / 2 + 0.28, 0.21);
  g.add(rim, plate, bar); S.scene.add(g);
  return {
    renderer: S.renderer,
    update(t) {
      const p = prog(t, 45.55, 0.7), e = outBack(p, 1.1);
      const out = inout3(prog(t, 47.9, 0.25));
      g.position.copy(S.at(541, 1380, mix(-8, 0, outExpo(p))));
      g.rotation.set(mix(1.1, 0, e), mix(0.7, 0, e), 0);  // rests perfectly flat for the 2D URL
      fade(g, Math.min(1, p * 3) * (1 - out));
      const b = outExpo(prog(t, 46.52, 0.6));
      bar.scale.x = Math.max(0.001, (w * 0.5) * b);
      S.renderer.render(S.scene, S.cam);
    },
  };
}
