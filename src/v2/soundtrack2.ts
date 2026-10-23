// VERSION 2 — bande-son plus énergique : 114 BPM, kick continu, clap, doubles croches,
// basse roulante, pompage (sidechain), roulements avant chaque transition, filtre « dip » sur TSAROVY!.
// Réutilise les instruments de la V1 ; même chaîne de mixage, même export WAV.

import {
  CHORDS,
  Sched,
  automateDuck,
  bell,
  bass,
  click,
  impact,
  kick,
  midi,
  pad,
  pan,
  paper,
  perc,
  pluck,
  pop,
  riser,
  sparkle,
  tone,
  typing,
  whoosh,
  type Graph,
  type ScheduleOptions,
} from '../audio/soundtrack';
import { rand } from '../lib/motion';
import { VIDEO } from '../timeline';
import { BEAT2, CUES2, GROOVE2, SIXTEENTH2 } from './timeline2';

type Ctx = BaseAudioContext;
const inRange = (t: number, [a, b]: readonly [number, number]) => t >= a - 0.001 && t < b - 0.001;

// Nœuds propres à la V2, créés une fois par graphe (évite l'accumulation en lecture live).
const extras = new WeakMap<Graph, { pump: GainNode; filter: BiquadFilterNode }>();
function getExtras(ctx: Ctx, g: Graph) {
  let x = extras.get(g);
  if (!x) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.9;
    filter.frequency.value = 20000;
    const pump = ctx.createGain();
    pump.connect(filter);
    filter.connect(g.musicIn);
    x = { pump, filter };
    extras.set(g, x);
  }
  return x;
}

// --- Instruments supplémentaires ---------------------------------------------------------------

function clap(s: Sched, g: Graph, t: number, vel = 1, seed = 0) {
  const at = s.at(t);
  if (at === null) return;
  const n = s.noise(seed * 7 + t * 100);
  const bp = s.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1350;
  bp.Q.value = 0.9;
  const env = s.ctx.createGain();
  const p = env.gain;
  p.setValueAtTime(0.0001, at);
  [0, 0.011, 0.022].forEach((d) => {
    p.linearRampToValueAtTime(0.2 * vel, at + d + 0.001);
    p.exponentialRampToValueAtTime(0.03 * vel, at + d + 0.009);
  });
  p.linearRampToValueAtTime(0.16 * vel, at + 0.034);
  p.exponentialRampToValueAtTime(0.0001, at + 0.22);
  n.connect(bp).connect(env).connect(g.musicIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.45;
  env.connect(send).connect(g.musicVerb);
  s.start(n, at, at + 0.25);
}

function hat2(s: Sched, g: Graph, t: number, vel: number, seed: number, open = false) {
  const at = s.at(t);
  if (at === null) return;
  const n = s.noise(seed);
  const hp = s.ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = open ? 6800 : 8600;
  const env = s.ctx.createGain();
  perc(env.gain, at, (open ? 0.06 : 0.065) * vel, 0.002, open ? 0.24 : 0.035);
  const p = pan(s, (rand(seed + 3) - 0.5) * 0.6);
  n.connect(hp).connect(env).connect(p).connect(g.musicIn);
  s.start(n, at, at + (open ? 0.3 : 0.06));
}

function sawBass(s: Sched, g: Graph, t: number, note: number, dur: number, vel = 1) {
  const at = s.at(t);
  if (at === null) return;
  const lp = s.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 4;
  lp.frequency.setValueAtTime(1300, at);
  lp.frequency.exponentialRampToValueAtTime(260, at + dur);
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(0.13 * vel, at + 0.006);
  env.gain.exponentialRampToValueAtTime(0.03 * vel, at + dur);
  env.gain.linearRampToValueAtTime(0.0001, at + dur + 0.02);
  const o = s.osc('sawtooth', midi(note));
  const sub = s.osc('sine', midi(note - 12));
  const sg = s.ctx.createGain();
  sg.gain.value = 0.9;
  o.connect(lp);
  sub.connect(sg).connect(lp);
  lp.connect(env).connect(g.musicIn);
  s.start(o, at, at + dur + 0.04);
  s.start(sub, at, at + dur + 0.04);
}

function subDrop(s: Sched, g: Graph, t: number, level = 1) {
  const at = s.at(t);
  if (at === null) return;
  const o = s.osc('sine', 110);
  o.frequency.setValueAtTime(110, at);
  o.frequency.exponentialRampToValueAtTime(32, at + 0.9);
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.4 * level, 0.01, 1.1);
  o.connect(env).connect(g.sfxIn);
  s.start(o, at, at + 1.2);
}

/** Souffle inversé qui culmine exactement à `t`. */
function swell(s: Sched, g: Graph, t: number, dur: number, level = 1) {
  const at = s.at(t - dur);
  if (at === null) return;
  const n = s.noise(t * 41);
  const bp = s.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(600, at);
  bp.frequency.exponentialRampToValueAtTime(5200, at + dur);
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.22 * level, at + dur);
  env.gain.linearRampToValueAtTime(0.0001, at + dur + 0.03);
  n.connect(bp).connect(env).connect(g.sfxIn);
  s.start(n, at, at + dur + 0.05);
}

/** Bips numériques (glitch, variations). */
function blip(s: Sched, g: Graph, t: number, freq: number, level = 1, dur = 0.035) {
  const at = s.at(t);
  if (at === null) return;
  const o = s.osc('square', freq);
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.045 * level, 0.001, dur);
  const lp = s.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5000;
  o.connect(lp).connect(env).connect(g.sfxIn);
  s.start(o, at, at + dur + 0.02);
}

function roll(s: Sched, g: Graph, t0: number, t1: number) {
  const n = Math.round((t1 - t0) / SIXTEENTH2);
  for (let i = 0; i < n; i++) clap(s, g, t0 + i * SIXTEENTH2, 0.25 + (0.6 * i) / n, 500 + i);
}

// --- Partition V2 -------------------------------------------------------------------------------

const SLOT2 = BEAT2 * 8;
const PROG2 = ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'];
const chord2 = (t: number) => CHORDS[t >= CUES2.brand.logoIn - 0.01 ? 'F' : PROG2[Math.min(PROG2.length - 1, Math.floor(t / SLOT2))]];

function scheduleMusic2(s: Sched, g: Graph) {
  const { pump, filter } = getExtras(s.ctx, g);
  const gp: Graph = { ...g, musicIn: pump };
  const gf: Graph = { ...g, musicIn: filter };
  const T = CUES2.tip;
  const B = CUES2.brand;

  // Nappes (pompées), puis accord final sur la signature
  for (let k = 0; k < PROG2.length; k++) {
    const start = k * SLOT2;
    const end = Math.min((k + 1) * SLOT2, B.logoIn);
    if (start >= B.logoIn) break;
    pad(s, gp, start, end - start, CHORDS[PROG2[k]].pad, k === 0 ? 1200 : 2100, 0.95);
  }
  pad(s, gp, B.logoIn, VIDEO.duration - B.logoIn, CHORDS.F.pad, 1800, 1);

  const total = Math.ceil(VIDEO.duration / SIXTEENTH2);
  for (let n = 0; n < total; n++) {
    const t = n * SIXTEENTH2;
    const q = n % 4; // position dans le temps
    const b = Math.floor(n / 4);
    const bar = b % 4;
    const ch = chord2(t);
    const full = inRange(t, GROOVE2.full);
    const intro = inRange(t, GROOVE2.introBeat);
    const half = inRange(t, GROOVE2.half);
    const outro = inRange(t, GROOVE2.outro);

    // Arpège : tic-tic montant en intro, doubles croches à partir de Gemini
    if (t < CUES2.intro.morphEnd && q % 2 === 0) pluck(s, gp, t, ch.pad[(n / 2) % 4] + 24, 0.2 + t * 0.3, n % 4 ? 0.4 : -0.4, 0.18);
    if (intro && q % 2 === 0) pluck(s, gp, t, ch.pad[(n / 2) % 4] + 12, 0.5, n % 4 ? 0.3 : -0.3, 0.25);
    if (full) {
      const seq = [0, 2, 1, 3, 2, 0, 3, 1];
      const sixteenths = t >= CUES2.gemini.logoIn;
      if (sixteenths || q % 2 === 0) pluck(s, gf, t, ch.pad[seq[n % 8]] + (n % 16 < 8 ? 12 : 24), q === 0 ? 0.85 : 0.5, n % 2 ? 0.35 : -0.35, 0.22);
    }
    if (half && q === 0) pluck(s, gp, t, ch.pad[b % 4] + 12, 0.45, b % 2 ? 0.3 : -0.3, 0.5);
    if (outro && q % 2 === 0) pluck(s, gp, t, ch.pad[(n / 2) % 4] + 12, Math.max(0.15, 0.75 - (t - B.logoIn) * 0.25), n % 4 ? 0.3 : -0.3, 0.45);

    // Percussions
    if (intro) {
      if (q === 0) kick(s, gf, t, 0.75);
      if (q === 2) hat2(s, gf, t, 0.8, n);
    }
    if (full) {
      if (q === 0) kick(s, gf, t, 1.25);
      if (q === 0 && (bar === 1 || bar === 3)) clap(s, gf, t, 1, n);
      hat2(s, gf, t, q === 2 ? 0.95 : q === 0 ? 0.55 : 0.4, n);
      if (q === 2) hat2(s, gf, t, 0.55, n + 3000, true);
      if (q !== 0) sawBass(s, gp, t, ch.bass + (q === 2 ? 24 : 12), SIXTEENTH2 * 0.9, q === 2 ? 1 : 0.7);
    }
    if (half) {
      if (q === 0 && (bar === 0 || bar === 2)) kick(s, gf, t, 0.6);
      if (q === 0 && bar === 2) clap(s, gf, t, 0.7, n);
      if (q === 2) hat2(s, gf, t, 0.5, n);
      if (q === 0 && (bar === 0 || bar === 2)) bass(s, gp, t, ch.bass + 12, BEAT2 * 1.2, 0.4);
    }
  }
  if (inRange(B.logoIn, GROOVE2.outro)) kick(s, gf, B.logoIn, 1.2);

  // Roulements + montées avant les grandes transitions
  roll(s, gf, CUES2.chatgpt.whipStart + BEAT2 / 2, CUES2.chatgpt.whipMid);
  roll(s, gf, CUES2.gemini.wipeStart - BEAT2, CUES2.gemini.wipeStart);
  roll(s, gf, CUES2.canva.cut - BEAT2, CUES2.canva.cut);
  riser(s, gf, CUES2.intro.zoomStart - 0.5, CUES2.intro.zoomEnd, 0.06);
  riser(s, gf, CUES2.canva.glitchStart - 1.4, CUES2.canva.cut, 0.06);
  riser(s, gf, T.iris - 1.3, B.logoIn, 0.06);

  // Pompage : chaque temps de kick creuse les nappes, la basse et l'arpège
  const pg = pump.gain;
  if (s.first) {
    pg.cancelScheduledValues(0);
    pg.setValueAtTime(1, s.when);
  }
  for (let b = 0; b * BEAT2 < VIDEO.duration; b++) {
    const t = b * BEAT2;
    if (!(inRange(t, GROOVE2.full) || inRange(t, GROOVE2.introBeat))) continue;
    const at = s.at(t);
    if (at === null) continue;
    pg.setValueAtTime(1, at);
    pg.linearRampToValueAtTime(0.32, at + 0.012);
    pg.linearRampToValueAtTime(1, at + 0.26);
  }

  // Filtre « dip » sur TSAROVY! puis retour progressif ; gain structurel de la musique
  const ff = filter.frequency;
  const fpts: [number, number][] = [
    [0, 20000],
    [CUES2.canva.cut - 0.02, 20000],
    [CUES2.canva.cut + 0.05, 520],
    [T.split, 900],
    [T.split + 1.4, 20000],
  ];
  if (!s.first) return;
  automate(s, ff, fpts);
  automate(s, g.musicBus.gain, [
    [0, 1],
    [CUES2.canva.cut, 1],
    [CUES2.canva.cut + 0.05, 0.55],
    [T.split, 0.6],
    [T.split + 0.6, 0.75],
    [T.iris, 0.8],
    [B.logoIn, 1],
    [33.4, 1],
    [VIDEO.duration, 0.0001],
  ]);
}

function automate(s: Sched, p: AudioParam, pts: [number, number][]) {
  const valueAt = (t: number) => {
    for (let i = 1; i < pts.length; i++) {
      if (t <= pts[i][0]) {
        const [t0, v0] = pts[i - 1];
        const [t1, v1] = pts[i];
        return v0 + (v1 - v0) * ((t - t0) / (t1 - t0 || 1));
      }
    }
    return pts[pts.length - 1][1];
  };
  p.cancelScheduledValues(0);
  p.setValueAtTime(valueAt(s.from), s.when);
  for (const [t, v] of pts) if (t > s.from) p.linearRampToValueAtTime(v, s.when + (t - s.from));
}

function scheduleSfx2(s: Sched, g: Graph) {
  const I = CUES2.intro, C = CUES2.chatgpt, G = CUES2.gemini, L = CUES2.claude, V = CUES2.canva, T = CUES2.tip, B = CUES2.brand;
  // Intro
  whoosh(s, g, 0, 0.5, 0.7);
  for (let i = 0; i < 6; i++) click(s, g, i * SIXTEENTH2 * 2 + 0.05, 0.35, 2600 + i * 120);
  whoosh(s, g, I.circle, 0.5, 0.8, -1);
  swell(s, g, I.morphEnd, 0.4, 0.8);
  impact(s, g, I.morphEnd, 0.8);
  [84, 88, 91, 96].forEach((n, i) => bell(s, g, I.morphEnd + i * 0.05, n, 0.8 - i * 0.1, 1.1, (i - 1.5) * 0.25));
  I.words.forEach((t, i) => {
    pop(s, g, t, 0.6);
    click(s, g, t, 0.7, 1500 + i * 300);
  });
  sparkle(s, g, I.subtitleIn, 0.45, 4);
  swell(s, g, I.zoomEnd, 0.55, 1.1);
  impact(s, g, I.zoomEnd, 0.55);
  // ChatGPT
  pop(s, g, C.logoIn, 1);
  subDrop(s, g, C.logoIn, 0.7);
  click(s, g, C.titleIn, 0.6, 1800);
  C.chips.forEach((t, i) => click(s, g, t, 0.95, 2200 + i * 260));
  whoosh(s, g, C.shift - 0.05, 0.45, 0.8, -1);
  typing(s, g, C.typingStart, C.typingEnd, 1.1);
  pop(s, g, C.send, 0.9);
  whoosh(s, g, C.send, 0.3, 0.5);
  pop(s, g, C.replyTitle, 0.7);
  C.items.forEach((t, i) => click(s, g, t, 0.95, 2000 + i * 300));
  whoosh(s, g, C.whipStart + 0.1, C.whipMid - C.whipStart, 1.3, 1);
  // Gemini
  sparkle(s, g, G.logoIn, 1.1, 9);
  impact(s, g, G.logoIn, 0.35);
  click(s, g, G.titleIn, 0.6, 1800);
  G.chips.forEach((t, i) => click(s, g, t, 0.95, 2300 + i * 300));
  whoosh(s, g, G.shift - 0.05, 0.45, 0.7, -1);
  pop(s, g, G.searchIn, 0.6);
  typing(s, g, G.typingStart, G.typingEnd, 0.9);
  bell(s, g, G.notify, 84, 0.7, 0.45, -0.1);
  bell(s, g, G.notify + 0.09, 89, 0.7, 0.6, 0.1);
  G.cards.forEach((t, i) => {
    whoosh(s, g, t - 0.12, 0.28, 0.45, i % 2 ? 1 : -1);
    click(s, g, t, 0.95, 2100 + i * 250);
  });
  [0, 0.06, 0.12].forEach((d, i) => whoosh(s, g, G.wipeStart + d, 0.45, 0.8, i % 2 ? -1 : 1));
  // Claude
  L.papers.forEach((t, i) => paper(s, g, t, 1 - i * 0.08));
  pop(s, g, L.logoIn, 0.9);
  click(s, g, L.titleIn, 0.5, 1700);
  whoosh(s, g, L.scanStart, L.scanEnd - L.scanStart, 0.45);
  click(s, g, L.condense, 0.95, 2400);
  pop(s, g, L.summaryPop, 0.8);
  whoosh(s, g, L.flipStart, L.flipEnd - L.flipStart + 0.1, 1, -1);
  impact(s, g, L.flipEnd, 0.35);
  // Canva
  sparkle(s, g, V.settle, 0.6, 5);
  sparkle(s, g, V.artboardIn, 0.9, 7);
  V.elements.forEach((t, i) => click(s, g, t, 1, 1900 + (i % 3) * 350));
  V.variations.forEach((t, i) => {
    blip(s, g, t, 880 + i * 220, 1);
    blip(s, g, t + 0.05, 1320 + i * 220, 0.8);
    pop(s, g, t, 0.5);
  });
  for (let i = 0; i < 8; i++) blip(s, g, V.glitchStart + i * (SIXTEENTH2 / 2), 300 + rand(i + 77) * 2400, 1.2, 0.025);
  // Conseil
  swell(s, g, T.impact, 0.26, 1);
  impact(s, g, T.impact, 1.1);
  subDrop(s, g, T.impact, 1);
  whoosh(s, g, T.split - 0.05, 0.5, 1);
  for (let i = 0; i < 6; i++) click(s, g, T.line1In + i * SIXTEENTH2, 0.35, 1300 + i * 90);
  whoosh(s, g, T.box1, 0.3, 0.4);
  click(s, g, T.box1, 0.8, 2600);
  whoosh(s, g, T.line2In - 0.1, 0.35, 0.5, -1);
  tone(s, g, T.check, [69, 76], 1, 0.04, 1.1);
  sparkle(s, g, T.check + 0.15, 0.6, 5);
  pop(s, g, T.check, 0.9);
  whoosh(s, g, T.allOut, 0.4, 0.5);
  for (let i = 0; i < 8; i++) click(s, g, T.conclusionIn + i * SIXTEENTH2, 0.3, 1200 + i * 80);
  tone(s, g, T.conclusionIn, [57, 64, 69], 0.4, 0.3, 1.8);
  bell(s, g, T.box2, 89, 0.6, 0.9);
  whoosh(s, g, T.iris, B.logoIn - T.iris + 0.05, 1.1);
  // Signature
  impact(s, g, B.logoIn, 0.9);
  subDrop(s, g, B.logoIn, 0.8);
  [77, 81, 84, 89, 93].forEach((n, i) => bell(s, g, B.logoIn + 0.05 + i * 0.07, n, 1 - i * 0.08, 1.5, (i - 2) * 0.22, 0.8));
  sparkle(s, g, B.shine, 0.55, 5);
  for (let i = 0; i < 5; i++) click(s, g, B.taglineIn + i * SIXTEENTH2, 0.35, 1600 + i * 120);
  pop(s, g, B.contactIn, 0.7);
  click(s, g, B.contactIn + 0.05, 0.8, 2100);
  [89, 96, 93].forEach((n, i) => bell(s, g, B.outroChime + i * 0.12, n, 0.65, 2.2, (i - 1) * 0.3, 0.9));
}

export function scheduleSoundtrackV2(ctx: Ctx, g: Graph, opts: ScheduleOptions) {
  const s = new Sched(ctx, opts.from ?? 0, opts.when, opts.window?.start, opts.window?.end);
  if (opts.music !== false) scheduleMusic2(s, g);
  else if (s.first) {
    // Musique coupée : remettre les gains de la V2 à l'état neutre
    const { pump, filter } = getExtras(ctx, g);
    pump.gain.cancelScheduledValues(0);
    pump.gain.setValueAtTime(1, opts.when);
    filter.frequency.cancelScheduledValues(0);
    filter.frequency.setValueAtTime(20000, opts.when);
  }
  if (s.first) automateDuck(s, g, opts.voiceCues);
  if (opts.sfx !== false) scheduleSfx2(s, g);
  return s.sources;
}
