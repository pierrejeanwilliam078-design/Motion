// Lecture audio en direct, synchronisée sur l'horloge du contexte audio.
import { createGraph, scheduleSoundtrack, type Graph } from '../audio/soundtrack';
import type { VoiceCue } from '../timeline';

export type LiveOptions = { synthMusic: boolean; sfx: boolean; voiceCues: VoiceCue[] };

type MediaSlot = { el: HTMLAudioElement; node: MediaElementAudioSourceNode | null; url: string };

export class LiveAudio {
  ctx: AudioContext | null = null;
  graph: Graph | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private anchorCtx = 0;
  private anchorT = 0;
  private timers: number[] = [];
  running = false;
  muted = false;
  voice: MediaSlot | null = null;
  music: MediaSlot | null = null;
  speechVoice: SpeechSynthesisVoice | null = null;
  useSpeech = false;

  /** Doit être appelé dans un geste utilisateur (clic) : les navigateurs bloquent l'audio automatique. */
  async unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: 'interactive' });
      this.graph = createGraph(this.ctx);
      this.graph.master.gain.value = this.muted ? 0 : 1;
      this.attach(this.voice, 'voice');
      this.attach(this.music, 'music');
    }
    if (this.ctx.state !== 'running') await this.ctx.resume();
    return this.ctx.state === 'running';
  }

  get unlocked() {
    return this.ctx?.state === 'running';
  }

  private attach(slot: MediaSlot | null, kind: 'voice' | 'music') {
    if (!slot || !this.ctx || !this.graph || slot.node) return;
    slot.node = this.ctx.createMediaElementSource(slot.el);
    slot.node.connect(kind === 'voice' ? this.graph.master : this.graph.musicBus);
  }

  setMedia(kind: 'voice' | 'music', file: File | null) {
    const prev = this[kind];
    if (prev) {
      prev.el.pause();
      prev.node?.disconnect();
      URL.revokeObjectURL(prev.url);
    }
    if (!file) {
      this[kind] = null;
      return;
    }
    const url = URL.createObjectURL(file);
    const el = new Audio(url);
    el.preload = 'auto';
    this[kind] = { el, node: null, url };
    this.attach(this[kind], kind);
  }

  play(from: number, opts: LiveOptions) {
    if (!this.ctx || !this.graph || this.ctx.state !== 'running') return false;
    this.stop();
    const when = this.ctx.currentTime + 0.08;
    const hasVoice = !!this.voice || (this.useSpeech && !!this.speechVoice);
    this.sources = scheduleSoundtrack(this.ctx, this.graph, {
      from,
      when,
      music: opts.synthMusic && !this.music,
      sfx: opts.sfx,
      voiceCues: hasVoice ? opts.voiceCues : undefined,
    });
    this.anchorCtx = when;
    this.anchorT = from;
    this.running = true;
    for (const slot of [this.voice, this.music]) {
      if (!slot) continue;
      slot.el.currentTime = from;
      this.timers.push(window.setTimeout(() => void slot.el.play().catch(() => undefined), 80));
    }
    if (this.useSpeech && this.speechVoice && !this.voice) this.scheduleSpeech(from, opts.voiceCues);
    return true;
  }

  /** Synthèse vocale du navigateur, uniquement si une voix malgache (mg) est installée. */
  private scheduleSpeech(from: number, cues: VoiceCue[]) {
    speechSynthesis.cancel();
    for (const cue of cues) {
      if (cue.start < from) continue;
      this.timers.push(
        window.setTimeout(() => {
          const u = new SpeechSynthesisUtterance(cue.text);
          u.voice = this.speechVoice;
          u.lang = this.speechVoice?.lang ?? 'mg-MG';
          u.volume = this.muted ? 0 : 1;
          speechSynthesis.speak(u);
        }, (cue.start - from) * 1000 + 80),
      );
    }
  }

  stop() {
    for (const s of this.sources) {
      try {
        s.stop(0);
      } catch {
        /* source déjà arrêtée */
      }
    }
    this.sources = [];
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    this.voice?.el.pause();
    this.music?.el.pause();
    if (this.graph && this.ctx) {
      const now = this.ctx.currentTime;
      for (const p of [this.graph.musicBus.gain, this.graph.duck.gain]) {
        p.cancelScheduledValues(0);
        p.setValueAtTime(1, now);
      }
    }
    this.running = false;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.graph && this.ctx) this.graph.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.015);
  }

  /** Temps de la timeline d'après l'horloge audio (null si l'audio ne pilote pas la lecture). */
  time() {
    if (!this.running || !this.ctx) return null;
    const latency = (this.ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0;
    return Math.max(this.anchorT, this.anchorT + (this.ctx.currentTime - this.anchorCtx) - latency);
  }
}

export function findMalagasyVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('mg')) ?? null;
}
