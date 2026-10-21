// 25.2–28.9 s · « l'activation »: a glass-and-chrome switch flips ON, the track fills with cyan light (the word is 2D type).
import { THREE, RoundedBoxGeometry, overlayStage, mats, prog, outBack, inout3, mix } from '../lib.js';

export async function setup() {
  const S = overlayStage();
  const g = new THREE.Group();
  const w = 380 / S.U, h = 170 / S.U;
  const shell = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.5, 8, h / 2), new THREE.MeshPhysicalMaterial({
    color: 0x0e1640, metalness: 0.2, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.92, envMapIntensity: 1.3 }));
  const glowMat = new THREE.MeshPhysicalMaterial({ color: 0x46e3f5, emissive: 0x46e3f5, emissiveIntensity: 0, roughness: 0.3, transparent: true, opacity: 0 });
  const glow = new THREE.Mesh(new RoundedBoxGeometry(w - 0.18, h - 0.18, 0.52, 8, (h - 0.18) / 2), glowMat);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(h / 2 - 0.12, 64, 48), mats.chrome());
  g.add(shell, glow, knob);
  S.scene.add(g);
  return {
    renderer: S.renderer,
    update(t) {
      const out = inout3(prog(t, 28.45, 0.35));
      const pg = prog(t, 25.62, 0.6), eg = outBack(pg, 1.3);
      g.position.copy(S.at(541, 1420, 2 * out));
      g.rotation.set(mix(1.2, 0.32, eg), mix(-0.6, -0.12, eg) + 0.05 * Math.sin(t * 0.9), 0);
      g.scale.setScalar(Math.max(0.001, eg * (1 - out)));
      g.visible = pg > 0 && out < 1;
      const on = inout3(prog(t, 27.06, 0.35));
      knob.position.set(mix(-w / 2 + h / 2, w / 2 - h / 2, on), 0, 0.3);
      glowMat.opacity = 0.85 * on; glowMat.emissiveIntensity = 1.4 * on;
      S.renderer.render(S.scene, S.cam);
    },
  };
}
