// Modèles 3D procéduraux : appareils, objets de bureau, logo en relief.
import * as THREE from 'three';
import { canvas } from './ui.js';

export function rrShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Plaque arrondie (corps d'appareil) centrée, épaisseur d sur z. */
export function slab(w, h, d, r, bevel = 0.01) {
  const g = new THREE.ExtrudeGeometry(rrShape(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {
    depth: d - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 24,
  });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** Surface d'écran arrondie avec UV 0→1. */
export function screenGeo(w, h, r) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), 24);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

export function makeScreen(w, h, r, pxW, pxH) {
  const cv = canvas(pxW, pxH);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // texture mise à jour à chaque image : pas de mipmaps (génération très coûteuse en rendu logiciel)
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  const mesh = new THREE.Mesh(screenGeo(w, h, r), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  // vitre : seuls les reflets de l'environnement s'ajoutent à l'image
  const glass = new THREE.Mesh(
    screenGeo(w, h, r),
    new THREE.MeshPhysicalMaterial({
      color: 0x000000, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, envMapIntensity: 0.55,
    }),
  );
  glass.position.z = 0.0015;
  const g = new THREE.Group();
  g.add(mesh, glass);
  return { group: g, canvas: cv, ctx: cv.getContext('2d'), tex, mesh, glass };
}

export const MAT = {
  titanium: () => new THREE.MeshPhysicalMaterial({ color: 0x2b2f45, metalness: 1, roughness: 0.28, clearcoat: 0.4 }),
  alu: () => new THREE.MeshPhysicalMaterial({ color: 0x9aa0ad, metalness: 1, roughness: 0.32 }),
  spaceGray: () => new THREE.MeshPhysicalMaterial({ color: 0x3d404b, metalness: 1, roughness: 0.34 }),
  blackGlass: () => new THREE.MeshPhysicalMaterial({ color: 0x050608, metalness: 0.2, roughness: 0.08, clearcoat: 1 }),
  matteBlack: () => new THREE.MeshStandardMaterial({ color: 0x0c0d12, roughness: 0.6, metalness: 0.2 }),
};

/* ------------------------------------------------------------- smartphone */
export function phone({ w = 0.76, h = 1.62, d = 0.085, px = [900, 1950], frame = MAT.titanium() } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(slab(w, h, d, 0.115, 0.018), frame);
  body.castShadow = true;
  g.add(body);
  const front = new THREE.Mesh(screenGeo(w - 0.012, h - 0.012, 0.11), MAT.blackGlass());
  front.position.z = d / 2 + 0.0005;
  g.add(front);
  const scr = makeScreen(w - 0.05, h - 0.05, 0.092, px[0], px[1]);
  scr.group.position.z = d / 2 + 0.001;
  g.add(scr.group);
  // îlot caméra (dos)
  const camIsland = new THREE.Mesh(slab(0.3, 0.3, 0.02, 0.07, 0.006), MAT.blackGlass());
  camIsland.position.set(-w / 2 + 0.2, h / 2 - 0.2, -d / 2 - 0.006);
  g.add(camIsland);
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0c1a, metalness: 0.5, roughness: 0.05, clearcoat: 1 });
  for (const [x, y] of [[-0.065, 0.065], [0.065, 0.065], [-0.065, -0.065]]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 32), lensMat);
    l.rotation.x = Math.PI / 2;
    l.position.set(camIsland.position.x + x, camIsland.position.y + y, -d / 2 - 0.02);
    g.add(l);
  }
  // boutons latéraux
  const btnMat = frame;
  for (const [y, len] of [[0.35, 0.16], [0.13, 0.1]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, len, 0.03), btnMat);
    b.position.set(w / 2 + 0.004, y, 0);
    g.add(b);
  }
  // îlot dynamique
  const pill = new THREE.Mesh(screenGeo(0.2, 0.055, 0.0275), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  pill.position.set(0, h / 2 - 0.075, d / 2 + 0.0025);
  g.add(pill);
  return { group: g, screen: scr, body };
}

/* ---------------------------------------------------------------- tablette */
export function tablet({ w = 2.2, h = 1.6, d = 0.06, px = [1600, 1160] } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(slab(w, h, d, 0.12, 0.014), MAT.spaceGray());
  body.castShadow = true;
  g.add(body);
  const front = new THREE.Mesh(screenGeo(w - 0.01, h - 0.01, 0.115), MAT.blackGlass());
  front.position.z = d / 2 + 0.0005;
  g.add(front);
  const scr = makeScreen(w - 0.1, h - 0.1, 0.07, px[0], px[1]);
  scr.group.position.z = d / 2 + 0.001;
  g.add(scr.group);
  return { group: g, screen: scr };
}

/* ------------------------------------------------------------- téléviseur */
export function tv({ w = 3.2, h = 1.8, px = [1920, 1080] } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(slab(w, h, 0.05, 0.02, 0.008), MAT.matteBlack());
  body.castShadow = true;
  g.add(body);
  const scr = makeScreen(w - 0.03, h - 0.03, 0.01, px[0], px[1]);
  scr.group.position.z = 0.026;
  g.add(scr.group);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, h * 0.5, 0.08), MAT.matteBlack());
  back.position.z = -0.06;
  g.add(back);
  // pied central
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.04), MAT.alu());
  neck.position.set(0, -h / 2 - 0.15, -0.04);
  g.add(neck);
  const foot = new THREE.Mesh(slab(1.0, 0.36, 0.03, 0.08, 0.01), MAT.alu());
  foot.rotation.x = -Math.PI / 2;
  foot.position.set(0, -h / 2 - 0.33, 0);
  foot.castShadow = true;
  g.add(foot);
  return { group: g, screen: scr, footY: -h / 2 - 0.345 };
}

/* --------------------------------------------------------------- moniteur */
export function monitor({ w = 2.7, h = 1.62, px = [1920, 1152] } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(slab(w, h, 0.045, 0.03, 0.01), MAT.spaceGray());
  body.castShadow = true;
  g.add(body);
  const bez = new THREE.Mesh(screenGeo(w - 0.01, h - 0.01, 0.028), MAT.blackGlass());
  bez.position.z = 0.0231;
  g.add(bez);
  const scr = makeScreen(w - 0.07, h - 0.07, 0.008, px[0], px[1]);
  scr.group.position.z = 0.024;
  g.add(scr.group);
  const neck = new THREE.Mesh(slab(0.32, 0.9, 0.04, 0.04, 0.01), MAT.alu());
  neck.position.set(0, -h / 2 - 0.2, -0.12);
  neck.rotation.x = -0.12;
  neck.castShadow = true;
  g.add(neck);
  const foot = new THREE.Mesh(slab(0.9, 0.6, 0.025, 0.1, 0.008), MAT.alu());
  foot.rotation.x = -Math.PI / 2;
  foot.position.set(0, -h / 2 - 0.62, -0.1);
  foot.castShadow = true;
  g.add(foot);
  return { group: g, screen: scr, footY: -h / 2 - 0.632 };
}

/* --------------------------------------------------- ordinateur portable */
function keyboardTexture() {
  const cv = canvas(1024, 512);
  const c = cv.getContext('2d');
  c.fillStyle = '#16171d';
  c.fillRect(0, 0, 1024, 512);
  const rows = [14, 14, 13, 12, 11];
  rows.forEach((n, r) => {
    const kw = 1000 / 14.5;
    for (let i = 0; i < n; i++) {
      const x = 12 + i * kw + (14 - n) * kw * 0.5 * (r > 2 ? 1 : 0.3);
      c.fillStyle = '#0a0a0e';
      c.beginPath();
      c.roundRect(x, 14 + r * 82, kw - 8, 72, 8);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.05)';
      c.fillRect(x + 4, 16 + r * 82, kw - 16, 2);
    }
  });
  c.fillStyle = '#0a0a0e';
  c.beginPath();
  c.roundRect(300, 14 + 5 * 82 - 4, 400, 72, 8);
  c.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function laptop({ w = 3.0, depth = 2.05, open = 1.92, px = [1600, 1000] } = {}) {
  const g = new THREE.Group();
  const shell = MAT.spaceGray();
  const base = new THREE.Mesh(slab(w, depth, 0.07, 0.12, 0.02), shell);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.035;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, depth * 0.36), new THREE.MeshStandardMaterial({ map: keyboardTexture(), roughness: 0.7 }));
  kb.rotation.x = -Math.PI / 2;
  kb.position.set(0, 0.0712, -depth * 0.17);
  g.add(kb);
  const pad = new THREE.Mesh(screenGeo(w * 0.36, depth * 0.3, 0.05), new THREE.MeshPhysicalMaterial({ color: 0x41444f, metalness: 0.6, roughness: 0.22 }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.0712, depth * 0.27);
  g.add(pad);
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.07, -depth / 2 + 0.02);
  g.add(hinge);
  const lid = new THREE.Group();
  hinge.add(lid);
  const lidH = depth * 0.98;
  const lidBody = new THREE.Mesh(slab(w, lidH, 0.04, 0.12, 0.012), shell);
  lidBody.position.set(0, lidH / 2, -0.02);
  lidBody.castShadow = true;
  lid.add(lidBody);
  const bez = new THREE.Mesh(screenGeo(w - 0.02, lidH - 0.02, 0.11), MAT.blackGlass());
  bez.position.set(0, lidH / 2, 0.0002);
  lid.add(bez);
  const sw = w - 0.16, sh = sw * (px[1] / px[0]);
  const scr = makeScreen(sw, sh, 0.02, px[0], px[1]);
  scr.group.position.set(0, lidH / 2 + 0.02, 0.0012);
  lid.add(scr.group);
  hinge.rotation.x = -(open - Math.PI / 2);
  return { group: g, screen: scr, lid, hinge };
}

/* ------------------------------------------------------------ accessoires */
export function mug() {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const y = (i / 20) * 0.55;
    pts.push(new THREE.Vector2(0.2 + 0.015 * Math.sin((i / 20) * Math.PI), y));
  }
  pts.push(new THREE.Vector2(0.185, 0.55), new THREE.Vector2(0.185, 0.04), new THREE.Vector2(0, 0.04));
  pts.unshift(new THREE.Vector2(0, 0));
  const m = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f8, roughness: 0.25, clearcoat: 0.8 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), m);
  body.castShadow = true;
  g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 16, 40, Math.PI * 1.15), m);
  handle.position.set(0.21, 0.3, 0);
  handle.rotation.z = -Math.PI * 0.575;
  handle.castShadow = true;
  g.add(handle);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.185, 48), new THREE.MeshPhysicalMaterial({ color: 0x1a0d06, roughness: 0.15, clearcoat: 1 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.49;
  g.add(coffee);
  return g;
}

export function notebook() {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(slab(1.3, 1.8, 0.07, 0.04, 0.012), new THREE.MeshStandardMaterial({ color: 0x1b2150, roughness: 0.75 }));
  cover.rotation.x = -Math.PI / 2;
  cover.position.y = 0.035;
  cover.castShadow = true;
  cover.receiveShadow = true;
  g.add(cover);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.074, 1.8), new THREE.MeshStandardMaterial({ color: 0x37ddc3, roughness: 0.6 }));
  band.position.set(0.45, 0.035, 0);
  g.add(band);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 24), new THREE.MeshPhysicalMaterial({ color: 0xc9ccd6, metalness: 1, roughness: 0.2 }));
  pen.rotation.z = Math.PI / 2;
  pen.rotation.y = 0.5;
  pen.position.set(0.1, 0.1, 0.1);
  pen.castShadow = true;
  g.add(pen);
  return g;
}

/** Ombre de contact douce (texture radiale) posée au sol. */
export function contactShadow(w, h, opacity = 0.6) {
  const cv = canvas(256, 256);
  const c = cv.getContext('2d');
  const gr = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,1)');
  gr.addColorStop(0.5, 'rgba(0,0,0,0.5)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gr;
  c.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(cv);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* -------------------------------------------- logo ABONIVO en relief (3D) */
export function logoTile(tileTex, size = 1.6) {
  const g = new THREE.Group();
  const r = size * 0.196;
  const body = new THREE.Mesh(
    slab(size * 0.985, size * 0.985, size * 0.1, r, size * 0.025),
    new THREE.MeshPhysicalMaterial({ color: 0x1a1f8a, metalness: 0.3, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x2a20a0, emissiveIntensity: 0.35 }),
  );
  g.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size * (967 / 970)),
    new THREE.MeshBasicMaterial({ map: tileTex, transparent: true, toneMapped: false }),
  );
  face.position.z = size * 0.05 + 0.002;
  g.add(face);
  const gloss = new THREE.Mesh(
    screenGeo(size * 0.97, size * 0.97, r * 0.98),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, clearcoat: 1, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, envMapIntensity: 0.6 }),
  );
  gloss.position.z = size * 0.05 + 0.004;
  g.add(gloss);
  return { group: g, face, body, gloss };
}

/** Anneau orbital fin (dégradé violet → turquoise), additif. */
export function orbitRing(radius = 1.4, tube = 0.008, arc = Math.PI * 2) {
  const geo = new THREE.TorusGeometry(radius, tube, 12, 256, arc);
  const col = [];
  const a = new THREE.Color('#5643E9'), b = new THREE.Color('#37DDC3'), c = new THREE.Color('#3478F6');
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const ang = Math.atan2(p.getY(i), p.getX(i));
    const u = (Math.sin(ang) + 1) / 2;
    const k = u < 0.5 ? a.clone().lerp(c, u * 2) : c.clone().lerp(b, (u - 0.5) * 2);
    col.push(k.r, k.g, k.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
}

/** Carte d'interface flottante (verre) avec texture canvas. */
export function cardMesh(cv, width = 1.6) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const h = width * (cv.height / cv.width);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
  return m;
}
