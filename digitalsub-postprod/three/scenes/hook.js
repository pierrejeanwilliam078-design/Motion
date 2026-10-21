// 0.0–2.7 s · chrome spheres drifting in parallax along the frame edges (the headline itself is 2D type).
import { THREE, overlayStage, mats, prog, outExpo, inout3 } from '../lib.js';

export async function setup() {
  const S = overlayStage();
  const chrome = mats.chrome();
  const spheres = [[95, 1250, 150, 2], [990, 1170, 190, -1], [150, 1650, 96, 3], [965, 1600, 120, 1], [80, 330, 80, -2], [1015, 520, 70, -3]]
    .map(([x, y, d, z]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), chrome);
      m.userData = { p: S.at(x, y, z), r: d / S.U / 2 }; S.scene.add(m); return m; });
  return {
    renderer: S.renderer,
    update(t) {
      const out = inout3(prog(t, 2.35, 0.3));
      spheres.forEach((m, i) => {
        const a = outExpo(prog(t, 0.05 + i * 0.07, 0.8));
        m.position.copy(m.userData.p).add(new THREE.Vector3(0.15 * Math.sin(t * 0.8 + i), 0.25 * Math.sin(t * 0.6 + i * 2) + (1 - a) * -2 + out * 3, 0));
        m.scale.setScalar(m.userData.r * a * (1 - out));
        m.visible = a * (1 - out) > 0.01;
      });
      S.renderer.render(S.scene, S.cam);
    },
  };
}
