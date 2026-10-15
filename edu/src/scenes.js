// Scènes de la vidéo éducative « 3 réflexes avant de souscrire ».
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { C, clamp, lerp, range, keys, easeInOut, easeOut, easeIn, backOut, expoOut, expoInOut, rng } from '../../spot/src/util.js';
import * as M from '../../spot/src/models.js';
import * as U from './ui_edu.js';
import { makeCard } from '../../spot/src/ui.js';

let ENV = null;
export function initEnv(renderer) {
  ENV = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ASPECT = 1080 / 1920;

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function backdrop(w = 540, h = 960) {
  const cv = U.canvas(w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { cv, ctx: cv.getContext('2d'), tex, w, h };
}
function blob(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(color, a));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function keyLight(color, intensity, pos, size = 5) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(...pos);
  l.castShadow = true;
  l.shadow.mapSize.set(2048, 2048);
  Object.assign(l.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 0.5, far: 40 });
  l.shadow.bias = -0.0004;
  l.shadow.normalBias = 0.02;
  l.shadow.radius = 8;
  return l;
}
function look(cam, p, t) {
  cam.position.set(...p);
  cam.lookAt(...t);
  cam.updateMatrixWorld();
}
function texPlane(cv, width, opts = {}) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.dynamic) {
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * (cv.height / cv.width)),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.renderOrder = opts.order || 0;
  return m;
}
function whiteDesk() {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshPhysicalMaterial({ color: 0xeceef5, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}
function paymentCard() {
  const g = new THREE.Group();
  const w = 0.866, h = 0.546;
  const body = new THREE.Mesh(M.slab(w, h, 0.012, 0.045, 0.004), new THREE.MeshPhysicalMaterial({ color: 0x1b1f63, roughness: 0.3, clearcoat: 1 }));
  body.castShadow = true;
  g.add(body);
  const face = texPlane(U.makePaymentCard(), w);
  face.material.depthWrite = true;
  face.position.z = 0.0065;
  g.add(face);
  return g;
}

/* ============================================ S1 — smartphone sur bureau blanc */
export function scene1() {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.8;
  s.background = new THREE.Color('#e6e9f3');
  s.fog = new THREE.Fog('#e6e9f3', 7, 16);
  const cam = new THREE.PerspectiveCamera(32, ASPECT, 0.05, 100);
  s.add(whiteDesk());
  const ph = M.phone({ px: [900, 1950] });
  ph.screen.glass.material.envMapIntensity = 0.15;
  ph.group.rotation.set(-Math.PI / 2, 0, 0);
  ph.group.position.set(0, 0.045, 0);
  s.add(ph.group);
  const card = paymentCard();
  card.rotation.set(-Math.PI / 2, 0, 0.42);
  card.position.set(0.5, 0.008, 0.62);
  s.add(card);
  const mug = M.mug();
  mug.children[0].material = mug.children[1].material = new THREE.MeshPhysicalMaterial({ color: 0x1b2150, roughness: 0.3, clearcoat: 0.8 });
  mug.position.set(-1.25, 0, -1.0);
  s.add(mug);
  const cs = M.contactShadow(1.4, 2.2, 0.35);
  cs.position.y = 0.002;
  s.add(cs);
  s.add(keyLight('#ffffff', 2.6, [-3, 7, 3]));
  const pv = new THREE.PointLight(C.violet, 6, 6, 2);
  pv.position.set(1.8, 1.2, -1);
  s.add(pv);
  return {
    scene: s,
    camera: cam,
    bloom: 0.06,
    dof: { focus: 4, aperture: 0.8, maxBlur: 12 },
    update(t) {
      U.drawPriceToInstalments(ph.screen.ctx, 900, 1950, t);
      ph.screen.tex.needsUpdate = true;
      ph.group.rotation.z = keys(t, [[0, 0.24], [2.2, 0.06, easeOut], [5, -0.02]]);
      ph.group.position.y = 0.045 + 0.03 * easeInOut(range(t, 0.6, 1.6));
      const p = keys(t, [
        [0, [0.55, 4.2, 2.9]],
        [2.6, [0.15, 3.35, 2.05], easeOut],
        [5.15, [-0.1, 3.05, 1.7], easeInOut],
      ]);
      look(cam, p, [0, 0, -0.32]);
      cam.rotateZ(keys(t, [[0, -0.05], [3, 0.0], [5, 0.02]]));
      cam.updateMatrixWorld();
      this.dof.focus = cam.position.distanceTo(V(0, 0.05, 0));
    },
  };
}

/* ============================================ S2 — moniteur, fonctionnalités */
export function scene2(assets) {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.35;
  const cam = new THREE.PerspectiveCamera(34, ASPECT, 0.05, 100);
  const bd = backdrop(1024, 1024);
  {
    const c = bd.ctx;
    const g = c.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, '#0e1340');
    g.addColorStop(1, '#070a20');
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 1024);
    blob(c, 220, 380, 420, C.violet, 0.5);
    blob(c, 850, 320, 360, C.turq, 0.25);
    const R = rng(4);
    for (let i = 0; i < 22; i++) blob(c, R() * 1024, 150 + R() * 500, 20 + R() * 40, [C.white, C.turq, C.blue][i % 3], 0.1 + R() * 0.2);
  }
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), new THREE.MeshBasicMaterial({ map: bd.tex, toneMapped: false }));
  wall.position.set(0, 5, -7);
  s.add(wall);
  const wood = assets.wood;
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(2, 2);
  wood.colorSpace = THREE.SRGBColorSpace;
  assets.woodRough.wrapS = assets.woodRough.wrapT = THREE.RepeatWrapping;
  assets.woodRough.repeat.set(2, 2);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshPhysicalMaterial({ map: wood, roughnessMap: assets.woodRough, roughness: 1, clearcoat: 0.35, clearcoatRoughness: 0.35 }));
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = true;
  s.add(desk);
  const mon = M.monitor({ w: 2.3, h: 1.38 });
  mon.group.position.set(0, -mon.footY, 0);
  mon.screen.mesh.material.color.setScalar(0.92);
  s.add(mon.group);
  const sh = M.contactShadow(2.6, 1.2, 0.7);
  sh.position.set(0, 0.003, 0);
  s.add(sh);
  s.add(keyLight('#dfe6ff', 1.6, [-4, 8, 6]));
  const rimV = new THREE.PointLight(C.violet, 26, 12, 2);
  rimV.position.set(-3.5, 2.5, -2.5);
  s.add(rimV);
  const rimT = new THREE.PointLight(C.turq, 16, 10, 2);
  rimT.position.set(3.5, 2, -2);
  s.add(rimT);
  const cy = -mon.footY;
  // les 3 fonctionnalités essentielles sortent de l'écran
  const ESS = [
    { icon: 'cloud', title: 'Stockage en ligne', sub: 'Essentiel pour vous', badge: 'Utile', c: [C.blue, C.turq] },
    { icon: 'doc', title: 'Partage de fichiers', sub: 'Essentiel pour vous', badge: 'Utile', c: [C.violet, C.blue] },
    { icon: 'phone', title: 'Accès sur mobile', sub: 'Essentiel pour vous', badge: 'Utile', c: [C.turq, C.blue] },
  ];
  return {
    scene: s,
    camera: cam,
    dof: { focus: 5, aperture: 0.7, maxBlur: 12 },
    cards: null,
    update(t) {
      if (!this.cards) {
        this.cards = ESS.map((e) => {
          const m = texPlane(makeCard(e), 1.05);
          s.add(m);
          return m;
        });
      }
      U.drawFeatures(mon.screen.ctx, 1920, 1152, t);
      mon.screen.tex.needsUpdate = true;
      const p = keys(t, [
        [4.85, [-1.7, cy + 0.6, 5.1]],
        [7.6, [-0.2, cy + 0.45, 4.6], easeInOut],
        [10.15, [1.0, cy + 0.5, 4.3], easeInOut],
      ]);
      look(cam, p, [lerp(-0.25, 0.25, range(t, 5, 10)), cy - 0.15, 0]);
      this.dof.focus = cam.position.distanceTo(V(0, cy, 0));
      this.cards.forEach((m, i) => {
        const k = range(t, 8.55 + i * 0.18, 9.15 + i * 0.18);
        const e = expoOut(k);
        m.visible = k > 0;
        // départ : la ligne correspondante sur l'écran ; arrivée : pile centrée dans la moitié basse du cadre
        const from = V([-0.5, -0.5, 0.5][i], cy + [0.2, -0.05, -0.3][i], 0.05);
        const dist = 2.6;
        const fwd = V(0, 0, -1).applyQuaternion(cam.quaternion);
        const up = V(0, 1, 0).applyQuaternion(cam.quaternion);
        const halfH = dist * Math.tan(THREE.MathUtils.degToRad(17));
        const to = cam.position.clone().addScaledVector(fwd, dist).addScaledVector(up, -halfH * (0.05 + i * 0.27));
        m.position.lerpVectors(from, to, e);
        m.quaternion.copy(cam.quaternion);
        m.rotateY([-0.08, 0.06, -0.04][i] * e);
        m.scale.setScalar(Math.max(0.01, 0.25 + 0.75 * e) * 0.5);
        m.material.opacity = clamp(k * 2.5);
      });
    },
  };
}

/* ============================================ S3 — Mensuel / Annuel + calendrier */
export function scene3() {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.85;
  s.background = new THREE.Color('#e8ebf5');
  s.fog = new THREE.Fog('#e8ebf5', 9, 20);
  const cam = new THREE.PerspectiveCamera(32, ASPECT, 0.05, 100);
  s.add(whiteDesk());
  const tab = M.tablet({ px: [1600, 1160] });
  tab.group.rotation.set(-Math.PI / 2, 0, 0.08);
  tab.group.position.set(0, 0.03, 0.2);
  tab.screen.glass.material.envMapIntensity = 0.12;
  s.add(tab.group);
  U.drawTabletCompare(tab.screen.ctx, 1600, 1160, 0);
  tab.screen.tex.needsUpdate = true;
  const cs = M.contactShadow(2.8, 2.0, 0.3);
  cs.position.set(0, 0.002, 0.2);
  s.add(cs);
  s.add(keyLight('#ffffff', 2.4, [-3, 7, 4]));
  const pt = new THREE.PointLight(C.turq, 8, 6, 2);
  pt.position.set(1.5, 1.5, 1.5);
  s.add(pt);
  const monthly = texPlane(U.makePlanCard('mensuel'), 0.78, { order: 1 });
  const annual = texPlane(U.makePlanCard('annuel'), 0.78, { order: 1 });
  s.add(monthly, annual);
  const calCv = U.canvas(760, 640);
  const cal = texPlane(calCv, 1.05, { dynamic: true, order: 2 });
  s.add(cal);
  // ombres des cartes sur le bureau
  const sh1 = M.contactShadow(0.9, 0.5, 0.3), sh2 = M.contactShadow(0.9, 0.5, 0.3);
  s.add(sh1, sh2);
  // balayage lumineux turquoise
  const swCv = U.canvas(256, 64);
  {
    const c = swCv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(55,221,195,0)');
    g.addColorStop(0.5, 'rgba(160,255,240,0.9)');
    g.addColorStop(1, 'rgba(55,221,195,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 64);
  }
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(swCv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sweep.renderOrder = 3;
  s.add(sweep);
  return {
    scene: s,
    camera: cam,
    bloom: 0.08,
    dof: { focus: 6, aperture: 0.6, maxBlur: 10 },
    update(t) {
      look(cam, keys(t, [[9.85, [-0.3, 2.45, 5.9]], [12.5, [0.0, 2.25, 5.4], easeOut], [15.15, [0.2, 2.2, 5.2], easeInOut]]), [0, 1.0, 0]);
      this.dof.focus = cam.position.distanceTo(V(0, 1.3, 0));
      const spread = easeInOut(range(t, 12.6, 13.2));
      const place = (m, sh, side, t0) => {
        const k = range(t, t0, t0 + 0.6);
        const e = expoOut(k);
        m.visible = k > 0;
        const x = side * lerp(0.44, 0.5, spread);
        m.position.set(x + side * (1 - e) * 1.6, 1.35 + Math.sin(t * 1.2 + side) * 0.025, lerp(0.15, -0.25, spread));
        m.rotation.set(-0.08, -side * lerp(0.14, 0.32, spread) + (1 - e) * side * 0.6, 0);
        // inclinaison vers la caméra au mot « prix »
        m.rotation.x += 0.08 * Math.sin(Math.PI * range(t, 11.7, 12.3));
        m.material.opacity = clamp(k * 2);
        sh.position.set(m.position.x, 0.004, m.position.z + 0.1);
        sh.material.opacity = 0.3 * clamp(k * 2);
      };
      place(monthly, sh1, -1, 10.45);
      place(annual, sh2, 1, 10.7);
      const ck = range(t, 12.8, 13.35);
      cal.visible = ck > 0;
      if (ck > 0) {
        U.drawEngagement(calCv.getContext('2d'), 760, 640, t, 12.8);
        cal.material.map.needsUpdate = true;
        const e = backOut(ck, 1.3);
        cal.position.set(0, lerp(0.45, 0.72, expoOut(ck)) + Math.sin(t * 1.4) * 0.02, 0.9);
        cal.rotation.set(lerp(-1.2, -0.12, expoOut(ck)), 0, 0);
        cal.scale.setScalar(Math.max(0.01, 0.6 + 0.4 * e));
        cal.material.opacity = clamp(ck * 3);
      }
      const sw = range(t, 10.55, 11.35);
      sweep.visible = sw > 0 && sw < 1;
      sweep.position.set(lerp(-1.8, 1.8, easeInOut(sw)), 1.35, 0.3);
      sweep.rotation.z = -0.35;
      sweep.material.opacity = Math.sin(Math.PI * sw) * 0.8;
    },
  };
}

/* ============================================ S4 — calendrier + notification */
export function scene4() {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.45;
  const bd = backdrop();
  s.background = bd.tex;
  const cam = new THREE.PerspectiveCamera(32, ASPECT, 0.05, 100);
  const ph = M.phone({ px: [900, 1950] });
  s.add(ph.group);
  const pageCv = U.canvas(640, 560);
  U.drawCalendarPage(pageCv.getContext('2d'), 640, 560, 0);
  const page = texPlane(pageCv, 0.78, { order: 2 });
  s.add(page);
  const notif = texPlane(U.makeNotification(), 1.38, { order: 3 });
  s.add(notif);
  const key = new THREE.DirectionalLight('#ffffff', 1.4);
  key.position.set(-3, 4, 5);
  s.add(key);
  const pv = new THREE.PointLight(C.violet, 22, 10, 2);
  pv.position.set(2.5, 1.5, 1.5);
  s.add(pv);
  const pt = new THREE.PointLight(C.turq, 18, 10, 2);
  pt.position.set(-2.5, -1, 1.5);
  s.add(pt);
  const ring = M.orbitRing(1.15, 0.006);
  s.add(ring);
  return {
    scene: s,
    camera: cam,
    dof: { focus: 6, aperture: 0.6, maxBlur: 12 },
    update(t) {
      const u = t - 15;
      const c = bd.ctx;
      const g = c.createLinearGradient(0, 0, 0, bd.h);
      g.addColorStop(0, '#10164a');
      g.addColorStop(1, '#070a22');
      c.fillStyle = g;
      c.fillRect(0, 0, bd.w, bd.h);
      blob(c, bd.w * 0.2, bd.h * (0.3 + 0.02 * Math.sin(u)), 330, C.violet, 0.45);
      blob(c, bd.w * 0.85, bd.h * 0.7, 300, C.turq, 0.22);
      const nf = Math.sin(Math.PI * range(t, 18.05, 19.2));
      blob(c, bd.w * 0.5, bd.h * 0.55, 260, C.blue, 0.2 + 0.25 * nf);
      bd.tex.needsUpdate = true;
      U.drawCalendarPhone(ph.screen.ctx, 900, 1950, t);
      ph.screen.tex.needsUpdate = true;
      look(cam, keys(t, [[14.85, [-1.2, 0.45, 6.6]], [17.5, [-0.3, 0.35, 6.1], easeOut], [21.15, [0.6, 0.3, 5.9], easeInOut]]), [0, 0.55, 0]);
      cam.rotateZ(keys(t, [[15, -0.03], [18, 0], [21, 0.02]]));
      cam.updateMatrixWorld();
      this.dof.focus = cam.position.distanceTo(V(0, 0, 0));
      ph.group.rotation.set(0.05, keys(t, [[15, 0.4], [17.5, 0.12, easeOut], [21, -0.1]]), 0);
      ph.group.position.y = -0.12 + Math.sin(u * 1.1) * 0.02;
      // page de calendrier qui flotte au-dessus du téléphone
      const pk = range(t, 15.5, 16.15);
      page.visible = pk > 0;
      page.position.set(0.1, 1.12 + Math.sin(u * 1.3) * 0.03, 0.25);
      page.rotation.set(lerp(-1.1, -0.06, expoOut(pk)), -0.18 + Math.sin(u * 0.8) * 0.04, 0.05);
      page.scale.setScalar(Math.max(0.01, backOut(pk, 1.2)));
      page.material.opacity = clamp(pk * 3);
      const nk = range(t, 18.1, 18.6);
      notif.visible = nk > 0;
      notif.position.set(0, lerp(0.5, 0.25, expoOut(nk)) + Math.sin(u * 1.2) * 0.015, lerp(0.1, 0.75, expoOut(nk)));
      notif.quaternion.copy(cam.quaternion);
      notif.scale.setScalar(Math.max(0.01, backOut(nk, 1.4)));
      notif.material.opacity = clamp(nk * 3);
      ring.position.set(0, -0.1, 0);
      ring.rotation.set(1.3, 0.25, u * 0.5);
      ring.scale.set(1, 1.0, 1);
      ring.material.opacity = 0.55 * easeOut(range(t, 15.3, 16.3));
    },
  };
}

/* ============================================ S5 — synthèse BESOIN · PRIX · DURÉE */
export const S5_ROWS = [640, 960, 1280];
export function scene5() {
  const s = new THREE.Scene();
  s.environment = ENV;
  s.environmentIntensity = 0.9;
  const bd = backdrop();
  s.background = bd.tex;
  const cam = new THREE.PerspectiveCamera(32, ASPECT, 0.05, 100);
  look(cam, [0, 0, 7], [0, 0, 0]);
  const tiles = ['besoin', 'prix', 'duree'].map((k) => {
    const m = texPlane(U.makeRecapTile(k), 0.6, { order: 1 });
    s.add(m);
    return m;
  });
  const ring = M.orbitRing(1.9, 0.008);
  s.add(ring);
  const ring2 = M.orbitRing(2.5, 0.005);
  s.add(ring2);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(V(0, 0, 1), 0);
  const toWorld = (px, py) => {
    ray.setFromCamera(new THREE.Vector2((px / 1080) * 2 - 1, -(py / 1920) * 2 + 1), cam);
    const v = V(0, 0, 0);
    ray.ray.intersectPlane(plane, v);
    return v;
  };
  const SLOTS = S5_ROWS.map((y) => toWorld(255, y));
  const FROM = [V(-2.6, 2.2, -1), V(2.8, 0.2, -1), V(-2.4, -2.4, -1)];
  return {
    scene: s,
    camera: cam,
    bloom: 0.05,
    update(t) {
      const u = t - 21;
      const c = bd.ctx;
      const g = c.createLinearGradient(0, 0, bd.w, bd.h);
      g.addColorStop(0, '#F7F9FF');
      g.addColorStop(0.6, '#EEF1FF');
      g.addColorStop(1, '#E3E8FF');
      c.fillStyle = g;
      c.fillRect(0, 0, bd.w, bd.h);
      blob(c, bd.w * 0.9, bd.h * (0.18 + 0.02 * Math.sin(u)), 340, C.violet, 0.2);
      blob(c, bd.w * 0.05, bd.h * 0.85, 360, C.turq, 0.22);
      blob(c, bd.w * 0.7, bd.h * 0.6, 260, C.blue, 0.1);
      bd.tex.needsUpdate = true;
      const T0 = [21.15, 21.95, 22.75];
      tiles.forEach((m, i) => {
        const k = range(t, T0[i], T0[i] + 0.6);
        const e = expoOut(k);
        m.visible = k > 0;
        m.position.lerpVectors(FROM[i], SLOTS[i], e);
        m.position.y += Math.sin(u * 1.4 + i) * 0.02;
        m.rotation.set(0, (1 - e) * 1.2 + Math.sin(u + i) * 0.06, (1 - e) * 0.3);
        m.scale.setScalar(Math.max(0.01, 0.5 + 0.5 * backOut(k, 1.2)));
        m.material.opacity = clamp(k * 2.5);
      });
      // transition orbitale vers la scène finale
      const rk = range(t, 23.6, 25.15);
      ring.visible = ring2.visible = rk > 0;
      ring.position.set(0, 0, 0.5);
      ring.rotation.set(1.25, 0.2, u * 1.2);
      ring.scale.setScalar(lerp(0.4, 1.6, easeInOut(rk)));
      ring.material.opacity = Math.sin(Math.PI * clamp(rk * 1.2)) * 0.9;
      ring2.position.set(0, 0, 0.3);
      ring2.rotation.set(1.35, -0.3, -u * 0.9);
      ring2.scale.setScalar(lerp(0.3, 1.3, easeInOut(rk)));
      ring2.material.opacity = Math.sin(Math.PI * clamp(rk * 1.2)) * 0.5;
      cam.position.z = 7 - 0.4 * easeIn(range(t, 24.2, 25.15));
      cam.updateMatrixWorld();
    },
  };
}

/* ============================================ S6 — fond bleu nuit + logo */
export function scene6() {
  const s = new THREE.Scene();
  const bd = backdrop();
  s.background = bd.tex;
  const cam = new THREE.PerspectiveCamera(34, ASPECT, 0.05, 100);
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
