// Typographie et éléments graphiques 2D au-dessus du rendu 3D (couleurs exactes de la charte).
import { clamp, lerp, range, easeInOut, easeOut, expoOut, backOut } from './util.js';

const $ = (sel) => document.querySelector(sel);
let E = {};

function words(el, text) {
  el.innerHTML = text
    .split(' ')
    .map((w) => `<span class="m"><span class="w">${w}</span></span>`)
    .join(' ');
  return [...el.querySelectorAll('.w')];
}

function reveal(ws, t, t0, stagger = 0.08, dur = 0.55) {
  ws.forEach((w, i) => {
    const k = expoOut(range(t, t0 + i * stagger, t0 + i * stagger + dur));
    w.style.transform = `translateY(${(1 - k) * 115}%) rotate(${(1 - k) * 4}deg)`;
  });
}

function show(el, o, extra = '') {
  el.style.opacity = o;
  el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
  if (extra !== null) el.style.transform = extra;
}

function exitStyle(el, k) {
  el.style.filter = k > 0 ? `blur(${k * 14}px)` : 'none';
}

export function initOverlay(svg) {
  const ov = $('#ov');
  ov.innerHTML = `
    <div id="scrim"></div>
    <div id="s1" class="blk top"><div class="l1"></div><div class="l2"></div></div>
    <div id="s2" class="blk"><div class="kick"></div><div class="wm"></div></div>
    <div id="s3" class="blk top"></div>
    <div id="s4" class="blk top"><div class="l1"></div><div class="l2"></div></div>
    <div id="s5a" class="word">CLAIR</div><div id="s5b" class="word">SIMPLE</div><div id="s5c" class="word">PRATIQUE</div>
    <div id="s6" class="blk">
      <div class="halo"></div>
      <div class="tilewrap"><img class="tile" src="assets/logo_tile.png"><div class="shine"></div></div>
      <div class="wm"></div>
      <div class="tag"></div>
      <div class="cta"><span>CONTACTEZ-NOUS</span></div>
      <div class="num"><span class="ic"></span><span class="digits">+261 37 9148089</span></div>
    </div>`;
  E.s1 = $('#s1');
  E.scrim = $('#scrim');
  E.s1a = words($('#s1 .l1'), 'Trop');
  E.s1b = words($('#s1 .l2'), 'd’abonnements ?');
  E.s2 = $('#s2');
  E.s2k = words($('#s2 .kick'), 'Découvrez');
  $('#s2 .wm').innerHTML = svg.replace('currentColor', '#F7F9FF');
  E.s3 = $('#s3');
  E.cats = ['STREAMING', 'IA', 'CRÉATION', 'FORMATION'].map((c) => {
    const d = document.createElement('div');
    d.className = 'cat';
    d.innerHTML = `<span class="m"><span class="w grad">${c}</span></span>`;
    E.s3.appendChild(d);
    return d;
  });
  E.s4 = $('#s4');
  E.s4a = words($('#s4 .l1'), 'Vos besoins.');
  E.s4b = words($('#s4 .l2'), 'Vos choix.');
  E.s5 = [$('#s5a'), $('#s5b'), $('#s5c')];
  E.s6 = $('#s6');
  $('#s6 .wm').innerHTML = svg.replace('currentColor', '#F7F9FF');
  E.s6tag = words($('#s6 .tag'), 'Vos abonnements numériques, simplifiés.');
  $('#s6 .ic').innerHTML =
    '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#0B1030" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
}

const CUES = { streaming: 8.36, ia: 9.14, creation: 10.58, formation: 11.8 };

export function updateOverlay(t) {
  /* S1 — Trop d'abonnements ? */
  {
    const out = range(t, 3.5, 3.85);
    show(E.s1, t < 3.9 ? 1 - out : 0, `translateY(${-out * 40}px) scale(${1 + 0.08 * range(t, 0.4, 3.85)})`);
    exitStyle(E.s1, out);
    show(E.scrim, (t < 3.9 ? range(t, 0.3, 0.8) * (1 - out) : 0), null);
    reveal(E.s1a, t, 0.4);
    reveal(E.s1b, t, 0.62, 0.12);
  }
  /* S2 — Découvrez ABONIVO */
  {
    const out = range(t, 7.65, 7.95);
    show(E.s2, t > 5.8 && t < 8 ? 1 - out : 0, `translateY(${-out * 30}px)`);
    exitStyle(E.s2, out);
    reveal(E.s2k, t, 5.85);
    const wk = expoOut(range(t, 6.05, 6.75));
    const wm = E.s2.querySelector('.wm');
    wm.style.clipPath = `inset(0 ${(1 - wk) * 100}% 0 0)`;
    wm.style.transform = `translateX(${(1 - wk) * -30}px)`;
    wm.style.letterSpacing = '0';
  }
  /* S3 — catégories */
  {
    const T = [CUES.streaming, CUES.ia, CUES.creation, CUES.formation, 13.55];
    show(E.s3, t > 8.2 && t < 13.9 ? 1 : 0);
    E.cats.forEach((d, i) => {
      const inK = expoOut(range(t, T[i] - 0.08, T[i] + 0.4));
      const outK = range(t, T[i + 1] - 0.18, T[i + 1] + 0.02);
      const vis = t >= T[i] - 0.08 && t < T[i + 1] + 0.02;
      d.style.visibility = vis ? 'visible' : 'hidden';
      const w = d.querySelector('.w');
      w.style.transform = `translateY(${(1 - inK) * 110 - outK * 110}%)`;
      d.style.letterSpacing = `${lerp(0.25, 0.02, inK)}em`;
      d.style.opacity = 1 - outK * 0.6;
    });
  }
  /* S4 — Vos besoins. Vos choix. */
  {
    const out = range(t, 19.5, 19.85);
    show(E.s4, t > 14.6 && t < 19.9 ? 1 - out : 0, `translateY(${-out * 30}px)`);
    exitStyle(E.s4, out);
    reveal(E.s4a, t, 14.75, 0.1);
    reveal(E.s4b, t, 15.45, 0.1);
  }
  /* S5 — CLAIR / SIMPLE / PRATIQUE */
  {
    const dark = easeInOut(range(t, 22.4, 23.7));
    const col = `rgb(${Math.round(lerp(11, 247, dark))},${Math.round(lerp(16, 249, dark))},${Math.round(lerp(48, 255, dark))})`;
    const T = [20.62, 21.45, 22.12];
    const out = range(t, 24.45, 24.85);
    E.s5.forEach((el, i) => {
      const k = range(t, T[i] - 0.1, T[i] + 0.45);
      const e = backOut(k, 1.6);
      const vis = t > T[i] - 0.1 && t < 24.9;
      el.style.color = col;
      show(el, vis ? clamp(k * 3) * (1 - out) : 0, `translateY(${(1 - e) * 60 - out * 40}px) scale(${0.7 + 0.3 * e})`);
      el.style.filter = `blur(${(1 - clamp(k * 2)) * 10 + out * 12}px)`;
    });
  }
  /* S6 — logo, signature et appel à l'action */
  {
    const vis = t > 24.85;
    show(E.s6, vis ? 1 : 0, null);
    if (vis) {
      const lk = range(t, 24.9, 25.55);
      const tile = E.s6.querySelector('.tilewrap');
      tile.style.opacity = clamp(lk * 2.2);
      tile.style.transform = `perspective(1400px) translateY(${(1 - expoOut(lk)) * 70 + Math.sin(t * 1.4) * 4}px) rotateY(${(1 - expoOut(lk)) * -35 + Math.sin(t * 0.9) * 2.5}deg) rotateX(${(1 - expoOut(lk)) * 12}deg) scale(${0.82 + 0.18 * expoOut(lk)})`;
      const hk = range(t, 25.1, 26.0);
      const halo = E.s6.querySelector('.halo');
      halo.style.opacity = 0.75 * easeOut(hk) + 0.08 * Math.sin(t * 2.2);
      halo.style.transform = `translate(-50%,-50%) scale(${0.7 + 0.3 * easeOut(hk)})`;
      const sh = E.s6.querySelector('.shine');
      sh.style.transform = `translateX(${lerp(-130, 130, easeInOut(range(t, 26.1, 27.0)))}%) rotate(18deg)`;
      const wk = expoOut(range(t, 25.15, 25.75));
      const wm = E.s6.querySelector('.wm');
      wm.style.clipPath = `inset(-20% ${(1 - wk) * 100}% -20% 0)`;
      wm.style.transform = `translateY(${(1 - wk) * 16}px)`;
      reveal(E.s6tag, t, 25.3, 0.035, 0.5);
      const ck = expoOut(range(t, 25.4, 25.95));
      const cta = E.s6.querySelector('.cta');
      const pulse = Math.sin(Math.PI * range(t, 28.55, 29.2));
      cta.style.opacity = clamp(ck * 1.5);
      cta.style.transform = `translateY(${(1 - ck) * 40}px) scale(${1 + 0.05 * pulse})`;
      cta.style.boxShadow = `0 18px 50px rgba(86,67,233,${0.45 + 0.3 * pulse}), 0 0 ${30 + 40 * pulse}px rgba(55,221,195,${0.25 + 0.35 * pulse})`;
      const nk = expoOut(range(t, 25.5, 26.05));
      const num = E.s6.querySelector('.num');
      num.style.opacity = clamp(nk * 1.5);
      num.style.transform = `translateY(${(1 - nk) * 40}px)`;
    }
  }
}
