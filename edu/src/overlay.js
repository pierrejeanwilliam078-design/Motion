// Typographie de la vidéo éducative (couleurs exactes de la charte, zone de sécurité Reels).
import { clamp, lerp, range, easeInOut, easeOut, expoOut, backOut } from '../../spot/src/util.js';

const $ = (sel) => document.querySelector(sel);
const E = {};

function words(el, html) {
  el.innerHTML = html
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
function block(el, t, a, b, fadeOut = 0.3) {
  const out = range(t, b - fadeOut, b);
  const vis = t >= a && t < b;
  el.style.visibility = vis ? 'visible' : 'hidden';
  el.style.opacity = 1 - out;
  el.style.filter = out > 0 ? `blur(${out * 14}px)` : 'none';
  el.style.transform = `translateY(${-out * 36}px)`;
}

export function initOverlay(svg) {
  $('#ov').innerHTML = `
    <div id="s1" class="blk top"><div class="l1"></div><div class="l2"></div></div>
    <div id="s2" class="blk top step dark"><span class="num">01</span><span class="lbl"></span><div class="bar"></div></div>
    <div id="s3" class="blk top step light"><span class="num">02</span><span class="lbl"></span><div class="bar"></div></div>
    <div id="s4" class="blk top step dark"><span class="num">03</span><span class="lbl"></span><div class="bar"></div></div>
    <div id="s5a" class="word">BESOIN</div><div id="s5b" class="word">PRIX</div><div id="s5c" class="word">DURÉE</div>
    <div id="s6" class="blk">
      <div class="halo"></div>
      <div class="tilewrap"><img class="tile" src="../spot/assets/logo_tile.png"><div class="shine"></div></div>
      <div class="wm"></div>
      <div class="tag"><div class="t1"></div><div class="t2"></div></div>
      <div class="cta"><span>CONTACTEZ-NOUS</span></div>
      <div class="num"><span class="ic"></span><span class="digits">+261 37 91 480 89</span></div>
    </div>`;
  E.s1 = $('#s1');
  E.s1a = words($('#s1 .l1'), 'Attention');
  E.s1b = words($('#s1 .l2'), 'aux détails !');
  E.steps = [
    ['#s2', '— Vos besoins', 5.35, 9.85],
    ['#s3', '— Prix et durée', 10.35, 14.85],
    ['#s4', '— Renouvellement', 15.4, 20.85],
  ].map(([sel, lbl, a, b]) => {
    const el = $(sel);
    return { el, a, b, num: el.querySelector('.num'), lbl: words(el.querySelector('.lbl'), lbl), bar: el.querySelector('.bar') };
  });
  E.s5 = [$('#s5a'), $('#s5b'), $('#s5c')];
  E.s6 = $('#s6');
  $('#s6 .wm').innerHTML = svg.replace('currentColor', '#F7F9FF');
  E.tag1 = words($('#s6 .t1'), 'Le bon abonnement commence');
  E.tag2 = words($('#s6 .t2'), 'par le bon choix.');
  $('#s6 .ic').innerHTML =
    '<svg viewBox="0 0 24 24"><path fill="#0B1030" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
}

export function updateOverlay(t) {
  /* S1 — Attention aux détails ! */
  block(E.s1, t, 0.3, 4.8);
  reveal(E.s1a, t, 0.45);
  reveal(E.s1b, t, 0.7, 0.1);

  /* S2–S4 — étapes numérotées */
  for (const s of E.steps) {
    block(s.el, t, s.a - 0.05, s.b);
    const k = expoOut(range(t, s.a, s.a + 0.5));
    s.num.style.transform = `translateY(${(1 - k) * 40}px) scale(${0.6 + 0.4 * backOut(range(t, s.a, s.a + 0.5), 1.6)})`;
    s.num.style.opacity = clamp(k * 2);
    reveal(s.lbl, t, s.a + 0.12, 0.07);
    s.bar.style.transform = `scaleX(${expoOut(range(t, s.a + 0.3, s.a + 0.9))})`;
  }

  /* S5 — BESOIN · PRIX · DURÉE (calés sur le rythme, avec les tuiles 3D) */
  {
    const T = [21.5, 22.3, 23.1];
    const out = range(t, 24.45, 24.85);
    E.s5.forEach((el, i) => {
      const k = range(t, T[i] - 0.1, T[i] + 0.4);
      const e = backOut(k, 1.5);
      const vis = t > T[i] - 0.1 && t < 24.9;
      el.style.visibility = vis ? 'visible' : 'hidden';
      el.style.opacity = clamp(k * 3) * (1 - out);
      el.style.transform = `translateX(${(1 - e) * 60}px) scale(${0.8 + 0.2 * e})`;
      el.style.filter = `blur(${(1 - clamp(k * 2)) * 8 + out * 12}px)`;
    });
  }

  /* S6 — logo, signature, appel à l'action */
  {
    const vis = t > 24.85;
    E.s6.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return;
    const lk = range(t, 24.9, 25.55);
    const tile = E.s6.querySelector('.tilewrap');
    tile.style.opacity = clamp(lk * 2.2);
    tile.style.transform = `perspective(1400px) translateY(${(1 - expoOut(lk)) * 70 + Math.sin(t * 1.4) * 4}px) rotateY(${(1 - expoOut(lk)) * -35 + Math.sin(t * 0.9) * 2.5}deg) rotateX(${(1 - expoOut(lk)) * 12}deg) scale(${0.82 + 0.18 * expoOut(lk)})`;
    const hk = range(t, 25.1, 26.0);
    const halo = E.s6.querySelector('.halo');
    halo.style.opacity = 0.75 * easeOut(hk) + 0.08 * Math.sin(t * 2.2);
    halo.style.transform = `translate(-50%,-50%) scale(${0.7 + 0.3 * easeOut(hk)})`;
    E.s6.querySelector('.shine').style.transform = `translateX(${lerp(-130, 130, easeInOut(range(t, 26.2, 27.1)))}%) rotate(18deg)`;
    const wk = expoOut(range(t, 25.15, 25.75));
    const wm = E.s6.querySelector('.wm');
    wm.style.clipPath = `inset(-20% ${(1 - wk) * 100}% -20% 0)`;
    wm.style.transform = `translateY(${(1 - wk) * 16}px)`;
    reveal(E.tag1, t, 25.3, 0.05, 0.5);
    reveal(E.tag2, t, 25.5, 0.05, 0.5);
    const ck = expoOut(range(t, 25.55, 26.1));
    const cta = E.s6.querySelector('.cta');
    const pulse = Math.sin(Math.PI * range(t, 26.65, 27.3));
    cta.style.opacity = clamp(ck * 1.5);
    cta.style.transform = `translateY(${(1 - ck) * 40}px) scale(${1 + 0.05 * pulse})`;
    cta.style.boxShadow = `0 18px 50px rgba(86,67,233,${0.45 + 0.3 * pulse}), 0 0 ${30 + 40 * pulse}px rgba(55,221,195,${0.25 + 0.35 * pulse})`;
    const nk = expoOut(range(t, 25.65, 26.2));
    const num = E.s6.querySelector('.num');
    num.style.opacity = clamp(nk * 1.5);
    num.style.transform = `translateY(${(1 - nk) * 40}px)`;
  }
}
