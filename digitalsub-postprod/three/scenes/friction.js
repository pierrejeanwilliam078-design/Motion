// 12.5–13.4 s · « tu perds du temps » — a chrome loading ring spins (the words are 2D type).
import { THREE, overlayStage, mats, prog, outExpo, inout3 } from '../lib.js';

export async function setup() {
  const S = overlayStage();
  const ring = new THREE.Group();
  const track = new THREE.Mesh(new THREE.TorusGeometry(1, 0.11, 32, 128), mats.darkChrome());
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1, 0.13, 32, 128, Math.PI * 0.6),
    new THREE.MeshPhysicalMaterial({ color: 0x46e3f5, emissive: 0x46e3f5, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.2, clearcoat: 1 }));
  ring.add(track, arc); S.scene.add(ring);
  return {
    renderer: S.renderer,
    update(t) {
      const out = inout3(prog(t, 13.05, 0.3));
      const re = outExpo(prog(t, 12.6, 0.4));
      ring.position.copy(S.at(900, 1290, 2));
      ring.scale.setScalar((105 / S.U) * re * (1 - out));
      ring.visible = re * (1 - out) > 0.01;
      ring.rotation.set(0.35, -0.5 + 0.2 * Math.sin(t), 0);
      arc.rotation.z = -t * 7;
      S.renderer.render(S.scene, S.cam);
    },
  };
}
