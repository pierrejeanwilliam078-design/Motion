// Les six scènes du spot. Chaque scène expose update(t) pilotée par le temps global.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { C, clamp, lerp, range, keys, easeInOut, easeOut, easeIn, backOut, expoOut, expoInOut, rng } from './util.js';
import * as UI from './ui.js';
import * as M from './models.js';

let ENV = null;
export function initEnv(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
function look(cam, pos, target) {
  cam.position.set(...pos);
  cam.lookAt(...target);
}

/** Fond plein écran redessiné à la demande (dégradé + halos doux). */
function backdrop(w = 540, h = 960) {
  const cv = UI.canvas(w, h);
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { cv, ctx, tex, w, h };
}
function blob(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, UI_hex(color, a));
  g.addColorStop(1, UI_hex(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function UI_hex(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mixHex(a, b, k) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, k).getHexString();
}

function shadowLight(color, intensity, pos, target, size = 6) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(...pos);
  l.target.position.set(...target);
  l.castShadow = true;
  l.shadow.mapSize.set(2048, 2048);
  l.shadow.camera.left = -size;
  l.shadow.camera.right = size;
  l.shadow.camera.top = size;
  l.shadow.camera.bottom = -size;
  l.shadow.camera.near = 0.5;
  l.shadow.camera.far = 40;
  l.shadow.bias = -0.0004;
  l.shadow.normalBias = 0.02;
  l.shadow.radius = 6;
  return l;
}

/* =================================================================== S1 */
export function scene1(assets) {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.32;
  s.background = new THREE.Color('#05071a');
  const cam = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 100);

  // bureau en noyer
  const wood = assets.wood;
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(2, 2);
  wood.colorSpace = THREE.SRGBColorSpace;
  wood.anisotropy = 8;
  const wr = assets.woodRough;
  wr.wrapS = wr.wrapT = THREE.RepeatWrapping;
  wr.repeat.set(2, 2);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshPhysicalMaterial({ map: wood, roughnessMap: wr, roughness: 1, clearcoat: 0.35, clearcoatRoughness: 0.35 }));
  desk.rotation.x = -Math.PI / 2;
  desk.position.z = 0.8;
  desk.receiveShadow = true;
  s.add(desk);

  // mur arrière flou (bokeh)
  const bd = backdrop(1024, 1024);
  {
    const c = bd.ctx;
    const g = c.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, '#0d1238');
    g.addColorStop(1, '#070a20');
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 1024);
    blob(c, 200, 380, 420, C.violet, 0.55);
    blob(c, 860, 300, 380, C.turq, 0.3);
    blob(c, 620, 620, 300, C.blue, 0.3);
    const R = rng(3);
    for (let i = 0; i < 26; i++) blob(c, R() * 1024, 150 + R() * 520, 20 + R() * 46, [C.white, C.turq, C.blue, '#ffcf9a'][i % 4], 0.12 + R() * 0.25);
  }
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), new THREE.MeshBasicMaterial({ map: bd.tex, toneMapped: false }));
  wall.position.set(0, 5, -7);
  s.add(wall);

  const lap = M.laptop();
  s.add(lap.group);
  const ph = M.phone({ px: [720, 1560] });
  ph.group.rotation.set(-Math.PI / 2, 0, -0.3);
  ph.group.position.set(0.95, 0.045, 1.75);
  s.add(ph.group);
  const mg = M.mug();
  mg.position.set(-1.25, 0, 1.25);
  s.add(mg);
  const nb = M.notebook();
  nb.position.set(-0.9, 0, 2.75);
  nb.rotation.y = 0.5;
  s.add(nb);
  const cs = M.contactShadow(4.2, 3.0, 0.75);
  cs.position.set(0, 0.002, 0);
  s.add(cs);
  lap.screen.mesh.material.color.setScalar(0.82);
  ph.screen.mesh.material.color.setScalar(0.85);

  s.add(shadowLight('#dfe6ff', 2.2, [-4, 9, 6], [0, 0, 0], 6));
  const rimV = new THREE.PointLight(C.violet, 30, 14, 2);
  rimV.position.set(-4, 3, -3);
  s.add(rimV);
  const rimT = new THREE.PointLight(C.turq, 18, 12, 2);
  rimT.position.set(4.5, 2.5, -2.5);
  s.add(rimT);
  const glow = new THREE.PointLight('#6f7dff', 6, 5, 2);
  glow.position.set(0, 1.0, -0.3);
  s.add(glow);

  // cartes d'abonnements qui jaillissent de l'écran
  const R = rng(21);
  const cards = UI.CARD_SPECS.map((spec, i) => {
    const m = M.cardMesh(UI.makeCard(spec), 0.92);
    const side = i % 2 ? 1 : -1;
    const target = V(side * (0.35 + R() * 0.4), 0.95 + (i / 7) * 1.35 + R() * 0.12, 0.2 + R() * 1.3);
    s.add(m);
    return { m, target, rot: V((R() - 0.5) * 0.3, -side * (0.25 + R() * 0.25), (R() - 0.5) * 0.25), t0: 0.45 + i * 0.37, ph: R() * 6 };
  });
  const scrCenter = V(0, 1.03, -1.3);

  return {
    scene: s,
    camera: cam,
    dof: { focus: 4.6, aperture: 0.9, maxBlur: 14 },
    update(t) {
      UI.drawLaptopS1(lap.screen.ctx, 1600, 1000, t);
      lap.screen.tex.needsUpdate = true;
      UI.drawPhoneS1(ph.screen.ctx, 720, 1560, t);
      ph.screen.tex.needsUpdate = true;
      // caméra : plan large → rapprochement → plongée dans l'écran
      const p = keys(t, [
        [0, [1.0, 5.6, 8.4]],
        [3.3, [0.25, 3.3, 5.6], easeOut],
        [4.15, [0, 1.06, -0.55], expoInOut],
      ]);
      const tg = keys(t, [
        [0, [0, 1.0, 0.2]],
        [3.3, [0, 1.2, -0.5]],
        [4.15, [0, 1.03, -1.3], expoInOut],
      ]);
      look(cam, p, tg);
      cam.rotateZ(keys(t, [[0, 0.025], [3.3, -0.01]]));
      cam.updateMatrixWorld();
      this.dof.focus = cam.position.distanceTo(V(0, 1.6, 0.4));
      cards.forEach((c, i) => {
        const k = range(t, c.t0, c.t0 + 0.55);
        const e = expoOut(k);
        c.m.visible = k > 0;
        c.m.position.lerpVectors(scrCenter, c.target, e);
        c.m.position.y += Math.sin(t * 1.3 + c.ph) * 0.03;
        c.m.rotation.set(c.rot.x * e + Math.sin(t + c.ph) * 0.04, c.rot.y * e, c.rot.z * e);
        c.m.scale.setScalar(0.2 + 0.8 * backOut(k, 1.1));
        c.m.material.opacity = clamp(k * 3);
      });
    },
  };
}

/* =================================================================== S2 */
export function scene2(assets) {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.5;
  const bd = backdrop();
  s.background = bd.tex;
  const cam = new THREE.PerspectiveCamera(34, 1080 / 1920, 0.05, 100);

  const tile = M.logoTile(assets.tile, 1.55);
  s.add(tile.group);
  const ring = M.orbitRing(1.55, 0.012);
  s.add(ring);
  const ring2 = M.orbitRing(2.3, 0.006);
  s.add(ring2);
  const key = new THREE.DirectionalLight('#ffffff', 1.4);
  key.position.set(-3, 4, 5);
  s.add(key);
  const pv = new THREE.PointLight(C.violet, 30, 10, 2);
  pv.position.set(-2.5, 1.5, 2);
  s.add(pv);
  const pt = new THREE.PointLight(C.turq, 25, 10, 2);
  pt.position.set(2.5, -1.2, 2);
  s.add(pt);

  // halo central (sprite additif)
  const hc = UI.canvas(256, 256);
  {
    const c = hc.getContext('2d');
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(120,230,255,0.6)');
    g.addColorStop(1, 'rgba(86,67,233,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
  }
  const haloTex = new THREE.CanvasTexture(hc);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  s.add(halo);

  const R = rng(5);
  const cards = UI.CARD_SPECS.map((spec, i) => {
    const m = M.cardMesh(UI.makeCard(spec), 1.3);
    s.add(m);
    return { m, a0: (i / 8) * Math.PI * 2, r0: 1.7 + R() * 1.0, y0: (R() - 0.5) * 3.2, z0: -0.5 - R() * 1.5 };
  });

  return {
    scene: s,
    camera: cam,
    update(t) {
      const u = t - 4;
      // fond : bleu nuit + halos violet / turquoise
      const c = bd.ctx;
      const g = c.createLinearGradient(0, 0, 0, bd.h);
      g.addColorStop(0, '#0e1440');
      g.addColorStop(1, C.navy);
      c.fillStyle = g;
      c.fillRect(0, 0, bd.w, bd.h);
      const pulse = range(u, 1.3, 1.7) * (1 - range(u, 1.7, 3.0));
      blob(c, bd.w * (0.2 + 0.05 * Math.sin(u)), bd.h * 0.3, 380, C.violet, 0.5);
      blob(c, bd.w * 0.85, bd.h * (0.72 - 0.03 * u), 340, C.turq, 0.28);
      blob(c, bd.w * 0.5, bd.h * 0.46, 300 + 120 * pulse, C.blue, 0.25 + 0.35 * pulse);
      bd.tex.needsUpdate = true;

      look(cam, keys(u, [[-0.2, [0.3, 0.2, 8.8]], [1.6, [0.1, 0.1, 7.6], easeOut], [4.2, [-0.25, 0.05, 6.6], easeInOut]]), [0, -0.05, 0]);
      cam.rotateZ(keys(u, [[-0.2, -0.04], [2.0, 0], [4.2, 0.015]]));

      // cartes en spirale qui convergent vers le centre
      cards.forEach((cd, i) => {
        const k = easeIn(range(u, -0.15, 1.55));
        const ang = cd.a0 + u * 1.2 + k * 4.5;
        const r = cd.r0 * (1 - k);
        cd.m.visible = k < 1;
        cd.m.position.set(Math.cos(ang) * r, cd.y0 * (1 - k) + Math.sin(ang) * r * 0.35, cd.z0 * (1 - k) + Math.sin(ang) * 0.6);
        cd.m.lookAt(cam.position);
        cd.m.rotateZ(Math.sin(ang) * 0.2);
        cd.m.scale.setScalar(Math.max(0.001, 1 - k * 0.85));
        cd.m.material.opacity = 1 - range(u, 1.3, 1.55);
      });
      const fl = range(u, 1.35, 1.6) * (1 - range(u, 1.6, 2.4));
      halo.scale.setScalar(0.5 + 5 * fl + 3.2 * range(u, 1.5, 2.2));
      halo.material.opacity = 0.9 * fl + 0.28 * range(u, 1.6, 2.4);
      halo.position.set(0, 0, -0.4);

      // révélation du logo
      const lk = range(u, 1.45, 2.35);
      const e = backOut(lk, 1.0);
      tile.group.visible = lk > 0;
      tile.group.scale.setScalar(Math.max(0.001, 0.35 + 0.65 * e));
      tile.group.position.set(0, 0.35 + Math.sin(u * 1.4) * 0.03, lerp(-1.5, 0, expoOut(lk)));
      tile.group.rotation.set(-0.08 + Math.sin(u * 0.9) * 0.03, lerp(1.2, 0, expoOut(lk)) + Math.sin(u * 0.7) * 0.06, 0);
      ring.visible = ring2.visible = lk > 0;
      const rk = easeOut(range(u, 1.6, 2.8));
      ring.position.copy(tile.group.position);
      ring.rotation.set(1.18, -0.28, u * 0.5);
      ring.scale.setScalar(0.6 + 0.6 * rk);
      ring.material.opacity = rk * 0.9;
      ring2.position.copy(tile.group.position);
      ring2.rotation.set(1.3, 0.35, -u * 0.3);
      ring2.material.opacity = rk * 0.35;
    },
  };
}

/* =================================================================== S3 */
const CAT_CARDS = [
  { icon: 'play', title: 'Streaming', sub: 'Films, séries, musique', badge: 'Divertissement', c: [C.violet, C.blue] },
  { icon: 'sparkle', title: 'Intelligence artificielle', sub: 'Assistants et outils IA', badge: 'Productivité', c: [C.blue, C.turq] },
  { icon: 'pen', title: 'Création', sub: 'Design, photo, vidéo', badge: 'Créativité', c: [C.violet, '#8a3fe9'] },
  { icon: 'cap', title: 'Formation', sub: 'Cours et certifications', badge: 'Apprentissage', c: [C.turq, C.blue] },
];
export function scene3(assets) {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.45;
  s.background = new THREE.Color('#070a22');
  s.fog = new THREE.Fog('#070a22', 9, 22);
  const cam = new THREE.PerspectiveCamera(34, 1080 / 1920, 0.05, 100);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshPhysicalMaterial({ color: 0x0b0f2c, roughness: 0.32, metalness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  s.add(floor);
  s.add(new THREE.HemisphereLight('#3a46a8', '#05060f', 0.6));

  const X = [0, 7, 14, 21];
  const devs = [];
  const t1 = M.tv();
  t1.group.position.set(X[0], -t1.footY, 0);
  devs.push({ d: t1, draw: UI.drawTV, px: [1920, 1080], focusY: -t1.footY });
  const t2 = M.monitor();
  t2.group.position.set(X[1], -t2.footY, 0);
  devs.push({ d: t2, draw: UI.drawAI, px: [1920, 1152], focusY: -t2.footY });
  const t3 = M.tablet();
  t3.group.position.set(X[2], 1.25, 0);
  t3.group.rotation.x = -0.12;
  devs.push({ d: t3, draw: UI.drawDesign, px: [1600, 1160], focusY: 1.25 });
  const t4 = M.phone({ px: [900, 1950] });
  t4.group.position.set(X[3], 1.25, 0);
  devs.push({ d: t4, draw: UI.drawCourse, px: [900, 1950], focusY: 1.25 });
  devs.forEach((v, i) => {
    s.add(v.d.group);
    const sh = M.contactShadow(i < 2 ? 3.4 : 2.2, 1.4, 0.8);
    sh.position.set(X[i], 0.003, 0.1);
    s.add(sh);
    const sp = new THREE.SpotLight('#ffffff', 60, 16, 0.5, 0.7, 1.6);
    sp.position.set(X[i] - 1.5, 6.5, 4);
    sp.target = v.d.group;
    sp.castShadow = true;
    sp.shadow.mapSize.set(1024, 1024);
    sp.shadow.radius = 5;
    s.add(sp);
    const rim = new THREE.PointLight(i % 2 ? C.turq : C.violet, 22, 8, 2);
    rim.position.set(X[i] + 2.2, 2.4, -2);
    s.add(rim);
    v.card = M.cardMesh(UI.makeCard(CAT_CARDS[i]), 1.25);
    s.add(v.card);
  });
  // supports pour la tablette et le téléphone (socles discrets)
  for (const i of [2, 3]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.06, 48), M.MAT.alu());
    st.position.set(X[i], 0.03, 0);
    st.castShadow = st.receiveShadow = true;
    s.add(st);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, i === 2 ? 0.5 : 0.45, 16), M.MAT.alu());
    rod.position.set(X[i], 0.25, -0.08);
    s.add(rod);
  }

  // fenêtres temporelles (temps global) : arrivée sur chaque appareil
  const W = [8.0, 9.05, 10.5, 11.7];
  const framing = [
    { d: 8.9, ty: 1.2 },
    { d: 7.6, ty: 1.4 },
    { d: 6.8, ty: 1.2 },
    { d: 5.7, ty: 1.2 },
  ];
  return {
    scene: s,
    camera: cam,
    dof: { focus: 6, aperture: 0.45, maxBlur: 10 },
    blurDir: new THREE.Vector2(),
    update(t) {
      // index courant + interpolation lors des panoramiques filés (0.32 s)
      let i = 0;
      for (let k = 0; k < 4; k++) if (t >= W[k] - 0.16) i = k;
      const prev = Math.max(0, i - 1);
      const wk = i > 0 ? expoInOut(range(t, W[i] - 0.16, W[i] + 0.16)) : 1;
      const local = t - W[i];
      const fA = framing[prev], fB = framing[i];
      const xA = X[prev] + 0.5, xB = X[i];
      const orbit = (i % 2 ? -1 : 1) * (0.42 - Math.min(local, 2) * 0.1);
      const fx = lerp(xA, xB, wk);
      const fd = lerp(fA.d, fB.d, wk) - Math.min(local, 1.6) * 0.3;
      const fty = lerp(fA.ty, fB.ty, wk);
      cam.position.set(fx + Math.sin(orbit) * fd, fty + 0.45, Math.cos(orbit) * fd);
      cam.lookAt(fx, fty, 0);
      // poussée finale dans l'écran du téléphone (raccord avec la scène 4)
      if (t > 13.55) {
        const k = expoInOut(range(t, 13.55, 14.15));
        cam.position.lerp(V(X[3], 1.25, 1.1), k);
        cam.lookAt(X[3], 1.25, 0);
      }
      cam.updateMatrixWorld();
      const sp = i > 0 ? Math.sin(Math.PI * range(t, W[i] - 0.16, W[i] + 0.16)) : 0;
      this.blurDir.set(-sp * 42, 0);
      this.dof.focus = cam.position.distanceTo(V(xB, fty, 0));
      devs.forEach((v, k) => {
        const vis = Math.abs(k - i) <= 1;
        v.d.group.visible = vis;
        v.card.visible = false;
        if (!vis) return;
        if (k === i || k === prev) {
          v.draw(v.d.screen.ctx, v.px[0], v.px[1], t - W[k] + 0.1);
          v.d.screen.tex.needsUpdate = true;
        }
        // carte catégorie qui sort de l'écran, posée face caméra sous l'appareil
        const ck = range(t, W[k] + 0.12, W[k] + 0.62);
        if (ck > 0 && (k === i || (k === prev && wk < 1))) {
          const e = expoOut(ck);
          v.card.visible = true;
          const tgt = V(X[k], framing[k].ty, 0);
          const dir = cam.position.clone().sub(tgt).normalize();
          const dist = cam.position.distanceTo(tgt) - 1.9 * e;
          const pxu = 1920 / (2 * dist * Math.tan(THREE.MathUtils.degToRad(17)));
          const up = V(0, 1, 0).applyQuaternion(cam.quaternion);
          const right = V(1, 0, 0).applyQuaternion(cam.quaternion);
          const side = k % 2 ? 1 : -1;
          v.card.position.copy(tgt).addScaledVector(dir, 1.9 * e).addScaledVector(up, -(520 / pxu) * e).addScaledVector(right, side * (40 / pxu));
          v.card.quaternion.copy(cam.quaternion);
          v.card.rotateY(side * 0.14 * e);
          v.card.rotateZ(side * 0.02);
          v.card.scale.setScalar(Math.max(0.01, (0.3 + 0.7 * e) * (620 / (1.25 * pxu))));
          v.card.material.opacity = clamp(ck * 2.5) * (k === 3 ? 1 - range(t, 13.3, 13.6) : 1);
        }
      });
      // la tablette pivote doucement, le téléphone tourne vers la caméra
      t3.group.rotation.y = 0.25 - (t - 10.5) * 0.12;
      t4.group.rotation.y = keys(t, [[11.6, 0.55], [12.6, 0.12, easeOut], [13.6, 0.0]]);
    },
  };
}

/* ============================================================= S4 + S5 */
export function scenePhone(assets) {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.7;
  const bd = backdrop();
  s.background = bd.tex;
  const cam = new THREE.PerspectiveCamera(30, 1080 / 1920, 0.05, 100);
  const ph = M.phone({ px: [900, 1950], frame: new THREE.MeshPhysicalMaterial({ color: 0x3a3f66, metalness: 1, roughness: 0.22, clearcoat: 0.5 }) });
  ph.screen.glass.material.envMapIntensity = 0.12;
  s.add(ph.group);
  const key = new THREE.DirectionalLight('#ffffff', 2.0);
  key.position.set(-3, 5, 6);
  s.add(key);
  const fillV = new THREE.PointLight(C.violet, 20, 12, 2);
  fillV.position.set(3, 1, 2);
  s.add(fillV);
  const fillT = new THREE.PointLight(C.turq, 16, 12, 2);
  fillT.position.set(-3, -1.5, 2);
  s.add(fillT);

  // bulles de verre en arrière-plan (comme la charte)
  const R = rng(9);
  const bubbles = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.16 + R() * 0.2, 48, 32),
      new THREE.MeshPhysicalMaterial({ color: [C.turq, C.blue, '#8fdcff', C.violet][i % 4], roughness: 0.08, clearcoat: 1, iridescence: 0.6, metalness: 0.05, transparent: true }),
    );
    const side = i % 2 ? 1 : -1;
    m.position.set(side * (1.3 + R() * 1.6), -2.4 + R() * 4.8, -3.5 - R() * 3.5);
    s.add(m);
    bubbles.push({ m, ph: R() * 6, base: m.position.clone() });
  }
  const ring = M.orbitRing(1.35, 0.011);
  s.add(ring);
  const ring2 = M.orbitRing(1.75, 0.005);
  s.add(ring2);
  const splash = UI.canvas(900, 1950);
  const sctx = splash.getContext('2d');

  return {
    scene: s,
    camera: cam,
    dof: { focus: 5, aperture: 1.3, maxBlur: 16 },
    bloom: 0.05,
    update(t) {
      const u = t - 14;
      const dark = easeInOut(range(t, 22.4, 23.7));
      this.bloom = lerp(0.05, 0.26, dark);
      // fond : clair (lavande) → bleu nuit
      const c = bd.ctx;
      const g = c.createLinearGradient(0, 0, bd.w, bd.h);
      g.addColorStop(0, mixHex('#F7F9FF', '#121848', dark));
      g.addColorStop(0.55, mixHex('#E6EBFF', C.navy, dark));
      g.addColorStop(1, mixHex('#D9E1FF', '#080b24', dark));
      c.fillStyle = g;
      c.fillRect(0, 0, bd.w, bd.h);
      blob(c, bd.w * 0.15, bd.h * (0.25 + 0.02 * Math.sin(u * 0.6)), 330, C.blue, lerp(0.22, 0.35, dark));
      blob(c, bd.w * 0.9, bd.h * 0.62, 360, lerp(0, 1, dark) > 0.5 ? C.violet : '#9f8cff', lerp(0.25, 0.45, dark));
      blob(c, bd.w * 0.55, bd.h * 0.95, 300, C.turq, lerp(0.18, 0.22, dark));
      bd.tex.needsUpdate = true;
      s.environmentIntensity = lerp(0.7, 0.5, dark);
      key.intensity = lerp(2.2, 1.0, dark);

      // écran : boutique (S4) puis écran ABONIVO (S5)
      const ctx = ph.screen.ctx;
      UI.drawShop(ctx, 900, 1950, u);
      const sk = easeInOut(range(t, 19.75, 20.25));
      if (sk > 0) {
        UI.drawSplash(sctx, 900, 1950, u, 1 - range(t, 24.2, 24.7));
        ctx.save();
        ctx.globalAlpha = sk;
        ctx.drawImage(splash, 0, (1 - sk) * 260);
        ctx.restore();
      }
      ph.screen.tex.needsUpdate = true;

      // caméra : travelling autour du téléphone (S4), recul (S5), plongée vers le logo (fin S5)
      const p = keys(t, [
        [13.85, [0.0, 0.1, 2.4]],
        [14.7, [-1.25, 0.5, 4.7], expoOut],
        [17.0, [0.75, 0.35, 4.8], easeInOut],
        [19.6, [1.1, 0.1, 4.75], easeInOut],
        [20.9, [0.0, 0.2, 7.0], expoInOut],
        [24.0, [-0.45, 0.15, 7.2], easeInOut],
        [25.15, [0.0, 0.1, 1.7], expoInOut],
      ]);
      const tg = keys(t, [
        [13.85, [0, 0.0, 0]],
        [14.7, [0, 0.17, 0], expoOut],
        [19.6, [0, 0.17, 0]],
        [20.9, [0, 0.08, 0], expoInOut],
        [24.0, [0, 0.08, 0]],
        [25.15, [0, 0.15, 0], expoInOut],
      ]);
      look(cam, p, tg);
      cam.rotateZ(keys(t, [[14, 0.03], [17, -0.02], [20, 0.0], [24, 0.02], [25, 0]]));
      cam.updateMatrixWorld();
      this.dof.focus = cam.position.distanceTo(ph.group.position);
      ph.group.rotation.set(keys(t, [[14, 0.12], [20, 0.04], [25, 0.0]]), keys(t, [[14, -0.3], [17, 0.18], [20, -0.12], [22.5, 0.12], [25, 0.0]]), keys(t, [[14, 0.03], [20, -0.02], [25, 0]]));
      ph.group.position.y = Math.sin(u * 1.1) * 0.02;

      bubbles.forEach((b) => {
        b.m.position.set(b.base.x, b.base.y + Math.sin(u * 0.6 + b.ph) * 0.15, b.base.z);
        b.m.material.opacity = 1 - dark * 0.7;
      });
      // anneaux orbitaux autour du téléphone (S5)
      const rk = easeOut(range(t, 20.2, 21.2));
      ring.visible = ring2.visible = rk > 0;
      ring.rotation.set(1.25, 0.3, u * 0.6);
      ring.scale.set(1 + 0.15 * rk, 1 + 0.15 * rk, 1);
      ring.material.opacity = rk * lerp(0.75, 1, dark);
      ring2.rotation.set(1.4, -0.4, -u * 0.35);
      ring2.material.opacity = rk * 0.45;
    },
  };
}

/* =================================================================== S6 */
export function scene6(assets) {
  const s = new THREE.Scene();
  const bd = backdrop();
  s.background = bd.tex;
  const cam = new THREE.PerspectiveCamera(34, 1080 / 1920, 0.05, 100);
  cam.position.set(0, 0, 8);
  const rings = [M.orbitRing(2.6, 0.006), M.orbitRing(3.3, 0.004), M.orbitRing(4.1, 0.003)];
  rings.forEach((r) => s.add(r));
  return {
    scene: s,
    camera: cam,
    update(t) {
      const u = t - 25;
      const c = bd.ctx;
      const g = c.createLinearGradient(0, 0, 0, bd.h);
      g.addColorStop(0, '#0f1546');
      g.addColorStop(0.5, C.navy);
      g.addColorStop(1, '#070a20');
      c.fillStyle = g;
      c.fillRect(0, 0, bd.w, bd.h);
      blob(c, bd.w * 0.5, bd.h * 0.33, 300, C.violet, 0.42);
      blob(c, bd.w * (0.15 + 0.03 * Math.sin(u * 0.5)), bd.h * 0.75, 300, C.blue, 0.25);
      blob(c, bd.w * 0.9, bd.h * 0.2, 260, C.turq, 0.16);
      bd.tex.needsUpdate = true;
      cam.position.set(0, 0.6, lerp(8.6, 8.0, easeOut(range(u, -0.2, 5))));
      cam.lookAt(0, 0.6, 0);
      const k = easeOut(range(u, -0.15, 1.2));
      rings.forEach((r, i) => {
        r.position.set(0, 1.75, -1);
        r.rotation.set(1.22 + i * 0.06, (i - 1) * 0.25, u * (0.25 - i * 0.08));
        r.material.opacity = k * [0.32, 0.2, 0.12][i];
      });
    },
  };
}
