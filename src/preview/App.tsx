import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ad } from '../Ad';
import { Ad2 } from '../v2/Ad2';
import { scheduleSoundtrack } from '../audio/soundtrack';
import { scheduleSoundtrackV2 } from '../v2/soundtrack2';
import { DEFAULT_ASSETS, DEFAULT_CONTENT } from '../defaults';
import { SCENES, VIDEO } from '../timeline';
import type { Assets, Content } from '../scenes/types';
import { LiveAudio, findMalagasyVoice } from './liveAudio';

type Field = { path: string; label: string; list?: boolean };

const FIELDS: { group: string; fields: Field[] }[] = [
  { group: 'Scène 1 — Intro', fields: [
    { path: 'intro.title', label: 'Titre (après « IA »)' },
    { path: 'intro.subtitle', label: 'Sous-texte' },
  ] },
  { group: 'Scène 2 — ChatGPT', fields: [
    { path: 'chatgpt.uses', label: 'Usages', list: true },
    { path: 'chatgpt.prompt', label: 'Message tapé' },
    { path: 'chatgpt.replyTitle', label: 'Titre de la réponse' },
    { path: 'chatgpt.replyItems', label: 'Lignes de la réponse', list: true },
  ] },
  { group: 'Scène 3 — Gemini', fields: [
    { path: 'gemini.uses', label: 'Usages', list: true },
    { path: 'gemini.query', label: 'Recherche tapée' },
    { path: 'gemini.results', label: 'Cartes de résultats', list: true },
  ] },
  { group: 'Scène 4 — Claude + Canva AI', fields: [
    { path: 'claude.text', label: 'Claude — description' },
    { path: 'claude.summaryLabel', label: 'Claude — étiquette du résumé' },
    { path: 'canva.text', label: 'Canva AI — description' },
    { path: 'canva.posterTitle', label: 'Titre de l’affiche' },
  ] },
  { group: 'Scène 5 — Conseil', fields: [
    { path: 'tip.remember', label: 'Mot d’impact' },
    { path: 'tip.line1', label: 'Phrase 1' },
    { path: 'tip.line1Emphasis', label: 'Mots mis en valeur (phrase 1)', list: true },
    { path: 'tip.line2', label: 'Phrase 2' },
    { path: 'tip.line2Emphasis', label: 'Mots mis en valeur (phrase 2)', list: true },
    { path: 'tip.conclusion', label: 'Conclusion' },
    { path: 'tip.conclusionEmphasis', label: 'Mots mis en valeur (conclusion)', list: true },
  ] },
  { group: 'Scène 6 — DigitalSub', fields: [
    { path: 'brand.tagline', label: 'Signature' },
    { path: 'brand.contact', label: 'Texte WhatsApp' },
    { path: 'brand.whatsappNumber', label: 'Numéro WhatsApp (facultatif)' },
  ] },
];

const getAt = (obj: unknown, path: string) => path.split('.').reduce<any>((o, k) => o?.[k], obj);
function setAt<T>(obj: T, path: string, value: unknown): T {
  const copy = structuredClone(obj);
  const keys = path.split('.');
  let o: any = copy;
  keys.slice(0, -1).forEach((k) => (o = o[k]));
  o[keys[keys.length - 1]] = value;
  return copy;
}

const fmt = (t: number) => `${t.toFixed(1).padStart(4, '0')} s`;

export function App() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT);
  const [assets, setAssets] = useState<Assets>(DEFAULT_ASSETS);
  const [synthMusic, setSynthMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [tab, setTab] = useState<'texts' | 'media' | 'export'>('texts');
  const [mgVoice, setMgVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [useSpeech, setUseSpeech] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [musicName, setMusicName] = useState('');
  const [copied, setCopied] = useState('');
  const [scale, setScale] = useState(0.3);
  const [version, setVersion] = useState<1 | 2>(2);

  const audio = useMemo(() => new LiveAudio(), []);
  const clock = useRef({ t: 0, perf: 0, playing: false });
  const wrapRef = useRef<HTMLDivElement>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  // Mise à l'échelle de la scène 1080 × 1920 dans le cadre d'aperçu
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / VIDEO.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setMgVoice(findMalagasyVoice());
    update();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener?.('voiceschanged', update);
    return () => {
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.removeEventListener?.('voiceschanged', update);
    };
  }, []);

  const opts = useCallback(
    () => ({ synthMusic, sfx, voiceCues: content.voiceover, schedule: version === 2 ? scheduleSoundtrackV2 : scheduleSoundtrack }),
    [synthMusic, sfx, content.voiceover, version],
  );

  const startAt = useCallback(
    (from: number) => {
      const f = from >= VIDEO.duration - 0.05 ? 0 : from;
      clock.current = { t: f, perf: performance.now(), playing: true };
      if (soundOn) audio.play(f, opts());
      setT(f);
      setPlaying(true);
    },
    [audio, opts, soundOn],
  );

  const pause = useCallback(() => {
    const now = audio.time() ?? clock.current.t + (performance.now() - clock.current.perf) / 1000;
    audio.stop();
    clock.current = { t: Math.min(now, VIDEO.duration), perf: performance.now(), playing: false };
    setT(clock.current.t);
    setPlaying(false);
  }, [audio]);

  // Boucle d'animation : l'horloge audio pilote l'image quand le son est actif
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const c = clock.current;
      const now = audio.time() ?? c.t + (performance.now() - c.perf) / 1000;
      if (now >= VIDEO.duration) {
        audio.stop();
        clock.current = { t: VIDEO.duration, perf: performance.now(), playing: false };
        setT(VIDEO.duration);
        setPlaying(false);
        return;
      }
      setT(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, audio]);

  const playWithSound = async () => {
    const ok = await audio.unlock();
    audio.setMuted(false);
    setMuted(false);
    setSoundOn(ok);
    setStarted(true);
    clock.current = { t: 0, perf: performance.now(), playing: true };
    if (ok) audio.play(0, opts());
    setT(0);
    setPlaying(true);
  };

  const playMuted = () => {
    setStarted(true);
    startAt(0);
  };

  const togglePlay = async () => {
    if (!started) return playWithSound();
    if (playing) return pause();
    startAt(t);
  };

  const restart = () => {
    audio.stop();
    setStarted(true);
    startAt(0);
  };

  const toggleSound = async () => {
    if (!soundOn || !audio.unlocked) {
      const ok = await audio.unlock();
      setSoundOn(ok);
      audio.setMuted(false);
      setMuted(false);
      if (ok && playing) {
        const now = clock.current.t + (performance.now() - clock.current.perf) / 1000;
        audio.play(now, opts());
      }
      return;
    }
    audio.setMuted(!muted);
    setMuted(!muted);
  };

  const seek = (to: number) => {
    const v = Math.max(0, Math.min(VIDEO.duration, to));
    if (playing) {
      audio.stop();
      startAt(v);
    } else {
      clock.current = { t: v, perf: performance.now(), playing: false };
      setT(v);
    }
  };

  // Les réglages audio s'appliquent immédiatement pendant la lecture
  const relaunchAudio = () => {
    if (playing && soundOn) {
      const now = audio.time() ?? t;
      clock.current = { t: now, perf: performance.now(), playing: true };
      audio.play(now, opts());
    }
  };
  useEffect(relaunchAudio, [synthMusic, sfx, useSpeech, version]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.code === 'Space') {
        e.preventDefault();
        void togglePlay();
      } else if (e.code === 'ArrowRight') seek(t + 1);
      else if (e.code === 'ArrowLeft') seek(t - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onTimelinePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * VIDEO.duration);
  };

  const pickImage = (key: keyof Assets) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAssets((a) => ({ ...a, [key]: String(reader.result) }));
    reader.readAsDataURL(f);
  };

  const pickAudio = (kind: 'voice' | 'music') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    audio.setMedia(kind, f);
    (kind === 'voice' ? setVoiceName : setMusicName)(f?.name ?? '');
    e.target.value = '';
    relaunchAudio();
  };

  const clearAudio = (kind: 'voice' | 'music') => {
    audio.setMedia(kind, null);
    (kind === 'voice' ? setVoiceName : setMusicName)('');
    relaunchAudio();
  };

  const json = JSON.stringify(content, null, 2);
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied('JSON copié. Collez-le dans src/content.json.');
    } catch {
      jsonRef.current?.select();
      setCopied('Copie bloquée : le texte est sélectionné, utilisez Ctrl/Cmd + C.');
    }
  };

  const scene = SCENES.find((s) => t >= s.start && t < s.end) ?? SCENES[SCENES.length - 1];

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <img src={assets.icon} alt="" width={28} height={28} />
          <span className="brand-name">DigitalSub</span>
          <span className="sep">/</span>
          <span>IA amin'ny fiainana andavanandro</span>
        </div>
        <div className="top-right">
          <div className="versions" role="radiogroup" aria-label="Version">
            {([2, 1] as const).map((v) => (
              <button key={v} id={`version-${v}`} role="radio" aria-checked={version === v} className={version === v ? 'active' : ''} onClick={() => setVersion(v)}>
                {v === 2 ? 'V2 · dynamique' : 'V1 · épurée'}
              </button>
            ))}
          </div>
          <div className="specs">35 s · 1080 × 1920 · 30 fps · {version === 2 ? '114' : '108'} BPM</div>
        </div>
      </header>

      <main className="layout">
        <section className="player" aria-label="Aperçu de la vidéo">
          <div className="stage-wrap" ref={wrapRef}>
            <div className="stage" style={{ transform: `scale(${scale})` }}>
              {version === 2 ? <Ad2 t={t} content={content} assets={assets} /> : <Ad t={t} content={content} assets={assets} />}
            </div>
            {!started && (
              <div className="start">
                <button id="play-sound" className="btn-primary" onClick={() => void playWithSound()}>
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
                  Play avec son
                </button>
                <button id="play-muted" className="btn-ghost" onClick={playMuted}>Lecture sans son</button>
                <p className="hint">Le navigateur n’active le son qu’après un clic.</p>
              </div>
            )}
          </div>

          <div className="transport">
            <button id="toggle-play" className="icon-btn" onClick={() => void togglePlay()} aria-label={playing ? 'Pause' : 'Lecture'} title={playing ? 'Pause (espace)' : 'Lecture (espace)'}>
              {playing ? (
                <svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
              )}
            </button>
            <button id="restart" className="icon-btn" onClick={restart} aria-label="Recommencer" title="Recommencer">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 0 2.6-5.9" /><path d="M4 4v4.5h4.5" /></svg>
            </button>
            <button id="toggle-sound" className={`icon-btn ${soundOn && !muted ? 'on' : ''}`} onClick={() => void toggleSound()} aria-label={soundOn && !muted ? 'Couper le son' : 'Activer le son'} title={soundOn && !muted ? 'Couper le son' : 'Activer le son'}>
              {soundOn && !muted ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></svg>
              )}
            </button>
            <div className="time" aria-live="off">
              <span>{fmt(Math.min(t, VIDEO.duration))}</span>
              <span className="muted"> / {VIDEO.duration.toFixed(1)} s</span>
            </div>
            <div className="scene-name">{scene.label}</div>
          </div>

          <div
            className="timeline"
            role="slider"
            tabIndex={0}
            aria-label="Position dans la vidéo"
            aria-valuemin={0}
            aria-valuemax={VIDEO.duration}
            aria-valuenow={Number(t.toFixed(1))}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onTimelinePointer(e);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) onTimelinePointer(e);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') seek(t + 0.5);
              if (e.key === 'ArrowLeft') seek(t - 0.5);
            }}
          >
            {SCENES.map((s) => (
              <div key={s.id} className={`seg ${scene.id === s.id ? 'active' : ''}`} style={{ left: `${(s.start / VIDEO.duration) * 100}%`, width: `${((s.end - s.start) / VIDEO.duration) * 100}%` }}>
                <span>{s.label}</span>
              </div>
            ))}
            <div className="fill" style={{ width: `${(t / VIDEO.duration) * 100}%` }} />
            <div className="head" style={{ left: `${(t / VIDEO.duration) * 100}%` }} />
          </div>
          <div className="ticks">
            {SCENES.map((s) => (
              <span key={s.id} style={{ left: `${(s.start / VIDEO.duration) * 100}%` }}>{s.start}s</span>
            ))}
            <span style={{ left: '100%' }}>35s</span>
          </div>
        </section>

        <aside className="panel">
          <div className="tabs" role="tablist">
            {(
              [
                ['texts', 'Textes'],
                ['media', 'Logo & audio'],
                ['export', 'Export MP4'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'texts' && (
            <div className="tab-body">
              <p className="note">Les modifications s’affichent en direct. Les listes se séparent par « | ».</p>
              {FIELDS.map((g) => (
                <fieldset key={g.group}>
                  <legend>{g.group}</legend>
                  {g.fields.map((f) => {
                    const v = getAt(content, f.path);
                    const id = `f-${f.path.replace(/\./g, '-')}`;
                    return (
                      <label key={f.path} htmlFor={id}>
                        <span>{f.label}</span>
                        <input
                          id={id}
                          value={f.list ? (v as string[]).join(' | ') : (v as string)}
                          onChange={(e) =>
                            setContent((c) =>
                              setAt(c, f.path, f.list ? e.target.value.split('|').map((s) => s.trim()).filter(Boolean) : e.target.value),
                            )
                          }
                        />
                      </label>
                    );
                  })}
                </fieldset>
              ))}
              <div className="row">
                <button id="copy-json" className="btn-small" onClick={() => void copyJson()}>Copier le JSON</button>
                <button id="reset-texts" className="btn-small ghost" onClick={() => setContent(DEFAULT_CONTENT)}>Réinitialiser</button>
              </div>
              {copied && <p className="note ok">{copied}</p>}
              <textarea id="json-out" ref={jsonRef} readOnly value={json} rows={4} aria-label="Contenu JSON" />
            </div>
          )}

          {tab === 'media' && (
            <div className="tab-body">
              <fieldset>
                <legend>Logo</legend>
                <label htmlFor="logo-file"><span>Logo complet (PNG transparent ou SVG)</span><input id="logo-file" type="file" accept="image/png,image/svg+xml,image/webp" onChange={pickImage('logo')} /></label>
                <label htmlFor="icon-file"><span>Symbole seul (en-têtes)</span><input id="icon-file" type="file" accept="image/png,image/svg+xml,image/webp" onChange={pickImage('icon')} /></label>
                <button id="reset-logo" className="btn-small ghost" onClick={() => setAssets(DEFAULT_ASSETS)}>Logo d’origine</button>
              </fieldset>
              <fieldset>
                <legend>Bande-son</legend>
                <label className="check" htmlFor="synth-music"><input id="synth-music" type="checkbox" checked={synthMusic} onChange={(e) => setSynthMusic(e.target.checked)} /> Musique électronique synthétisée (108 BPM)</label>
                <label className="check" htmlFor="sfx-on"><input id="sfx-on" type="checkbox" checked={sfx} onChange={(e) => setSfx(e.target.checked)} /> Effets sonores synchronisés</label>
                <label htmlFor="music-file"><span>Remplacer la musique (MP3, WAV)</span><input id="music-file" type="file" accept="audio/*" onChange={pickAudio('music')} /></label>
                {musicName && <p className="note ok">Musique : {musicName} <button className="link" onClick={() => clearAudio('music')}>retirer</button></p>}
              </fieldset>
              <fieldset>
                <legend>Voix off malgache</legend>
                <label htmlFor="voice-file"><span>Piste enregistrée, démarrant à 0 s (MP3, WAV)</span><input id="voice-file" type="file" accept="audio/*" onChange={pickAudio('voice')} /></label>
                {voiceName && <p className="note ok">Voix : {voiceName} — la musique baisse sous la voix. <button className="link" onClick={() => clearAudio('voice')}>retirer</button></p>}
                {mgVoice ? (
                  <label className="check" htmlFor="speech-on">
                    <input id="speech-on" type="checkbox" checked={useSpeech} onChange={(e) => { audio.speechVoice = mgVoice; audio.useSpeech = e.target.checked; setUseSpeech(e.target.checked); }} /> Voix du navigateur : {mgVoice.name}
                  </label>
                ) : (
                  <p className="note">Aucune voix de synthèse malgache n’est installée dans ce navigateur. La narration n’est pas remplacée par une autre langue : importez un enregistrement.</p>
                )}
                <ol className="script">
                  {content.voiceover.map((c, i) => (
                    <li key={i}><span className="tc">{c.start.toFixed(1)}–{c.end.toFixed(1)} s</span>{c.text}</li>
                  ))}
                </ol>
              </fieldset>
            </div>
          )}

          {tab === 'export' && (
            <div className="tab-body">
              <p>L’export MP4 se fait avec Remotion depuis le dépôt : H.264, 1080 × 1920, 30 fps, AAC 48 kHz. Les images et le son proviennent du même code que cet aperçu.</p>
              <pre><code>{`npm install
npm run audio    # bande-son → public/audio/*.wav
npm run render     # V1 → out/digitalsub-ia-35s.mp4
npm run render:v2  # V2 → out/digitalsub-ia-35s-v2.mp4`}</code></pre>
              <p>Pour une voix off : placez <code>public/audio/voiceover.wav</code> (ou .mp3) puis relancez <code>npm run render</code>. La musique baisse automatiquement sous la voix.</p>
              <p>Pour retoucher image par image : <code>npm run studio</code> ouvre Remotion Studio.</p>
              <p className="note">Ce lecteur ne télécharge pas de fichier : l’environnement de l’aperçu bloque les téléchargements. Les deux vidéos MP4 déjà rendues sont livrées dans le dépôt, dossier <code>out/</code>.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
