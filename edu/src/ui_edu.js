// Interfaces 2D de la vidéo éducative. Aucune interface de service réel, aucun tarif :
// les montants sont toujours représentés par des barres neutres.
import { C, clamp, lerp, range, easeOut, easeInOut, backOut, expoOut, rr, hexA, font } from '../../spot/src/util.js';
import { canvas, icon, statusBar, iconTile, softShadow, glassPanel } from '../../spot/src/ui.js';

export { canvas };

function priceBar(ctx, x, y, w, h, t, color = C.violet) {
  rr(ctx, x, y, w, h, h / 2);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  const s = (t * 0.8) % 1;
  g.addColorStop(0, hexA(color, 0.28));
  g.addColorStop(clamp(s - 0.15), hexA(color, 0.28));
  g.addColorStop(s, hexA(color, 0.55));
  g.addColorStop(clamp(s + 0.15), hexA(color, 0.28));
  g.addColorStop(1, hexA(color, 0.28));
  ctx.fillStyle = g;
  ctx.fill();
}

const MONTHS = ['JANV.', 'FÉVR.', 'MARS', 'AVR.', 'MAI', 'JUIN', 'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.'];

/* --------------------------------- S1 : prix initial → échéances mensuelles */
export function drawPriceToInstalments(ctx, W, H, t) {
  ctx.fillStyle = '#F7F9FF';
  ctx.fillRect(0, 0, W, H);
  statusBar(ctx, W, C.navy);
  ctx.fillStyle = C.navy;
  ctx.font = font(800, 58);
  ctx.fillText('Mon abonnement', 60, 220);
  // carte « abonnement numérique »
  const k = backOut(range(t, 0.25, 0.8), 1.2);
  ctx.save();
  ctx.globalAlpha = clamp(k * 1.5);
  ctx.translate(0, (1 - k) * 60);
  softShadow(ctx, 60, 270, W - 120, 420, 48, 0.18, 30, 16);
  const g = ctx.createLinearGradient(60, 270, W - 60, 690);
  g.addColorStop(0, C.navy);
  g.addColorStop(0.6, '#26227a');
  g.addColorStop(1, C.violet);
  rr(ctx, 60, 270, W - 120, 420, 48);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  rr(ctx, 60, 270, W - 120, 420, 48);
  ctx.clip();
  const rg = ctx.createRadialGradient(W - 140, 320, 0, W - 140, 320, 420);
  rg.addColorStop(0, 'rgba(55,221,195,0.45)');
  rg.addColorStop(1, 'rgba(55,221,195,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 270, W, 420);
  ctx.restore();
  iconTile(ctx, 110, 320, 120, 'grid', C.blue, C.turq);
  ctx.fillStyle = C.white;
  ctx.font = font(700, 44);
  ctx.fillText('Abonnement numérique', 260, 375);
  ctx.fillStyle = 'rgba(247,249,255,0.7)';
  ctx.font = font(500, 32);
  ctx.fillText('Offre mensuelle', 260, 420);
  // prix de départ → se fragmente en échéances
  const split = easeInOut(range(t, 1.5, 2.0));
  ctx.fillStyle = 'rgba(247,249,255,0.75)';
  ctx.font = font(600, 30);
  ctx.fillText(split < 0.5 ? 'Prix de départ' : 'Chaque mois', 110, 520);
  const bw = lerp(380, 120, split);
  for (let i = 0; i < (split > 0 ? 3 : 1); i++) {
    const x = 110 + i * (bw + 26) * split;
    priceBar(ctx, x, 550, bw, 66, t, '#ffffff');
  }
  ctx.fillStyle = C.turq;
  ctx.font = font(800, 40);
  if (split > 0.3) {
    ctx.globalAlpha = clamp((split - 0.3) * 2) * clamp(k * 1.5);
    ctx.fillText('× 12', 110 + 3 * (bw + 26), 598);
  }
  ctx.restore();
  // calendrier des échéances
  const ck = range(t, 1.65, 2.0);
  if (ck > 0) {
    ctx.globalAlpha = ck;
    ctx.fillStyle = C.navy;
    ctx.font = font(800, 44);
    ctx.fillText('Échéances', 60, 800);
    const n = Math.floor(clamp((t - 1.75) / 1.35) * 12 + 0.001);
    ctx.fillStyle = '#6b7396';
    ctx.font = font(600, 32);
    ctx.textAlign = 'right';
    ctx.fillText(`${n} / 12`, W - 60, 800);
    ctx.textAlign = 'left';
    const cw = (W - 120 - 2 * 24) / 3, ch = 200;
    for (let i = 0; i < 12; i++) {
      const x = 60 + (i % 3) * (cw + 24), y = 840 + Math.floor(i / 3) * (ch + 22);
      const on = range(t, 1.75 + i * (1.35 / 12), 1.75 + (i + 1) * (1.35 / 12));
      const e = backOut(on, 1.6);
      rr(ctx, x, y, cw, ch, 32);
      ctx.fillStyle = on > 0 ? '#ffffff' : '#eef1fa';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = on > 0 ? hexA(C.violet, 0.35 * e) : '#e1e5f2';
      ctx.stroke();
      ctx.fillStyle = on > 0 ? C.violet : '#b3b9d1';
      ctx.font = font(700, 30);
      ctx.fillText(MONTHS[i], x + 28, y + 56);
      if (on > 0) {
        ctx.save();
        ctx.translate(x + 28, y + 100 + (1 - e) * 20);
        ctx.globalAlpha = ck * clamp(on * 2);
        priceBar(ctx, 0, 0, cw - 56, 40, t, C.blue);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x + cw - 40, y + 44, 14, 0, 7);
        ctx.fillStyle = C.turq;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

/* ----------------------------------------- S2 : fonctionnalités logicielles */
const FEATURES = [
  ['cloud', 'Stockage en ligne', true],
  ['user', 'Statistiques avancées', false],
  ['doc', 'Partage de fichiers', true],
  ['shield', 'Gestion multi-équipes', false],
  ['grid', 'Accès API développeur', false],
  ['phone', 'Accès sur mobile', true],
  ['sparkle', 'Automatisations avancées', false],
  ['pen', 'Personnalisation de marque', false],
];
export function drawFeatures(ctx, W, H, t) {
  // t : temps global
  ctx.fillStyle = '#0d1236';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0a0e2b';
  ctx.fillRect(0, 0, 360, H);
  iconTile(ctx, 40, 44, 84, 'grid', C.violet, C.blue);
  ctx.fillStyle = C.white;
  ctx.font = font(700, 34);
  ctx.fillText('Logiciel', 146, 98);
  for (let i = 0; i < 5; i++) {
    rr(ctx, 40, 180 + i * 76, 280, 54, 14);
    ctx.fillStyle = i === 1 ? 'rgba(86,67,233,0.35)' : 'rgba(255,255,255,0.05)';
    ctx.fill();
    rr(ctx, 64, 200 + i * 76, 110 + ((i * 47) % 120), 14, 7);
    ctx.fillStyle = 'rgba(247,249,255,0.35)';
    ctx.fill();
  }
  ctx.fillStyle = C.white;
  ctx.font = font(800, 54);
  ctx.fillText('Fonctionnalités incluses', 430, 130);
  ctx.fillStyle = 'rgba(247,249,255,0.55)';
  ctx.font = font(500, 30);
  ctx.fillText('De quoi avez-vous réellement besoin ?', 432, 182);
  const fade = easeInOut(range(t, 6.6, 7.4));
  let ess = 0;
  FEATURES.forEach(([ic, name, keep], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 430 + col * 720, y = 250 + row * 210;
    const appear = expoOut(range(t, 5.2 + i * 0.07, 5.7 + i * 0.07));
    let hl = 0;
    if (keep) {
      hl = backOut(range(t, 7.8 + ess * 0.35, 8.15 + ess * 0.35), 1.5);
      ess++;
    }
    const a = appear * (keep ? 1 : lerp(1, 0.22, fade));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y + (1 - appear) * 30);
    rr(ctx, 0, 0, 680, 170, 34);
    ctx.fillStyle = keep && hl > 0 ? hexA(C.turq, 0.1 + 0.08 * hl) : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = keep && hl > 0 ? hexA(C.turq, 0.85 * clamp(hl)) : 'rgba(255,255,255,0.1)';
    ctx.stroke();
    iconTile(ctx, 34, 35, 100, ic, keep ? C.blue : '#3a4170', keep ? C.violet : '#262b55');
    ctx.fillStyle = C.white;
    ctx.font = font(700, 38);
    ctx.fillText(name, 166, 98);
    // case à cocher
    ctx.beginPath();
    ctx.arc(612, 85, 32, 0, 7);
    if (keep && hl > 0) {
      ctx.fillStyle = C.turq;
      ctx.fill();
      icon(ctx, 'check', 612, 86, 48 * clamp(hl), C.navy, 0.18);
    } else {
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.stroke();
    }
    if (!keep && fade > 0) {
      ctx.strokeStyle = `rgba(247,249,255,${0.5 * fade})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(166, 86);
      ctx.lineTo(166 + 400 * fade, 86);
      ctx.stroke();
    }
    ctx.restore();
  });
}

/* ------------------------------------------- S3 : cartes Mensuel / Annuel */
export function makePlanCard(kind) {
  const Wc = 640, Hc = 820;
  const cv = canvas(Wc, Hc);
  const ctx = cv.getContext('2d');
  const annual = kind === 'annuel';
  // verre clair
  rr(ctx, 6, 6, Wc - 12, Hc - 12, 60);
  const g = ctx.createLinearGradient(0, 0, Wc, Hc);
  g.addColorStop(0, 'rgba(255,255,255,0.98)');
  g.addColorStop(1, 'rgba(240,243,255,0.95)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 4;
  const b = ctx.createLinearGradient(0, 0, Wc, Hc);
  b.addColorStop(0, 'rgba(255,255,255,1)');
  b.addColorStop(1, annual ? hexA(C.turq, 0.8) : hexA(C.violet, 0.6));
  ctx.strokeStyle = b;
  ctx.stroke();
  iconTile(ctx, 56, 60, 110, annual ? 'grid' : 'doc', annual ? C.turq : C.violet, C.blue);
  ctx.fillStyle = C.navy;
  ctx.font = font(800, 64);
  ctx.fillText(annual ? 'Annuel' : 'Mensuel', 56, 260);
  const rows = [
    ['Prix', null],
    ['Engagement', annual ? '12 mois' : '1 mois'],
    ['Renouvellement', annual ? 'Chaque année' : 'Chaque mois'],
  ];
  rows.forEach(([label, val], i) => {
    const y = 330 + i * 150;
    ctx.fillStyle = '#7a82a6';
    ctx.font = font(600, 30);
    ctx.fillText(label, 56, y + 36);
    if (val) {
      ctx.fillStyle = C.navy;
      ctx.font = font(800, 42);
      ctx.fillText(val, 56, y + 92);
    } else {
      rr(ctx, 56, y + 56, 300, 44, 22);
      ctx.fillStyle = hexA(annual ? C.turq : C.violet, 0.25);
      ctx.fill();
      ctx.fillStyle = annual ? '#119a85' : C.violet;
      ctx.font = font(700, 26);
      ctx.fillText('à comparer', 380, y + 88);
    }
    if (i < rows.length - 1) {
      ctx.fillStyle = '#e3e7f4';
      ctx.fillRect(56, y + 128, Wc - 112, 3);
    }
  });
  return cv;
}

export function drawTabletCompare(ctx, W, H, t) {
  ctx.fillStyle = '#F7F9FF';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.navy;
  ctx.font = font(800, 64);
  ctx.fillText('Comparer les formules', 80, 140);
  for (let c = 0; c < 2; c++) {
    const x = 80 + c * (W / 2 - 40);
    rr(ctx, x, 200, W / 2 - 120, H - 280, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e1e5f2';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let r = 0; r < 5; r++) {
      rr(ctx, x + 40, 260 + r * 150, (W / 2 - 200) * (0.5 + ((r * 37 + c * 19) % 40) / 100), 26, 13);
      ctx.fillStyle = r === 0 ? hexA(c ? C.turq : C.violet, 0.5) : '#e6e9f5';
      ctx.fill();
      rr(ctx, x + 40, 300 + r * 150, (W / 2 - 200) * 0.35, 20, 10);
      ctx.fillStyle = '#eef0f8';
      ctx.fill();
    }
  }
}

/** Mini-calendrier d'engagement (12 mois qui se remplissent). */
export function drawEngagement(ctx, W, H, t, t0) {
  ctx.clearRect(0, 0, W, H);
  softShadow(ctx, 20, 20, W - 40, H - 40, 50, 0.12, 16, 8);
  rr(ctx, 20, 20, W - 40, H - 40, 50);
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.fill();
  // en-tête du calendrier
  rr(ctx, 20, 20, W - 40, 150, 50);
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, C.violet);
  g.addColorStop(1, C.blue);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillRect(20, 120, W - 40, 50);
  ctx.fillStyle = '#F7F9FF';
  ctx.font = font(800, 46);
  ctx.fillText("Durée d'engagement", 70, 112);
  for (let i = 0; i < 2; i++) {
    rr(ctx, 120 + i * (W - 300), -10, 40, 70, 20);
    ctx.fillStyle = '#c9cfe6';
    ctx.fill();
  }
  const cw = (W - 140 - 3 * 20) / 4, ch = 120;
  for (let i = 0; i < 12; i++) {
    const x = 70 + (i % 4) * (cw + 20), y = 210 + Math.floor(i / 4) * (ch + 20);
    const on = range(t, t0 + 0.25 + i * 0.07, t0 + 0.4 + i * 0.07);
    rr(ctx, x, y, cw, ch, 24);
    ctx.fillStyle = on > 0 ? hexA(C.turq, 0.18 + 0.1 * on) : '#f0f2fa';
    ctx.fill();
    ctx.fillStyle = on > 0 ? '#0f7f6e' : '#9aa2c0';
    ctx.font = font(700, 28);
    ctx.textAlign = 'center';
    ctx.fillText(MONTHS[i], x + cw / 2, y + ch / 2 + 10);
    ctx.textAlign = 'left';
  }
}

/* ------------------------------------------------ S4 : calendrier mobile */
export function drawCalendarPhone(ctx, W, H, t) {
  ctx.fillStyle = '#0B1030';
  ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W * 0.8, 200, 0, W * 0.8, 200, 700);
  rg.addColorStop(0, 'rgba(86,67,233,0.35)');
  rg.addColorStop(1, 'rgba(86,67,233,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  statusBar(ctx, W, C.white);
  ctx.fillStyle = C.white;
  ctx.font = font(800, 64);
  ctx.fillText('Calendrier', 60, 230);
  ctx.fillStyle = 'rgba(247,249,255,0.6)';
  ctx.font = font(600, 36);
  ctx.fillText('Novembre', 60, 290);
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const cw = (W - 120) / 7;
  ctx.textAlign = 'center';
  days.forEach((d, i) => {
    ctx.fillStyle = 'rgba(247,249,255,0.45)';
    ctx.font = font(700, 30);
    ctx.fillText(d, 60 + cw * i + cw / 2, 380);
  });
  const offset = 5; // le 1er tombe un samedi
  const sel = 14;
  const hk = backOut(range(t, 16.85, 17.3), 1.8);
  for (let d = 1; d <= 30; d++) {
    const idx = d - 1 + offset;
    const x = 60 + cw * (idx % 7) + cw / 2, y = 470 + Math.floor(idx / 7) * 130;
    if (d === sel && hk > 0) {
      ctx.beginPath();
      ctx.arc(x, y - 12, 50 * hk, 0, 7);
      ctx.fillStyle = C.turq;
      ctx.fill();
      const pulse = range(t, 17.0, 18.0);
      if (pulse < 1) {
        ctx.beginPath();
        ctx.arc(x, y - 12, 50 + 60 * easeOut(pulse), 0, 7);
        ctx.strokeStyle = hexA(C.turq, 0.6 * (1 - pulse));
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    }
    ctx.fillStyle = d === sel && hk > 0.5 ? C.navy : C.white;
    ctx.font = font(d === sel ? 800 : 600, 40);
    ctx.fillText(String(d), x, y);
  }
  ctx.textAlign = 'left';
  // carte « événement » sous la grille
  const ek = expoOut(range(t, 17.2, 17.7));
  if (ek > 0) {
    ctx.globalAlpha = ek;
    const y = 1260 + (1 - ek) * 40;
    rr(ctx, 60, y, W - 120, 200, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    ctx.fillStyle = C.turq;
    ctx.fillRect(60, y + 40, 10, 120);
    ctx.fillStyle = C.white;
    ctx.font = font(700, 40);
    ctx.fillText('Date de renouvellement', 110, y + 90);
    ctx.fillStyle = 'rgba(247,249,255,0.6)';
    ctx.font = font(500, 32);
    ctx.fillText('Vérifier les conditions', 110, y + 145);
    ctx.globalAlpha = 1;
  }
  // notification
  const nk = expoOut(range(t, 18.05, 18.55));
  if (nk > 0) {
    const y = lerp(-260, 70, nk);
    softShadow(ctx, 40, y, W - 80, 200, 50, 0.4, 20, 10);
    rr(ctx, 40, y, W - 80, 200, 50);
    ctx.fillStyle = '#F7F9FF';
    ctx.fill();
    iconTile(ctx, 76, y + 44, 112, 'bell', C.violet, C.blue);
    ctx.fillStyle = '#6b7396';
    ctx.font = font(600, 28);
    ctx.fillText('RAPPEL · maintenant', 220, y + 82);
    ctx.fillStyle = C.navy;
    ctx.font = font(800, 40);
    ctx.fillText('Renouvellement à vérifier', 220, y + 138);
  }
}

/** Page de calendrier flottante (au-dessus du téléphone). */
export function drawCalendarPage(ctx, W, H, t) {
  ctx.clearRect(0, 0, W, H);
  rr(ctx, 10, 30, W - 20, H - 40, 44);
  ctx.fillStyle = '#F7F9FF';
  ctx.fill();
  rr(ctx, 10, 30, W - 20, 150, 44);
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, C.violet);
  g.addColorStop(1, C.blue);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillRect(10, 130, W - 20, 50);
  for (let i = 0; i < 2; i++) {
    rr(ctx, W * 0.28 + i * W * 0.38, 0, 34, 70, 17);
    ctx.fillStyle = '#c9cfe6';
    ctx.fill();
  }
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.font = font(800, 54);
  ctx.fillText('NOVEMBRE', W / 2, 130);
  ctx.fillStyle = C.navy;
  ctx.font = font(900, 210);
  ctx.fillText('14', W / 2, 420);
  ctx.fillStyle = C.violet;
  ctx.font = font(700, 36);
  ctx.fillText('Renouvellement', W / 2, 500);
  ctx.textAlign = 'left';
}

/* ---------------------------------------- S5 : tuiles de synthèse */
export function makeRecapTile(kind) {
  const S = 420;
  const cv = canvas(S, S);
  const ctx = cv.getContext('2d');
  glassPanel(ctx, 6, 6, S - 12, S - 12, 90);
  const spec = {
    besoin: ['check', C.turq, C.blue],
    prix: ['doc', C.violet, C.blue],
    duree: ['bell', C.blue, C.turq],
  }[kind];
  iconTile(ctx, S / 2 - 110, S / 2 - 110, 220, spec[0], spec[1], spec[2]);
  return cv;
}

/* ------------------------------------------------ carte de paiement */
export function makePaymentCard() {
  const Wc = 856, Hc = 540;
  const cv = canvas(Wc, Hc);
  const ctx = cv.getContext('2d');
  rr(ctx, 0, 0, Wc, Hc, 44);
  const g = ctx.createLinearGradient(0, 0, Wc, Hc);
  g.addColorStop(0, '#141a52');
  g.addColorStop(0.55, '#2b2690');
  g.addColorStop(1, C.violet);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  rr(ctx, 0, 0, Wc, Hc, 44);
  ctx.clip();
  const rg = ctx.createRadialGradient(Wc * 0.9, Hc * 0.1, 0, Wc * 0.9, Hc * 0.1, 500);
  rg.addColorStop(0, 'rgba(55,221,195,0.5)');
  rg.addColorStop(1, 'rgba(55,221,195,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, Wc, Hc);
  ctx.restore();
  // puce
  rr(ctx, 80, 170, 130, 100, 18);
  const cg = ctx.createLinearGradient(80, 170, 210, 270);
  cg.addColorStop(0, '#e7e2c8');
  cg.addColorStop(1, '#a9a27f');
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,70,40,0.5)';
  ctx.lineWidth = 2;
  for (const y of [203, 237]) {
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(210, y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(145, 170);
  ctx.lineTo(145, 270);
  ctx.stroke();
  // sans contact
  ctx.strokeStyle = 'rgba(247,249,255,0.8)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(250, 220, 22 + i * 18, -0.7, 0.7);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(247,249,255,0.9)';
  ctx.font = font(600, 52);
  ctx.fillText('••••  ••••  ••••  ••••', 80, 390);
  ctx.fillStyle = 'rgba(247,249,255,0.55)';
  ctx.font = font(600, 28);
  ctx.fillText('CARTE DE PAIEMENT', 80, 470);
  return cv;
}

/** Notification « Renouvellement à vérifier » (version agrandie, en 3D devant le téléphone). */
export function makeNotification() {
  const W = 1100, H = 250;
  const cv = canvas(W, H);
  const ctx = cv.getContext('2d');
  rr(ctx, 10, 10, W - 20, H - 20, 64);
  ctx.fillStyle = 'rgba(247,249,255,0.97)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = hexA(C.turq, 0.7);
  ctx.stroke();
  iconTile(ctx, 50, 55, 140, 'bell', C.violet, C.blue);
  ctx.fillStyle = '#6b7396';
  ctx.font = font(700, 32);
  ctx.fillText('RAPPEL', 230, 105);
  ctx.fillStyle = C.navy;
  ctx.font = font(800, 52);
  ctx.fillText('Renouvellement à vérifier', 230, 175);
  return cv;
}
