// Interfaces 2D dessinées sur canvas puis plaquées sur les écrans 3D.
// Aucune marque tierce : uniquement des interfaces génériques par catégorie.
import { C, clamp, lerp, range, easeOut, easeInOut, backOut, expoOut, rr, hexA, font, rng } from './util.js';

export const IMG = {}; // tile, symbol, wmWhite, wmNavy

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  // canvas rastérisé par le CPU : bien plus rapide que l'accélération GPU logicielle (SwiftShader)
  c.getContext('2d', { willReadFrequently: true });
  return c;
}

/* ------------------------------------------------------------------ icônes */
export function icon(ctx, name, cx, cy, s, color = C.white, lw = 0.11) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (name) {
    case 'play':
      ctx.moveTo(-0.28, -0.4); ctx.lineTo(0.42, 0); ctx.lineTo(-0.28, 0.4); ctx.closePath(); ctx.fill();
      break;
    case 'note':
      ctx.moveTo(-0.15, 0.3); ctx.lineTo(-0.15, -0.38); ctx.lineTo(0.4, -0.48); ctx.lineTo(0.4, 0.2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-0.28, 0.32, 0.16, 0.12, -0.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.27, 0.22, 0.16, 0.12, -0.3, 0, 7); ctx.fill();
      break;
    case 'sparkle': {
      const st = (x, y, r) => {
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.quadraticCurveTo(x, y, x, y + r);
        ctx.quadraticCurveTo(x, y, x - r, y);
        ctx.quadraticCurveTo(x, y, x, y - r);
      };
      st(-0.08, 0.06, 0.42); st(0.32, -0.32, 0.17); ctx.fill();
      break;
    }
    case 'pen':
      ctx.moveTo(-0.38, 0.38); ctx.lineTo(-0.3, 0.1); ctx.lineTo(0.18, -0.38); ctx.lineTo(0.38, -0.18);
      ctx.lineTo(-0.1, 0.3); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0.06, -0.26); ctx.lineTo(0.26, -0.06); ctx.stroke();
      break;
    case 'cloud':
      ctx.moveTo(-0.3, 0.25);
      ctx.arc(-0.22, 0.05, 0.2, Math.PI * 0.6, Math.PI * 1.5);
      ctx.arc(0.05, -0.08, 0.27, Math.PI * 1.1, Math.PI * 1.95);
      ctx.arc(0.27, 0.08, 0.17, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath(); ctx.stroke();
      break;
    case 'cap':
      ctx.moveTo(-0.48, -0.08); ctx.lineTo(0, -0.3); ctx.lineTo(0.48, -0.08); ctx.lineTo(0, 0.14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-0.26, 0.04); ctx.lineTo(-0.26, 0.26); ctx.quadraticCurveTo(0, 0.42, 0.26, 0.26); ctx.lineTo(0.26, 0.04); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0.4, -0.04); ctx.lineTo(0.4, 0.26); ctx.stroke();
      break;
    case 'grid':
      for (const [x, y] of [[-0.24, -0.24], [0.06, -0.24], [-0.24, 0.06], [0.06, 0.06]]) { rr(ctx, x - 0.04, y - 0.04, 0.26, 0.26, 0.06); ctx.fill(); }
      break;
    case 'shield':
      ctx.moveTo(0, -0.42); ctx.lineTo(0.34, -0.28); ctx.quadraticCurveTo(0.34, 0.24, 0, 0.42); ctx.quadraticCurveTo(-0.34, 0.24, -0.34, -0.28); ctx.closePath(); ctx.stroke();
      break;
    case 'search':
      ctx.arc(-0.06, -0.06, 0.26, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0.14, 0.14); ctx.lineTo(0.38, 0.38); ctx.stroke();
      break;
    case 'bell':
      ctx.moveTo(-0.3, 0.2); ctx.quadraticCurveTo(-0.22, 0.1, -0.24, -0.08); ctx.arc(0, -0.08, 0.24, Math.PI, 0); ctx.quadraticCurveTo(0.22, 0.1, 0.3, 0.2); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0.3, 0.07, 0, 7); ctx.fill();
      break;
    case 'check':
      ctx.moveTo(-0.3, 0.02); ctx.lineTo(-0.08, 0.24); ctx.lineTo(0.32, -0.2); ctx.stroke();
      break;
    case 'lock':
      rr(ctx, -0.3, -0.04, 0.6, 0.44, 0.08); ctx.fill(); ctx.beginPath(); ctx.arc(0, -0.1, 0.19, Math.PI, 0); ctx.stroke();
      break;
    case 'home':
      ctx.moveTo(-0.36, 0); ctx.lineTo(0, -0.34); ctx.lineTo(0.36, 0); ctx.moveTo(-0.26, -0.08); ctx.lineTo(-0.26, 0.34); ctx.lineTo(0.26, 0.34); ctx.lineTo(0.26, -0.08); ctx.stroke();
      break;
    case 'user':
      ctx.arc(0, -0.16, 0.17, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0.42, 0.34, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      break;
    case 'heart':
      ctx.moveTo(0, 0.32); ctx.bezierCurveTo(-0.5, 0, -0.32, -0.42, 0, -0.16); ctx.bezierCurveTo(0.32, -0.42, 0.5, 0, 0, 0.32); ctx.stroke();
      break;
    case 'chevron':
      ctx.moveTo(-0.12, -0.26); ctx.lineTo(0.14, 0); ctx.lineTo(-0.12, 0.26); ctx.stroke();
      break;
    case 'back':
      ctx.moveTo(0.12, -0.26); ctx.lineTo(-0.14, 0); ctx.lineTo(0.12, 0.26); ctx.stroke();
      break;
    case 'phone':
      ctx.moveTo(-0.3, -0.36); ctx.quadraticCurveTo(-0.38, 0.1, 0.06, 0.34); ctx.lineTo(0.3, 0.28); ctx.lineTo(0.22, 0.08); ctx.lineTo(0.04, 0.12);
      ctx.quadraticCurveTo(-0.12, 0, -0.14, -0.16); ctx.lineTo(-0.02, -0.24); ctx.lineTo(-0.12, -0.42); ctx.closePath(); ctx.fill();
      break;
    case 'doc':
      rr(ctx, -0.28, -0.38, 0.56, 0.76, 0.08); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-0.14, -0.14); ctx.lineTo(0.14, -0.14); ctx.moveTo(-0.14, 0.02); ctx.lineTo(0.14, 0.02); ctx.moveTo(-0.14, 0.18); ctx.lineTo(0.04, 0.18); ctx.stroke();
      break;
  }
  ctx.restore();
}

// ombre portée économique (le flou de canvas est très coûteux en rendu logiciel)
function softShadow(ctx, x, y, w, h, r, a = 0.35, spread = 26, dy = 14) {
  for (let i = 4; i >= 1; i--) {
    const e = (spread * i) / 4;
    rr(ctx, x - e, y - e + dy, w + e * 2, h + e * 2, r + e);
    ctx.fillStyle = `rgba(0,0,0,${a / 5})`;
    ctx.fill();
  }
}

function glassPanel(ctx, x, y, w, h, r, a = 1) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  g.addColorStop(0, `rgba(30,38,96,${0.96 * a})`);
  g.addColorStop(1, `rgba(11,16,48,${0.96 * a})`);
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  const b = ctx.createLinearGradient(x, y, x + w, y + h);
  b.addColorStop(0, `rgba(255,255,255,${0.35 * a})`);
  b.addColorStop(0.5, `rgba(255,255,255,${0.06 * a})`);
  b.addColorStop(1, `rgba(55,221,195,${0.3 * a})`);
  ctx.strokeStyle = b;
  ctx.stroke();
}

function iconTile(ctx, x, y, s, ico, c1, c2) {
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  rr(ctx, x, y, s, s, s * 0.28);
  ctx.fillStyle = g;
  ctx.fill();
  icon(ctx, ico, x + s / 2, y + s / 2, s * 0.62, C.white, 0.12);
}

/* ------------------------------------------------- cartes flottantes (S1/S2) */
export const CARD_SPECS = [
  { icon: 'play', title: 'Streaming vidéo', sub: 'Compte n°3 · mot de passe ?', badge: 'Renouvellement J-2', c: [C.violet, C.blue] },
  { icon: 'note', title: 'Musique', sub: 'Paiement en attente', badge: 'Action requise', c: [C.turq, C.blue] },
  { icon: 'sparkle', title: 'Assistant IA', sub: 'Quel forfait choisir ?', badge: 'Comparer', c: [C.blue, C.violet] },
  { icon: 'pen', title: 'Création graphique', sub: 'Licence à renouveler', badge: 'Expire bientôt', c: [C.violet, '#8a3fe9'] },
  { icon: 'cloud', title: 'Stockage cloud', sub: 'Espace presque plein', badge: '98 % utilisé', c: [C.blue, C.turq] },
  { icon: 'cap', title: 'Formation en ligne', sub: 'Accès à activer', badge: 'Code requis', c: [C.turq, C.violet] },
  { icon: 'grid', title: 'Logiciels bureautiques', sub: 'Quelle offre ?', badge: '3 options', c: [C.blue, C.violet] },
  { icon: 'shield', title: 'Sécurité', sub: 'Abonnement en double ?', badge: 'À vérifier', c: [C.violet, C.blue] },
];

export function makeCard(spec) {
  const W = 760, H = 300;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  glassPanel(ctx, 6, 6, W - 12, H - 12, 56);
  iconTile(ctx, 44, 52, 150, spec.icon, spec.c[0], spec.c[1]);
  ctx.fillStyle = C.white;
  ctx.font = font(700, 48);
  ctx.fillText(spec.title, 230, 112);
  ctx.fillStyle = 'rgba(247,249,255,0.62)';
  ctx.font = font(500, 34);
  ctx.fillText(spec.sub, 230, 166);
  ctx.font = font(700, 28);
  const tw = ctx.measureText(spec.badge).width;
  rr(ctx, 230, 196, tw + 56, 54, 27);
  ctx.fillStyle = hexA(spec.c[0], 0.22);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(256, 223, 8, 0, 7);
  ctx.fillStyle = spec.c[0] === C.turq ? C.turq : '#9d8cff';
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.fillText(spec.badge, 276, 233);
  return c;
}

/* ------------------------------------------- écran ordinateur portable (S1) */
const WIN_TITLES = ['Connexion', 'Mon compte', 'Abonnements', 'Facturation', 'Mot de passe oublié', 'Choisir une offre'];
export function drawLaptopS1(ctx, W, H, t) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#141b4d');
  bg.addColorStop(0.6, '#0B1030');
  bg.addColorStop(1, '#1d1550');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // halo doux du fond d'écran
  const rg = ctx.createRadialGradient(W * 0.75, H * 0.3, 10, W * 0.75, H * 0.3, W * 0.6);
  rg.addColorStop(0, 'rgba(86,67,233,0.45)');
  rg.addColorStop(1, 'rgba(86,67,233,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  // barre de menu
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 0, W, 34);
  const R = rng(11);
  const n = WIN_TITLES.length;
  for (let i = 0; i < n; i++) {
    const t0 = 0.15 + i * 0.42;
    const k = backOut(range(t, t0, t0 + 0.35), 1.2);
    if (k <= 0) continue;
    const ww = W * (0.42 + R() * 0.12), wh = H * (0.42 + R() * 0.14);
    const x = W * 0.04 + R() * (W - ww - W * 0.08), y = 60 + R() * (H - wh - 90);
    ctx.save();
    ctx.globalAlpha = clamp(k * 1.4);
    ctx.translate(x + ww / 2, y + wh / 2);
    ctx.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k);
    ctx.translate(-ww / 2, -wh / 2);
    softShadow(ctx, 0, 0, ww, wh, 18, 0.4);
    rr(ctx, 0, 0, ww, wh, 18);
    ctx.fillStyle = '#DDE2F2';
    ctx.fill();
    ctx.fillStyle = '#e4e8f6';
    rr(ctx, 0, 0, ww, 54, 18);
    ctx.fill();
    ctx.fillRect(0, 30, ww, 24);
    for (let d = 0; d < 3; d++) {
      ctx.beginPath();
      ctx.arc(26 + d * 26, 27, 8, 0, 7);
      ctx.fillStyle = ['#b9bfd6', '#c9cee2', '#d6daea'][d];
      ctx.fill();
    }
    // onglets
    for (let tb = 0; tb < 4; tb++) {
      rr(ctx, 110 + tb * 120, 12, 110, 34, 10);
      ctx.fillStyle = tb === 0 ? '#ffffff' : '#d3d8ea';
      ctx.fill();
    }
    ctx.fillStyle = C.navy;
    ctx.font = font(700, 30);
    ctx.fillText(WIN_TITLES[i], 34, 110);
    // champs de formulaire
    for (let f = 0; f < 2; f++) {
      rr(ctx, 34, 140 + f * 70, ww - 68, 50, 12);
      ctx.strokeStyle = '#c9cfe6';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#9aa2c0';
      ctx.font = font(500, 22);
      ctx.fillText(f === 0 ? 'Adresse e-mail' : '••••••••••', 52, 172 + f * 70);
    }
    rr(ctx, 34, 290, 200, 52, 26);
    ctx.fillStyle = i % 2 ? C.violet : C.blue;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = font(700, 22);
    ctx.fillText('Continuer', 76, 324);
    ctx.restore();
  }
  // fin de scène : l'écran bascule vers l'univers ABONIVO (bleu nuit) avant la plongée
  const nk = range(t, 3.05, 3.55);
  if (nk > 0) {
    ctx.fillStyle = `rgba(11,16,48,${nk})`;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.55);
    g.addColorStop(0, `rgba(86,67,233,${0.75 * nk})`);
    g.addColorStop(0.5, `rgba(52,120,246,${0.25 * nk})`);
    g.addColorStop(1, 'rgba(52,120,246,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ------------------------------------------ téléphone posé sur le bureau (S1) */
const NOTIFS = [
  ['bell', 'Votre abonnement expire demain'],
  ['lock', 'Nouveau code de connexion'],
  ['cloud', 'Stockage presque plein'],
  ['play', 'Paiement à mettre à jour'],
];
export function drawPhoneS1(ctx, W, H, t) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1b1f5c');
  bg.addColorStop(1, '#090c26');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.font = font(600, 150);
  ctx.fillText('21:47', W / 2, 330);
  ctx.font = font(500, 40);
  ctx.fillStyle = 'rgba(247,249,255,0.7)';
  ctx.fillText('mardi 14 octobre', W / 2, 400);
  ctx.textAlign = 'left';
  NOTIFS.forEach(([ic, txt], i) => {
    const k = easeOut(range(t, 0.5 + i * 0.55, 0.85 + i * 0.55));
    if (k <= 0) return;
    const y = 520 + i * 190 + (1 - k) * 60;
    ctx.globalAlpha = k;
    rr(ctx, 40, y, W - 80, 160, 40);
    ctx.fillStyle = 'rgba(247,249,255,0.16)';
    ctx.fill();
    iconTile(ctx, 72, y + 32, 96, ic, C.violet, C.blue);
    ctx.fillStyle = C.white;
    ctx.font = font(700, 36);
    ctx.fillText('Rappel', 196, y + 70);
    ctx.font = font(500, 32);
    ctx.fillStyle = 'rgba(247,249,255,0.8)';
    ctx.fillText(txt, 196, y + 118);
    ctx.globalAlpha = 1;
  });
}

/* --------------------------------------------------- TV : streaming (S3) */
export function drawTV(ctx, W, H, t) {
  ctx.fillStyle = '#05081c';
  ctx.fillRect(0, 0, W, H);
  // visuel « affiche » abstrait
  const z = 1 + t * 0.04;
  ctx.save();
  ctx.translate(W * 0.62, H * 0.32);
  ctx.scale(z, z);
  const g1 = ctx.createRadialGradient(-80, -40, 20, 0, 0, 700);
  g1.addColorStop(0, '#8f7dff');
  g1.addColorStop(0.35, C.violet);
  g1.addColorStop(0.7, '#1a1f6b');
  g1.addColorStop(1, '#05081c');
  ctx.fillStyle = g1;
  ctx.fillRect(-1000, -600, 2000, 1200);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const rg = ctx.createRadialGradient(150 + i * 140, 40 - i * 60, 0, 150 + i * 140, 40 - i * 60, 220);
    rg.addColorStop(0, hexA([C.turq, C.blue, '#ff9fd2'][i], 0.55));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(-1000, -600, 2000, 1200);
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
  const shade = ctx.createLinearGradient(0, 0, W * 0.7, 0);
  shade.addColorStop(0, 'rgba(5,8,28,0.95)');
  shade.addColorStop(1, 'rgba(5,8,28,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H * 0.66);
  const sh2 = ctx.createLinearGradient(0, H * 0.4, 0, H * 0.66);
  sh2.addColorStop(0, 'rgba(5,8,28,0)');
  sh2.addColorStop(1, 'rgba(5,8,28,1)');
  ctx.fillStyle = sh2;
  ctx.fillRect(0, H * 0.4, W, H * 0.27);
  ctx.fillStyle = C.turq;
  ctx.font = font(700, 30);
  ctx.fillText('À LA UNE', 110, 210);
  ctx.fillStyle = C.white;
  ctx.font = font(800, 104);
  ctx.fillText('Soirée cinéma', 104, 330);
  ctx.font = font(500, 36);
  ctx.fillStyle = 'rgba(247,249,255,0.75)';
  ctx.fillText('Films, séries et documentaires', 110, 400);
  rr(ctx, 110, 450, 270, 84, 42);
  ctx.fillStyle = C.white;
  ctx.fill();
  icon(ctx, 'play', 165, 492, 40, C.navy);
  ctx.fillStyle = C.navy;
  ctx.font = font(700, 34);
  ctx.fillText('Lecture', 205, 505);
  ctx.fillStyle = C.white;
  ctx.font = font(700, 36);
  ctx.fillText('Nouveautés', 110, 700);
  const focus = Math.floor(clamp(t * 2.2, 0, 5));
  for (let i = 0; i < 6; i++) {
    const x = 110 + i * 300, y = 735;
    const f = i === focus ? 1 : 0;
    const g = ctx.createLinearGradient(x, y, x + 270, y + 300);
    const pal = [[C.violet, '#1a1f6b'], [C.blue, '#0d1a4a'], [C.turq, '#13306b'], ['#8a3fe9', '#1d1550'], [C.blue, C.violet], ['#2a3a8a', C.turq]][i];
    g.addColorStop(0, pal[0]);
    g.addColorStop(1, pal[1]);
    rr(ctx, x - f * 8, y - f * 8, 270 + f * 16, 300 + f * 16, 22);
    ctx.fillStyle = g;
    ctx.fill();
    if (f) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = C.white;
      ctx.stroke();
    }
  }
}

/* ---------------------------------------------------- moniteur : IA (S3) */
const AI_LINES = [0.92, 0.84, 0.88, 0.6, 0.9, 0.76, 0.82, 0.5];
export function drawAI(ctx, W, H, t) {
  ctx.fillStyle = '#0d1236';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0a0e2b';
  ctx.fillRect(0, 0, 380, H);
  iconTile(ctx, 40, 40, 80, 'sparkle', C.blue, C.violet);
  ctx.fillStyle = C.white;
  ctx.font = font(700, 34);
  ctx.fillText('Assistant', 140, 92);
  for (let i = 0; i < 6; i++) {
    rr(ctx, 40, 170 + i * 76, 300, 54, 14);
    ctx.fillStyle = i === 0 ? 'rgba(86,67,233,0.35)' : 'rgba(255,255,255,0.05)';
    ctx.fill();
    rr(ctx, 64, 190 + i * 76, 120 + ((i * 53) % 130), 14, 7);
    ctx.fillStyle = 'rgba(247,249,255,0.35)';
    ctx.fill();
  }
  // bulle utilisateur
  const k = easeOut(range(t, 0.05, 0.4));
  ctx.globalAlpha = k;
  ctx.font = font(600, 36);
  const q = 'Aide-moi à préparer ma présentation';
  const qw = ctx.measureText(q).width;
  rr(ctx, W - 120 - qw - 60, 110 + (1 - k) * 30, qw + 60, 90, 36);
  ctx.fillStyle = C.violet;
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.fillText(q, W - 120 - qw - 30, 168 + (1 - k) * 30);
  ctx.globalAlpha = 1;
  // réponse
  const k2 = range(t, 0.35, 0.5);
  if (k2 > 0) {
    iconTile(ctx, 450, 260, 70, 'sparkle', C.turq, C.blue);
    const prog = clamp((t - 0.45) * 7, 0, AI_LINES.length);
    for (let i = 0; i < AI_LINES.length; i++) {
      const p = clamp(prog - i);
      if (p <= 0) break;
      const w = (W - 700) * AI_LINES[i] * p;
      rr(ctx, 560, 280 + i * 62, w, 26, 13);
      const g = ctx.createLinearGradient(560, 0, 560 + w, 0);
      g.addColorStop(0, 'rgba(247,249,255,0.85)');
      g.addColorStop(1, p < 1 ? 'rgba(55,221,195,0.9)' : 'rgba(247,249,255,0.85)');
      ctx.fillStyle = g;
      ctx.fill();
    }
  }
  rr(ctx, 450, H - 150, W - 560, 90, 45);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(247,249,255,0.45)';
  ctx.font = font(500, 30);
  ctx.fillText('Posez votre question…', 500, H - 94);
}

/* ------------------------------------------------ tablette : création (S3) */
export function drawDesign(ctx, W, H, t) {
  ctx.fillStyle = '#e9ecf8';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0d1236';
  ctx.fillRect(0, 0, W, 90);
  ctx.fillStyle = C.white;
  ctx.font = font(700, 34);
  ctx.fillText('Studio création', 40, 58);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 90, 110, H);
  ['pen', 'grid', 'doc', 'sparkle', 'cloud'].forEach((ic, i) => {
    if (i === 0) {
      rr(ctx, 18, 120, 74, 74, 18);
      ctx.fillStyle = hexA(C.violet, 0.15);
      ctx.fill();
    }
    icon(ctx, ic, 55, 157 + i * 100, 48, i === 0 ? C.violet : '#59618a');
  });
  // plan de travail
  const ax = 170, ay = 140, aw = W - 520, ah = H - 200;
  softShadow(ctx, ax, ay, aw, ah, 4, 0.12, 20, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ax, ay, aw, ah);
  const p1 = backOut(range(t, 0.05, 0.4));
  const g = ctx.createLinearGradient(ax, ay, ax + aw, ay + ah);
  g.addColorStop(0, C.violet);
  g.addColorStop(1, C.blue);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(ax + aw * 0.38, ay + ah * 0.45, ah * 0.28 * p1, 0, 7);
  ctx.fill();
  const p2 = backOut(range(t, 0.3, 0.65));
  ctx.fillStyle = C.turq;
  rr(ctx, ax + aw * 0.5, ay + ah * 0.4, aw * 0.36 * p2, ah * 0.36 * p2, 30);
  ctx.fill();
  const p3 = easeInOut(range(t, 0.55, 1.0));
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 60 * p3; i++) {
    const u = i / 60;
    const x = ax + aw * (0.12 + u * 0.76), y = ay + ah * (0.82 - 0.12 * Math.sin(u * Math.PI * 2));
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  // sélection
  if (p2 > 0.5) {
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(ax + aw * 0.5 - 10, ay + ah * 0.4 - 10, aw * 0.36 * p2 + 20, ah * 0.36 * p2 + 20);
    ctx.setLineDash([]);
  }
  // panneau latéral
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(W - 320, 90, 320, H);
  ctx.fillStyle = C.navy;
  ctx.font = font(700, 28);
  ctx.fillText('Couleurs', W - 290, 150);
  [C.navy, C.violet, C.blue, C.turq, '#ffffff', '#8a3fe9'].forEach((c, i) => {
    rr(ctx, W - 290 + (i % 3) * 90, 180 + Math.floor(i / 3) * 90, 70, 70, 18);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.strokeStyle = '#d5dbef';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ctx.fillText('Calques', W - 290, 420);
  for (let i = 0; i < 4; i++) {
    rr(ctx, W - 290, 450 + i * 70, 260, 54, 12);
    ctx.fillStyle = i === 1 ? hexA(C.violet, 0.14) : '#f0f2fa';
    ctx.fill();
  }
}

/* ---------------------------------------------- smartphone : formation (S3) */
export function drawCourse(ctx, W, H, t) {
  ctx.fillStyle = '#0B1030';
  ctx.fillRect(0, 0, W, H);
  statusBar(ctx, W, C.white);
  ctx.fillStyle = C.white;
  ctx.font = font(800, 58);
  ctx.fillText('Mes cours', 60, 220);
  // vidéo de la leçon
  const g = ctx.createLinearGradient(60, 270, W - 60, 760);
  g.addColorStop(0, C.blue);
  g.addColorStop(1, C.violet);
  rr(ctx, 60, 270, W - 120, 480, 44);
  ctx.fillStyle = g;
  ctx.fill();
  const rg = ctx.createRadialGradient(W * 0.7, 380, 0, W * 0.7, 380, 400);
  rg.addColorStop(0, 'rgba(55,221,195,0.6)');
  rg.addColorStop(1, 'rgba(55,221,195,0)');
  ctx.fillStyle = rg;
  rr(ctx, 60, 270, W - 120, 480, 44);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W / 2, 510, 80, 0, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  icon(ctx, 'play', W / 2 + 6, 510, 80, C.violet);
  ctx.fillStyle = C.turq;
  ctx.font = font(700, 32);
  ctx.fillText('MODULE 3 · LEÇON 2', 60, 840);
  ctx.fillStyle = C.white;
  ctx.font = font(700, 46);
  ctx.fillText('Bien démarrer', 60, 905);
  const prog = 0.35 + 0.4 * easeInOut(range(t, 0.1, 1.6));
  rr(ctx, 60, 950, W - 120, 18, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  rr(ctx, 60, 950, (W - 120) * prog, 18, 9);
  const pg = ctx.createLinearGradient(60, 0, W - 60, 0);
  pg.addColorStop(0, C.turq);
  pg.addColorStop(1, C.blue);
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.fillStyle = 'rgba(247,249,255,0.7)';
  ctx.font = font(600, 30);
  ctx.fillText(`${Math.round(prog * 100)} % terminé`, 60, 1020);
  ['Introduction', 'Les bases', 'Exercices pratiques', 'Quiz final'].forEach((s, i) => {
    const y = 1080 + i * 150;
    rr(ctx, 60, y, W - 120, 124, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(130, y + 62, 34, 0, 7);
    ctx.fillStyle = i < 2 ? C.turq : 'rgba(255,255,255,0.12)';
    ctx.fill();
    if (i < 2) icon(ctx, 'check', 130, y + 62, 48, C.navy, 0.16);
    ctx.fillStyle = C.white;
    ctx.font = font(600, 36);
    ctx.fillText(s, 190, y + 74);
  });
}

export function statusBar(ctx, W, color) {
  ctx.fillStyle = color;
  ctx.font = font(700, 36);
  ctx.fillText('9:41', 80, 84);
  // indicateurs réseau / batterie
  for (let i = 0; i < 4; i++) {
    rr(ctx, W - 250 + i * 18, 76 - i * 7, 12, 12 + i * 7, 3);
    ctx.fill();
  }
  rr(ctx, W - 150, 56, 62, 30, 9);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
  rr(ctx, W - 145, 61, 44, 20, 5);
  ctx.fill();
}

/* ----------------------------------------- boutique ABONIVO (maquette, S4) */
const CATS = ['Tout', 'Streaming', 'IA', 'Création', 'Logiciels', 'Formation'];
const OFFERS = [
  { icon: 'play', cat: 'Streaming', title: 'Pack Streaming', sub: 'Films, séries, musique', c: [C.violet, C.blue] },
  { icon: 'sparkle', cat: 'IA', title: 'Assistant IA Pro', sub: 'Rédaction, recherche, idées', c: [C.blue, C.turq] },
  { icon: 'pen', cat: 'Création', title: 'Suite Création', sub: 'Design, photo, vidéo', c: [C.violet, '#8a3fe9'] },
  { icon: 'grid', cat: 'Logiciels', title: 'Bureautique', sub: 'Documents et cloud', c: [C.blue, C.violet] },
  { icon: 'cap', cat: 'Formation', title: 'Cours en ligne', sub: 'Certifications, langues', c: [C.turq, C.blue] },
  { icon: 'note', cat: 'Streaming', title: 'Musique Premium', sub: 'Sans publicité', c: [C.turq, C.violet] },
];

let shopPage = null;
function buildShopPage(W) {
  const H = 3000;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F7F9FF';
  ctx.fillRect(0, 0, W, H);
  // bannière
  const g = ctx.createLinearGradient(50, 0, W - 50, 0);
  g.addColorStop(0, C.navy);
  g.addColorStop(0.55, '#2a2a8f');
  g.addColorStop(1, C.violet);
  rr(ctx, 50, 0, W - 100, 400, 48);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  rr(ctx, 50, 0, W - 100, 400, 48);
  ctx.clip();
  const rg = ctx.createRadialGradient(W - 160, 120, 0, W - 160, 120, 380);
  rg.addColorStop(0, 'rgba(55,221,195,0.55)');
  rg.addColorStop(1, 'rgba(55,221,195,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, 400);
  if (IMG.tile) ctx.drawImage(IMG.tile, W - 330, 90, 240, 240);
  ctx.restore();
  ctx.fillStyle = C.turq;
  ctx.font = font(700, 30);
  ctx.fillText('NOUVEAU', 100, 100);
  ctx.fillStyle = C.white;
  ctx.font = font(800, 56);
  ctx.fillText('Tous vos', 100, 180);
  ctx.fillText('abonnements', 100, 245);
  ctx.font = font(500, 32);
  ctx.fillStyle = 'rgba(247,249,255,0.8)';
  ctx.fillText('au même endroit', 100, 300);
  rr(ctx, 100, 325, 230, 56, 28);
  ctx.fillStyle = C.turq;
  ctx.fill();
  ctx.fillStyle = C.navy;
  ctx.font = font(700, 26);
  ctx.fillText('Découvrir', 152, 362);
  // offres
  ctx.fillStyle = C.navy;
  ctx.font = font(800, 46);
  ctx.fillText('Offres populaires', 50, 520);
  OFFERS.forEach((o, i) => {
    const y = 570 + i * 330;
    ctx.shadowColor = 'rgba(30,40,110,0.12)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    rr(ctx, 50, y, W - 100, 290, 44);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    iconTile(ctx, 90, y + 40, 150, o.icon, o.c[0], o.c[1]);
    ctx.fillStyle = C.violet;
    ctx.font = font(700, 26);
    ctx.fillText(o.cat.toUpperCase(), 280, y + 72);
    ctx.fillStyle = C.navy;
    ctx.font = font(800, 44);
    ctx.fillText(o.title, 280, y + 128);
    ctx.fillStyle = '#6b7396';
    ctx.font = font(500, 32);
    ctx.fillText(o.sub, 280, y + 176);
    rr(ctx, 280, y + 205, 230, 58, 29);
    ctx.fillStyle = hexA(C.blue, 0.12);
    ctx.fill();
    ctx.fillStyle = C.blue;
    ctx.font = font(700, 26);
    ctx.fillText("Voir l'offre", 318, y + 243);
    icon(ctx, 'chevron', W - 110, y + 145, 50, '#a3abc9', 0.14);
  });
  return c;
}

let productPage = null;
function buildProductPage(W, H) {
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F7F9FF';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, 760);
  g.addColorStop(0, C.blue);
  g.addColorStop(1, C.violet);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 760);
  const rg = ctx.createRadialGradient(W * 0.7, 300, 0, W * 0.7, 300, 520);
  rg.addColorStop(0, 'rgba(55,221,195,0.55)');
  rg.addColorStop(1, 'rgba(55,221,195,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, 760);
  statusBar(ctx, W, C.white);
  ctx.beginPath();
  ctx.arc(110, 190, 46, 0, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
  icon(ctx, 'back', 108, 190, 50, C.white, 0.14);
  iconTile(ctx, W / 2 - 130, 260, 260, 'sparkle', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0.08)');
  rr(ctx, 0, 700, W, H - 700, 60);
  ctx.fillStyle = '#F7F9FF';
  ctx.fill();
  ctx.fillStyle = C.violet;
  ctx.font = font(700, 28);
  ctx.fillText('INTELLIGENCE ARTIFICIELLE', 60, 800);
  ctx.fillStyle = C.navy;
  ctx.font = font(800, 62);
  ctx.fillText('Assistant IA Pro', 60, 880);
  ctx.fillStyle = '#6b7396';
  ctx.font = font(500, 34);
  ctx.fillText('Rédaction, recherche et idées,', 60, 945);
  ctx.fillText('au quotidien.', 60, 990);
  ctx.fillStyle = C.navy;
  ctx.font = font(700, 36);
  ctx.fillText('Durée', 60, 1090);
  ['1 mois', '3 mois', '12 mois'].forEach((d, i) => {
    const x = 60 + i * 265;
    rr(ctx, x, 1120, 240, 96, 30);
    ctx.fillStyle = i === 1 ? C.navy : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#d5dbef';
    ctx.lineWidth = 3;
    if (i !== 1) ctx.stroke();
    ctx.fillStyle = i === 1 ? C.white : C.navy;
    ctx.font = font(700, 32);
    ctx.textAlign = 'center';
    ctx.fillText(d, x + 120, 1180);
    ctx.textAlign = 'left';
  });
  ['Activation accompagnée', 'Assistance en français', 'Conseils pour bien choisir'].forEach((s, i) => {
    const y = 1290 + i * 90;
    ctx.beginPath();
    ctx.arc(90, y, 28, 0, 7);
    ctx.fillStyle = hexA(C.turq, 0.25);
    ctx.fill();
    icon(ctx, 'check', 90, y, 40, '#11806f', 0.16);
    ctx.fillStyle = C.navy;
    ctx.font = font(600, 34);
    ctx.fillText(s, 140, y + 12);
  });
  const bg = ctx.createLinearGradient(60, 0, W - 60, 0);
  bg.addColorStop(0, C.violet);
  bg.addColorStop(1, C.blue);
  rr(ctx, 60, H - 250, W - 120, 120, 60);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = font(800, 40);
  ctx.textAlign = 'center';
  ctx.fillText('Choisir cette offre', W / 2, H - 175);
  ctx.textAlign = 'left';
  return c;
}

function ripple(ctx, x, y, k) {
  if (k <= 0 || k >= 1) return;
  ctx.beginPath();
  ctx.arc(x, y, 30 + 110 * easeOut(k), 0, 7);
  ctx.fillStyle = `rgba(52,120,246,${0.28 * (1 - k)})`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 34 * (1 - k * 0.4), 0, 7);
  ctx.fillStyle = `rgba(86,67,233,${0.45 * (1 - k)})`;
  ctx.fill();
}

// lt = temps local de la scène 4 (0 → 6 s) ; cues alignés sur timeline.json
export function drawShop(ctx, W, H, lt) {
  if (!shopPage) shopPage = buildShopPage(W);
  if (!productPage) productPage = buildProductPage(W, H);
  ctx.fillStyle = '#F7F9FF';
  ctx.fillRect(0, 0, W, H);
  const headH = 470;
  // défilement : 0.7→2.0 descente, 3.6→4.2 sélection de l'offre
  const scroll = 640 * easeInOut(range(lt, 0.7, 2.0)) - 330 * easeInOut(range(lt, 2.15, 2.75));
  ctx.drawImage(shopPage, 0, scroll, W, H - headH, 0, headH, W, H - headH);
  // en-tête fixe
  ctx.fillStyle = 'rgba(247,249,255,0.97)';
  ctx.fillRect(0, 0, W, headH);
  statusBar(ctx, W, C.navy);
  if (IMG.tile) ctx.drawImage(IMG.tile, 50, 128, 96, 96);
  if (IMG.wmNavy) ctx.drawImage(IMG.wmNavy, 166, 150, 290, 290 * (IMG.wmNavy.height / IMG.wmNavy.width));
  ctx.beginPath();
  ctx.arc(W - 100, 176, 44, 0, 7);
  ctx.fillStyle = '#e9ecf8';
  ctx.fill();
  icon(ctx, 'user', W - 100, 178, 52, C.navy, 0.1);
  rr(ctx, 50, 255, W - 100, 90, 45);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#dfe3f3';
  ctx.lineWidth = 3;
  ctx.stroke();
  icon(ctx, 'search', 105, 300, 46, '#8b93b5', 0.12);
  ctx.fillStyle = '#8b93b5';
  ctx.font = font(500, 32);
  ctx.fillText('Rechercher un service', 150, 312);
  // catégories (chip « IA » sélectionné à 1.2 s)
  const sel = lt > 1.2 ? 2 : 0;
  let x = 50 - 60 * easeInOut(range(lt, 1.0, 1.4));
  CATS.forEach((cat, i) => {
    ctx.font = font(700, 30);
    const w = ctx.measureText(cat).width + 64;
    rr(ctx, x, 375, w, 68, 34);
    const on = i === sel;
    ctx.fillStyle = on ? C.navy : '#ffffff';
    ctx.fill();
    if (!on) {
      ctx.strokeStyle = '#dfe3f3';
      ctx.stroke();
    }
    ctx.fillStyle = on ? C.white : C.navy;
    ctx.fillText(cat, x + 32, 420);
    if (i === 2) ripple(ctx, x + w / 2, 409, range(lt, 1.18, 1.75));
    x += w + 18;
  });
  // carte « Assistant IA Pro » mise en avant puis touchée
  const cardY = headH + (570 + 330) - scroll;
  const hl = range(lt, 2.6, 2.9) * (1 - range(lt, 3.2, 3.4));
  if (hl > 0) {
    rr(ctx, 46, cardY - 4, W - 92, 298, 46);
    ctx.strokeStyle = hexA(C.blue, hl);
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ripple(ctx, W * 0.55, cardY + 145, range(lt, 2.92, 3.5));
  // barre de navigation
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.fillRect(0, H - 170, W, 170);
  ctx.fillStyle = '#e4e8f5';
  ctx.fillRect(0, H - 170, W, 2);
  ['home', 'search', 'heart', 'user'].forEach((ic, i) => {
    icon(ctx, ic, W * (0.14 + i * 0.24), H - 100, 58, i === 0 ? C.violet : '#9aa2c0', 0.1);
  });
  // fiche produit : glisse depuis la droite à 3.05 s
  const pk = expoOut(range(lt, 3.05, 3.65));
  if (pk > 0) {
    ctx.fillStyle = `rgba(11,16,48,${0.25 * pk})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate((1 - pk) * W, 0);
    const sg = ctx.createLinearGradient(-60, 0, 0, 0);
    sg.addColorStop(0, 'rgba(11,16,48,0)');
    sg.addColorStop(1, 'rgba(11,16,48,0.3)');
    ctx.fillStyle = sg;
    ctx.fillRect(-60, 0, 60, H);
    ctx.drawImage(productPage, 0, 0);
    ctx.restore();
    // option « 3 mois » puis bouton
    ripple(ctx, 60 + 265 + 120, 1168, range(lt, 4.3, 4.85));
    const pulse = range(lt, 4.9, 5.5);
    if (pulse > 0 && pulse < 1) {
      rr(ctx, 60 - 12 * pulse, H - 250 - 12 * pulse, W - 120 + 24 * pulse, 120 + 24 * pulse, 70);
      ctx.strokeStyle = hexA(C.turq, 1 - pulse);
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }
}

/* --------------------------------------- écran d'accueil ABONIVO (S5) */
export function drawSplash(ctx, W, H, t, textAlpha = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#141a52');
  g.addColorStop(1, C.navy);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.8);
  rg.addColorStop(0, 'rgba(86,67,233,0.55)');
  rg.addColorStop(0.5, 'rgba(52,120,246,0.15)');
  rg.addColorStop(1, 'rgba(52,120,246,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  statusBar(ctx, W, C.white);
  const s = 460;
  if (IMG.tile) ctx.drawImage(IMG.tile, W / 2 - s / 2, H * 0.42 - s / 2 - 80, s, s);
  ctx.globalAlpha = textAlpha;
  if (IMG.wmWhite) {
    const ww = 560;
    ctx.drawImage(IMG.wmWhite, W / 2 - ww / 2, H * 0.42 + 230, ww, ww * (IMG.wmWhite.height / IMG.wmWhite.width));
  }
  ctx.fillStyle = 'rgba(247,249,255,0.75)';
  ctx.font = font(500, 34);
  ctx.textAlign = 'center';
  ctx.fillText('Vos abonnements numériques, simplifiés.', W / 2, H * 0.42 + 400);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}
