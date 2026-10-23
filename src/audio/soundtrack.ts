// Sound design 100 % synthétisé (Web Audio API), donc libre de droits.
// Le même code sert à la lecture en direct (AudioContext) et à l'export WAV (OfflineAudioContext),
// ce qui garantit une synchronisation identique entre l'aperçu et la vidéo MP4.

import { BEAT, CUES, EIGHTH, VIDEO, type VoiceCue } from '../timeline';
import { rand } from '../lib/motion';

type Ctx = BaseAudioContext;

export type Graph = {
  musicIn: AudioNode;
  musicVerb: AudioNode;
  sfxIn: AudioNode;
  sfxVerb: AudioNode;
  /** Gain de la musique (structure : baisse pendant « TSAROVY! », fondu final). */
  musicBus: GainNode;
  /** Gain de ducking sous la voix off. */
  duck: GainNode;
  master: GainNode;
};

export type ScheduleOptions = {
  /** Fenêtre de programmation [start, end[ (lecture live par tranches) ; absente = toute la bande-son. */
  window?: { start: number; end: number };
  /** Instant de la timeline (s) à partir duquel jouer. */
  from?: number;
  /** Instant du contexte audio correspondant à `from`. */
  when: number;
  music?: boolean;
  sfx?: boolean;
  voiceCues?: VoiceCue[];
};

export const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

// ---------------------------------------------------------------------------
// Ressources partagées (bruit, réverbération), reproductibles grâce à une graine.

const noiseCache = new WeakMap<Ctx, AudioBuffer>();
export function noise(ctx: Ctx) {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = rand(i + 17) * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

function impulse(ctx: Ctx, seconds: number, decay: number, seed: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const x = i / len;
      d[i] = (rand(i * 2 + c + seed) * 2 - 1) * (1 - x) ** decay * (i < ctx.sampleRate * 0.012 ? i / (ctx.sampleRate * 0.012) : 1);
    }
  }
  return buf;
}

/** Construit la chaîne de mixage : bus musique (+ ducking) et bus effets → compresseur → sortie. */
export function createGraph(ctx: Ctx, destination: AudioNode = ctx.destination): Graph {
  const master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 10;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.1;
  master.connect(comp).connect(limiter).connect(destination);

  const musicBus = ctx.createGain();
  const duck = ctx.createGain();
  const musicOut = ctx.createGain();
  musicOut.gain.value = 0.85;
  musicBus.connect(duck).connect(musicOut).connect(master);
  const musicVerbIn = ctx.createGain();
  musicVerbIn.gain.value = 0.9;
  const musicConv = ctx.createConvolver();
  musicConv.buffer = impulse(ctx, 2.8, 2.6, 101);
  musicVerbIn.connect(musicConv).connect(musicBus);

  const sfxIn = ctx.createGain();
  sfxIn.connect(master);
  const sfxVerbIn = ctx.createGain();
  const sfxConv = ctx.createConvolver();
  sfxConv.buffer = impulse(ctx, 2.2, 3, 202);
  sfxVerbIn.connect(sfxConv).connect(sfxIn);

  return { musicIn: musicBus, musicVerb: musicVerbIn, sfxIn, sfxVerb: sfxVerbIn, musicBus, duck, master };
}

// ---------------------------------------------------------------------------
// Ordonnanceur : convertit le temps de la timeline en temps du contexte audio.

export class Sched {
  sources: AudioScheduledSourceNode[] = [];
  /** Vrai pour la première tranche : c'est elle qui pose les automations (gains, filtres). */
  first: boolean;
  private lower: number;
  constructor(
    public ctx: Ctx,
    public from: number,
    public when: number,
    winStart = from,
    public winEnd = Infinity,
  ) {
    this.first = winStart <= from + 1e-6;
    this.lower = this.first ? from - 0.001 : winStart;
  }
  /** Temps contexte pour un événement démarrant à `s` (null s'il est passé ou hors de la tranche). */
  at(s: number) {
    return s < this.lower || s >= this.winEnd ? null : this.when + (s - this.from);
  }
  track<T extends AudioScheduledSourceNode>(n: T) {
    this.sources.push(n);
    return n;
  }
  osc(type: OscillatorType, freq: number) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return this.track(o);
  }
  noise(offsetSeed: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = noise(this.ctx);
    src.loop = true;
    (src as AudioBufferSourceNode & { _off: number })._off = rand(offsetSeed) * 1.5;
    return this.track(src);
  }
  start(n: AudioScheduledSourceNode, at: number, stop: number) {
    const off = (n as AudioScheduledSourceNode & { _off?: number })._off;
    if (n instanceof AudioBufferSourceNode && off !== undefined) n.start(at, off);
    else n.start(at);
    n.stop(stop);
  }
}

/** Enveloppe percussive : 0 → peak en `a`, puis décroissance exponentielle sur `d`. */
export function perc(g: AudioParam, at: number, peak: number, a: number, d: number) {
  g.setValueAtTime(0.0001, at);
  g.linearRampToValueAtTime(peak, at + a);
  g.exponentialRampToValueAtTime(0.0001, at + a + d);
}

export function pan(s: Sched, value: number) {
  const p = s.ctx.createStereoPanner();
  p.pan.value = value;
  return p;
}

// ---------------------------------------------------------------------------
// Instruments de la musique (electronic ambient, 108 BPM).

export function pad(s: Sched, g: Graph, start: number, dur: number, notes: number[], cutoff = 1500, level = 1) {
  const t0 = Math.max(start, s.from);
  if (start + dur + 1.6 <= s.from) return;
  const at = s.at(t0);
  if (at === null) return;
  const remaining = start + dur - t0;
  const attack = start >= s.from ? 1.1 : 0.25;
  const env = s.ctx.createGain();
  const lp = s.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cutoff * 0.7, at);
  lp.frequency.linearRampToValueAtTime(cutoff, at + Math.max(0.5, remaining));
  lp.Q.value = 0.6;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(0.055 * level, at + attack);
  env.gain.setValueAtTime(0.055 * level, at + Math.max(attack, remaining));
  env.gain.linearRampToValueAtTime(0.0001, at + Math.max(attack, remaining) + 1.5);
  lp.connect(env);
  env.connect(g.musicIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.55;
  env.connect(send).connect(g.musicVerb);
  const stop = at + Math.max(attack, remaining) + 1.6;
  notes.forEach((n, i) => {
    for (const det of [-8, 7]) {
      const o = s.osc('sawtooth', midi(n));
      o.detune.value = det + (i % 2 ? 2 : -2);
      const p = pan(s, det < 0 ? -0.35 : 0.35);
      o.connect(p).connect(lp);
      s.start(o, at, stop);
    }
  });
}

export function bass(s: Sched, g: Graph, t: number, note: number, dur: number, vel = 1) {
  const at = s.at(t);
  if (at === null) return;
  const lp = s.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(0.2 * vel, at + 0.012);
  env.gain.exponentialRampToValueAtTime(0.06 * vel, at + dur * 0.8);
  env.gain.linearRampToValueAtTime(0.0001, at + dur);
  const o1 = s.osc('triangle', midi(note));
  const o2 = s.osc('sine', midi(note));
  o1.connect(lp);
  o2.connect(lp);
  lp.connect(env).connect(g.musicIn);
  s.start(o1, at, at + dur + 0.02);
  s.start(o2, at, at + dur + 0.02);
}

export function kick(s: Sched, g: Graph, t: number, vel = 1) {
  const at = s.at(t);
  if (at === null) return;
  const o = s.osc('sine', 140);
  o.frequency.setValueAtTime(140, at);
  o.frequency.exponentialRampToValueAtTime(44, at + 0.13);
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.38 * vel, 0.004, 0.32);
  o.connect(env).connect(g.musicIn);
  s.start(o, at, at + 0.4);
}

export function hat(s: Sched, g: Graph, t: number, vel: number, seed: number) {
  const at = s.at(t);
  if (at === null) return;
  const n = s.noise(seed);
  const hp = s.ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 8200;
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.07 * vel, 0.002, 0.045);
  const p = pan(s, (rand(seed + 3) - 0.5) * 0.5);
  n.connect(hp).connect(env).connect(p).connect(g.musicIn);
  s.start(n, at, at + 0.08);
}

export function rim(s: Sched, g: Graph, t: number, seed: number) {
  const at = s.at(t);
  if (at === null) return;
  const n = s.noise(seed);
  const bp = s.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1900;
  bp.Q.value = 1.4;
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.11, 0.002, 0.09);
  n.connect(bp).connect(env).connect(g.musicIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.35;
  env.connect(send).connect(g.musicVerb);
  const o = s.osc('triangle', 410);
  const oe = s.ctx.createGain();
  perc(oe.gain, at, 0.05, 0.002, 0.05);
  o.connect(oe).connect(g.musicIn);
  s.start(n, at, at + 0.15);
  s.start(o, at, at + 0.1);
}

export function pluck(s: Sched, g: Graph, t: number, note: number, vel: number, panV: number, decay = 0.38) {
  const at = s.at(t);
  if (at === null) return;
  const lp = s.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(4200, at);
  lp.frequency.exponentialRampToValueAtTime(900, at + 0.22);
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.085 * vel, 0.003, decay);
  const p = pan(s, panV);
  const o1 = s.osc('triangle', midi(note));
  const o2 = s.osc('sine', midi(note + 12));
  const o2g = s.ctx.createGain();
  o2g.gain.value = 0.35;
  o1.connect(lp);
  o2.connect(o2g).connect(lp);
  lp.connect(env).connect(p).connect(g.musicIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.5;
  p.connect(send).connect(g.musicVerb);
  s.start(o1, at, at + decay + 0.05);
  s.start(o2, at, at + decay + 0.05);
}

export function riser(s: Sched, g: Graph, t0: number, t1: number, level = 0.06) {
  const at = s.at(t0);
  if (at === null) return;
  const d = t1 - t0;
  const n = s.noise(t0 * 1000);
  const hp = s.ctx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.Q.value = 0.9;
  hp.frequency.setValueAtTime(500, at);
  hp.frequency.exponentialRampToValueAtTime(7000, at + d);
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(level, at + d * 0.95);
  env.gain.linearRampToValueAtTime(0.0001, at + d);
  n.connect(hp).connect(env).connect(g.musicIn);
  s.start(n, at, at + d + 0.02);
}

// ---------------------------------------------------------------------------
// Effets sonores (sound design UI).

export function bell(s: Sched, g: Graph, t: number, note: number, vel: number, decay: number, panV = 0, verb = 0.6) {
  const at = s.at(t);
  if (at === null) return;
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.12 * vel, 0.004, decay);
  const p = pan(s, panV);
  env.connect(p).connect(g.sfxIn);
  const send = s.ctx.createGain();
  send.gain.value = verb;
  p.connect(send).connect(g.sfxVerb);
  [
    [1, 1],
    [2, 0.28],
    [3.01, 0.12],
    [4.2, 0.05],
  ].forEach(([ratio, amp]) => {
    const o = s.osc('sine', midi(note) * ratio);
    const og = s.ctx.createGain();
    og.gain.value = amp;
    o.connect(og).connect(env);
    s.start(o, at, at + decay + 0.05);
  });
}

export function whoosh(s: Sched, g: Graph, t: number, dur = 0.7, level = 1, dir = 1) {
  const at = s.at(t);
  if (at === null) return;
  const n = s.noise(t * 333);
  const bp = s.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(280, at);
  bp.frequency.exponentialRampToValueAtTime(2600, at + dur * 0.6);
  bp.frequency.exponentialRampToValueAtTime(700, at + dur);
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.32 * level, at + dur * 0.58);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  const p = s.ctx.createStereoPanner();
  p.pan.setValueAtTime(-0.6 * dir, at);
  p.pan.linearRampToValueAtTime(0.6 * dir, at + dur);
  n.connect(bp).connect(env).connect(p).connect(g.sfxIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.3;
  p.connect(send).connect(g.sfxVerb);
  s.start(n, at, at + dur + 0.02);
}

export function click(s: Sched, g: Graph, t: number, level = 1, pitch = 2400) {
  const at = s.at(t);
  if (at === null) return;
  const o = s.osc('sine', pitch);
  o.frequency.setValueAtTime(pitch, at);
  o.frequency.exponentialRampToValueAtTime(pitch * 0.55, at + 0.03);
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.09 * level, 0.001, 0.035);
  o.connect(env).connect(g.sfxIn);
  const n = s.noise(t * 777);
  const hp = s.ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5000;
  const ne = s.ctx.createGain();
  perc(ne.gain, at, 0.05 * level, 0.001, 0.012);
  n.connect(hp).connect(ne).connect(g.sfxIn);
  s.start(o, at, at + 0.06);
  s.start(n, at, at + 0.03);
}

export function pop(s: Sched, g: Graph, t: number, level = 1) {
  const at = s.at(t);
  if (at === null) return;
  const o = s.osc('sine', 320);
  o.frequency.setValueAtTime(320, at);
  o.frequency.exponentialRampToValueAtTime(980, at + 0.05);
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.22 * level, 0.004, 0.13);
  o.connect(env).connect(g.sfxIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.25;
  env.connect(send).connect(g.sfxVerb);
  s.start(o, at, at + 0.2);
}

export function typing(s: Sched, g: Graph, t0: number, t1: number, level = 1) {
  let t = t0;
  let i = 0;
  while (t < t1) {
    const at = s.at(t);
    if (at !== null) {
      const n = s.noise(i * 31 + t0 * 100);
      const bp = s.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2600 + rand(i + 5) * 2400;
      bp.Q.value = 2.2;
      const env = s.ctx.createGain();
      perc(env.gain, at, (0.16 + rand(i + 9) * 0.1) * level, 0.001, 0.028);
      const p = pan(s, (rand(i + 13) - 0.5) * 0.4);
      n.connect(bp).connect(env).connect(p).connect(g.sfxIn);
      s.start(n, at, at + 0.05);
    }
    t += 0.062 + rand(i + 101) * 0.05;
    i++;
  }
}

export function sparkle(s: Sched, g: Graph, t: number, level = 1, count = 7) {
  const scale = [89, 91, 93, 96, 98, 101, 103]; // F6 G6 A6 C7 D7 F7 G7
  for (let i = 0; i < count; i++) {
    bell(s, g, t + i * 0.048, scale[Math.floor(rand(i + t * 10) * scale.length)], (0.55 - i * 0.05) * level, 0.55, (rand(i + 50) - 0.5) * 1.2, 0.8);
  }
  const at = s.at(t);
  if (at === null) return;
  const n = s.noise(t * 91);
  const hp = s.ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7500;
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.03 * level, at + 0.12);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
  n.connect(hp).connect(env).connect(g.sfxIn);
  s.start(n, at, at + 0.65);
}

export function paper(s: Sched, g: Graph, t: number, level = 1) {
  const at = s.at(t);
  if (at === null) return;
  const n = s.noise(t * 57);
  const bp = s.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(1400, at);
  bp.frequency.exponentialRampToValueAtTime(4800, at + 0.2);
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.22 * level, at + 0.05);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
  const p = s.ctx.createStereoPanner();
  p.pan.setValueAtTime(-0.4, at);
  p.pan.linearRampToValueAtTime(0.4, at + 0.28);
  n.connect(bp).connect(env).connect(p).connect(g.sfxIn);
  s.start(n, at, at + 0.3);
}

export function tone(s: Sched, g: Graph, t: number, notes: number[], level: number, attack: number, decay: number) {
  const at = s.at(t);
  if (at === null) return;
  const env = s.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(0.07 * level, at + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  env.connect(g.sfxIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.7;
  env.connect(send).connect(g.sfxVerb);
  notes.forEach((n) => {
    const o = s.osc('sine', midi(n));
    o.connect(env);
    s.start(o, at, at + attack + decay + 0.05);
  });
}

export function impact(s: Sched, g: Graph, t: number, level = 1) {
  const at = s.at(t);
  if (at === null) return;
  const o = s.osc('sine', 90);
  o.frequency.setValueAtTime(90, at);
  o.frequency.exponentialRampToValueAtTime(36, at + 0.5);
  const env = s.ctx.createGain();
  perc(env.gain, at, 0.55 * level, 0.006, 1.1);
  o.connect(env).connect(g.sfxIn);
  const n = s.noise(t * 13);
  const lp = s.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2200, at);
  lp.frequency.exponentialRampToValueAtTime(300, at + 0.3);
  const ne = s.ctx.createGain();
  perc(ne.gain, at, 0.2 * level, 0.002, 0.35);
  n.connect(lp).connect(ne).connect(g.sfxIn);
  const send = s.ctx.createGain();
  send.gain.value = 0.8;
  ne.connect(send).connect(g.sfxVerb);
  s.start(o, at, at + 1.2);
  s.start(n, at, at + 0.4);
}

// ---------------------------------------------------------------------------
// Partition.

export const CHORDS: Record<string, { bass: number; pad: number[] }> = {
  F: { bass: 41, pad: [57, 60, 64, 67] }, // Fmaj9
  Dm: { bass: 38, pad: [53, 57, 60, 64] }, // Dm9
  Bb: { bass: 34, pad: [50, 53, 57, 60] }, // Bbmaj7
  C: { bass: 36, pad: [52, 55, 60, 62] }, // Cadd9
};
const SLOT = BEAT * 8; // 2 mesures par accord
const PROGRESSION = ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'F'];
const chordAt = (t: number) => CHORDS[PROGRESSION[Math.min(PROGRESSION.length - 1, Math.floor(t / SLOT))]];

function scheduleMusic(s: Sched, g: Graph) {
  const M = CUES.music;
  // Nappes
  PROGRESSION.forEach((name, i) => {
    const start = i * SLOT;
    const breakdown = start >= M.dropOut - 0.5 && start < M.return - 0.5;
    const dur = i === PROGRESSION.length - 1 ? VIDEO.duration - start : SLOT;
    pad(s, g, start, dur, CHORDS[name].pad, breakdown ? 900 : 1700, i === 0 ? 0.9 : 1);
  });

  const totalEighths = Math.ceil(VIDEO.duration / EIGHTH);
  for (let k = 0; k < totalEighths; k++) {
    const t = k * EIGHTH;
    const beat = k / 2;
    const onBeat = k % 2 === 0;
    const chord = chordAt(t);
    const groove = t >= CUES.chatgpt.logoIn - 0.01 && t < M.dropOut - 0.01;
    const full = t >= CUES.gemini.logoIn - 0.01 && t < M.dropOut - 0.01;
    const outro = t >= M.return - 0.01 && t < M.fadeOutStart;

    // Intro : arpège clairsemé après le chime
    if (t >= CUES.intro.morphEnd && t < CUES.chatgpt.logoIn - 0.01 && onBeat) {
      pluck(s, g, t, chord.pad[(beat % 4) | 0] + 12, 0.5, beat % 2 ? 0.3 : -0.3);
    }
    if (groove) {
      const seq = [0, 1, 2, 3, 2, 1, 3, 2];
      pluck(s, g, t, chord.pad[seq[k % 8]] + 12, onBeat ? 0.9 : 0.6, k % 2 ? 0.32 : -0.32);
      if (!onBeat) {
        hat(s, g, t, 1, k);
        bass(s, g, t, chord.bass + 12, EIGHTH * 0.92);
      }
      if (full) {
        if (onBeat) kick(s, g, t);
        if (onBeat && (beat % 4 === 1 || beat % 4 === 3)) rim(s, g, t, k);
        if (t >= CUES.claude.gather) hat(s, g, t + EIGHTH / 2, 0.45, k + 900);
      } else if (onBeat && beat % 2 === 0) kick(s, g, t, 0.85);
    }
    // Pause (« TSAROVY! ») : quelques notes de cloche espacées
    if (t >= M.dropOut + BEAT && t < M.return - 0.01 && k % 4 === 0) {
      pluck(s, g, t, chord.pad[(k / 4) % 4] + 12, 0.35, ((k / 4) % 2 ? 0.25 : -0.25), 0.9);
    }
    if (outro && onBeat) {
      pluck(s, g, t, chord.pad[(beat % 4) | 0] + 12, 0.7 - (t - M.return) * 0.15, beat % 2 ? 0.3 : -0.3, 0.6);
      if (beat % 2 === 0 && t < M.return + 1.2) bass(s, g, t, chord.bass + 12, BEAT * 1.6, 0.8);
    }
  }
  kick(s, g, M.return, 1.1);
  riser(s, g, M.dropOut - 1.1, M.dropOut, 0.05);
  riser(s, g, CUES.tip.darkIn - 1.1, CUES.tip.darkIn + 0.05, 0.045);
}

/** Courbe de gain structurelle de la musique (baisse pendant le conseil, fondu final). */
function automateMusicBus(s: Sched, g: Graph) {
  const p = g.musicBus.gain;
  const M = CUES.music;
  const pts: [number, number][] = [
    [0, 1],
    [M.dropOut, 1],
    [CUES.tip.impact - 0.05, 0.55],
    [CUES.tip.darkIn, 0.55],
    [M.return, 1],
    [M.fadeOutStart, 1],
    [VIDEO.duration, 0.0001],
  ];
  const valueAt = (t: number) => {
    for (let i = 1; i < pts.length; i++) {
      if (t <= pts[i][0]) {
        const [t0, v0] = pts[i - 1];
        const [t1, v1] = pts[i];
        return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
      }
    }
    return pts[pts.length - 1][1];
  };
  p.cancelScheduledValues(0);
  p.setValueAtTime(valueAt(s.from), s.when);
  for (const [t, v] of pts) if (t > s.from) p.linearRampToValueAtTime(v, s.when + (t - s.from));
}

/** Niveau de ducking (0–1) sous la voix off à l'instant t. */
export function duckLevel(t: number, cues: VoiceCue[] | undefined, depth = 0.38) {
  if (!cues?.length) return 1;
  let level = 1;
  for (const c of cues) {
    const a = c.start - 0.2;
    const b = c.end + 0.35;
    if (t >= a - 0.25 && t <= b + 0.4) {
      const fadeIn = Math.min(1, (t - (a - 0.25)) / 0.25);
      const fadeOut = Math.min(1, (b + 0.4 - t) / 0.4);
      level = Math.min(level, 1 - (1 - depth) * Math.max(0, Math.min(fadeIn, fadeOut)));
    }
  }
  return level;
}

export function automateDuck(s: Sched, g: Graph, cues?: VoiceCue[]) {
  const p = g.duck.gain;
  p.cancelScheduledValues(0);
  p.setValueAtTime(duckLevel(s.from, cues), s.when);
  if (!cues?.length) return;
  for (let t = Math.ceil(s.from * 20) / 20; t <= VIDEO.duration; t += 0.05) {
    p.linearRampToValueAtTime(duckLevel(t, cues), s.when + (t - s.from));
  }
}

function scheduleSfx(s: Sched, g: Graph) {
  const I = CUES.intro, C = CUES.chatgpt, G = CUES.gemini, L = CUES.claude, V = CUES.canva, T = CUES.tip, B = CUES.brand;
  // Scène 1
  whoosh(s, g, I.whoosh, 1.3, 0.6);
  sparkle(s, g, I.converge + 0.35, 0.35, 4);
  [84, 88, 91, 96].forEach((n, i) => bell(s, g, I.morphEnd + i * 0.07, n, 0.9 - i * 0.12, 1.4, (i - 1.5) * 0.25));
  tone(s, g, I.morphEnd, [53, 65], 0.5, 0.02, 1.6);
  whoosh(s, g, I.maskStart, 0.75, 1);
  // Scène 2 — ChatGPT
  pop(s, g, C.logoIn);
  click(s, g, C.titleIn, 0.6, 1800);
  C.chips.forEach((t, i) => click(s, g, t, 0.9, 2200 + i * 260));
  whoosh(s, g, C.shift - 0.05, 0.6, 0.55, -1);
  typing(s, g, C.typingStart, C.typingEnd);
  pop(s, g, C.send, 0.8);
  whoosh(s, g, C.send, 0.35, 0.35);
  pop(s, g, C.replyTitle, 0.6);
  C.items.forEach((t, i) => click(s, g, t, 0.85, 2000 + i * 300));
  // Transition lumineuse vers Gemini
  whoosh(s, g, C.flashPeak - 0.55, 0.8, 0.7);
  sparkle(s, g, G.logoIn, 1, 8);
  // Scène 3 — Gemini
  click(s, g, G.titleIn, 0.6, 1800);
  G.chips.forEach((t, i) => click(s, g, t, 0.9, 2300 + i * 300));
  whoosh(s, g, G.shift - 0.05, 0.6, 0.5, -1);
  typing(s, g, G.typingStart, G.typingEnd, 0.8);
  bell(s, g, G.notify, 84, 0.7, 0.5, -0.1);
  bell(s, g, G.notify + 0.11, 89, 0.7, 0.7, 0.1);
  G.cards.forEach((t, i) => click(s, g, t, 0.9, 2100 + i * 250));
  tone(s, g, G.out - 0.2, [65, 72], 0.25, 0.4, 1.2); // nappe de transition
  // Scène 4 — Claude
  L.swipes.forEach((t, i) => paper(s, g, t, 0.9 - i * 0.1));
  pop(s, g, L.logoIn, 0.9);
  click(s, g, L.titleIn, 0.5, 1700);
  whoosh(s, g, L.scanStart, (L.scanEnd - L.scanStart) * 1.1, 0.35);
  click(s, g, L.condense, 0.9, 2400);
  pop(s, g, L.summaryPop, 0.7);
  whoosh(s, g, L.morph, 0.8, 0.9, -1);
  // Canva AI
  sparkle(s, g, V.settle, 0.6, 5);
  click(s, g, V.titleIn, 0.5, 1700);
  sparkle(s, g, V.artboardIn, 0.8, 6);
  V.elements.forEach((t, i) => click(s, g, t, 0.95, 1900 + (i % 3) * 350));
  whoosh(s, g, V.fadeOut, 1.1, 0.4);
  // Scène 5 — Conseil
  impact(s, g, T.impact);
  click(s, g, T.line1In, 0.4, 1500);
  tone(s, g, T.check, [69, 76], 1, 0.06, 1.4); // attention tone
  bell(s, g, T.check + 0.42, 89, 0.5, 0.8);
  impact(s, g, T.conclusionIn, 0.35);
  tone(s, g, T.conclusionIn, [57, 64, 69], 0.5, 0.5, 2.2);
  whoosh(s, g, T.darkIn, 0.8, 0.9);
  // Scène 6 — Signature DigitalSub
  [77, 81, 84, 89, 93].forEach((n, i) => bell(s, g, B.logoIn + i * 0.085, n, 1 - i * 0.08, 1.6, (i - 2) * 0.22, 0.8));
  tone(s, g, B.logoIn, [41, 53], 0.9, 0.01, 2.2);
  sparkle(s, g, B.shine, 0.5, 5);
  click(s, g, B.contactIn, 0.8, 2100);
  [89, 96, 93].forEach((n, i) => bell(s, g, B.outroChime + i * 0.14, n, 0.65, 2.2, (i - 1) * 0.3, 0.9));
}

/** Programme toute la bande-son à partir de `from` ; retourne les sources pour pouvoir les arrêter. */
export function scheduleSoundtrack(ctx: Ctx, g: Graph, opts: ScheduleOptions) {
  const s = new Sched(ctx, opts.from ?? 0, opts.when, opts.window?.start, opts.window?.end);
  if (opts.music !== false) {
    scheduleMusic(s, g);
    if (s.first) automateMusicBus(s, g);
  }
  if (s.first) automateDuck(s, g, opts.voiceCues);
  if (opts.sfx !== false) scheduleSfx(s, g);
  return s.sources;
}

// ---------------------------------------------------------------------------
// Export hors ligne (utilisé par scripts/render-soundtrack.mjs dans Chromium headless).

export type Scheduler = (ctx: Ctx, g: Graph, opts: ScheduleOptions) => AudioScheduledSourceNode[];

export async function renderStem(kind: 'music' | 'sfx' | 'mix', schedule: Scheduler = scheduleSoundtrack, sampleRate = 48000) {
  const ctx = new OfflineAudioContext(2, Math.ceil(VIDEO.duration * sampleRate), sampleRate);
  const g = createGraph(ctx);
  schedule(ctx, g, { from: 0, when: 0, music: kind !== 'sfx', sfx: kind !== 'music' });
  const buffer = await ctx.startRendering();
  return encodeWav(buffer);
}

export function encodeWav(buffer: AudioBuffer) {
  const ch = buffer.numberOfChannels;
  const len = buffer.length;
  const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const w = (o: number, str: string) => [...str].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  data.setUint32(4, 36 + len * ch * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, ch, true);
  data.setUint32(24, buffer.sampleRate, true);
  data.setUint32(28, buffer.sampleRate * ch * 2, true);
  data.setUint16(32, ch * 2, true);
  data.setUint16(34, 16, true);
  w(36, 'data');
  data.setUint32(40, len * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, c) => buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, chans[c][i]));
      data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  }
  return new Uint8Array(data.buffer);
}
