# DigitalSub — « IA amin'ny fiainana andavanandro »

Motion design publicitaire de 35 secondes, au format vertical 9:16 (1080 × 1920, 30 fps), avec un sound design synchronisé. Le film montre comment utiliser l'IA au quotidien avec ChatGPT, Gemini, Claude et Canva AI, puis rappelle de toujours vérifier les réponses.

- **Vidéo rendue** : `out/digitalsub-ia-35s.mp4` (H.264 yuv420p, AAC 48 kHz)
- **Aperçu interactif** : `npm run dev`, ou le fichier autonome `artifact/digitalsub-motion.html`
- **Bande-son** : `public/audio/music.wav`, `sfx.wav` et `mix.wav`, 100 % synthétisée, donc libre de droits

## Architecture

Chaque image est une **fonction pure du temps** `t` (en secondes) : `src/Ad.tsx`. Le même code React/SVG est utilisé à deux endroits :

| Usage | Horloge | Fichier |
| --- | --- | --- |
| Aperçu navigateur (lecture, pause, timeline) | `AudioContext.currentTime`, sinon `performance.now()` | `src/preview/App.tsx` |
| Rendu MP4 image par image | `t = frame / 30` | `src/remotion/Root.tsx` |

Le sound design (`src/audio/soundtrack.ts`, Web Audio API) suit le même principe. Il joue en direct dans l'aperçu et il est rendu hors ligne en WAV (`OfflineAudioContext`) pour la vidéo. Animations et sons lisent les mêmes repères dans `src/timeline.ts`. Ces repères sont calés sur la grille de croches de la musique (108 BPM), ce qui assure une synchronisation identique entre l'aperçu et le MP4.

Les animations ne dépendent d'aucune bibliothèque d'animation à état interne (Framer Motion, transitions CSS). Ce choix garantit un rendu identique à chaque image, une timeline navigable dans les deux sens et un export Remotion exact. Les ressorts (*springs*), les courbes de Bézier et le morphing SVG sont implémentés dans `src/lib/motion.ts` et `src/scenes/Intro.tsx`.

```
src/
  timeline.ts          repères temporels (scènes, BPM, événements)
  content.json         tous les textes malgaches + script de voix off
  Ad.tsx               composition complète
  scenes/              Intro, Tools (ChatGPT, Gemini), ClaudeCanva, Tip, Brand
  components/          typographie cinétique, logos, fond
  audio/soundtrack.ts  musique + effets (Web Audio)
  preview/             lecteur interactif
  remotion/            composition Remotion pour l'export MP4
scripts/
  render-soundtrack.mjs  bande-son → WAV (Chromium headless)
  build-artifact.mjs     aperçu → fichier HTML autonome
```

## Commandes

```bash
npm install
npm run dev        # aperçu interactif sur http://localhost:5173
npm run audio      # régénère public/audio/{music,sfx,mix}.wav
npm run render     # exporte out/digitalsub-ia-35s.mp4
npm run studio     # Remotion Studio, pour retoucher image par image
npm run still -- out/frame.png --frame=300   # une image fixe
npm run artifact   # régénère artifact/digitalsub-motion.html
```

Remotion télécharge automatiquement Chrome Headless Shell au premier rendu. Pour utiliser un navigateur déjà installé, définir `REMOTION_BROWSER=/chemin/vers/chrome`.

## Personnaliser

- **Textes** : modifier `src/content.json`. Dans l'aperçu, l'onglet « Textes » permet de les modifier en direct, puis « Copier le JSON » fournit le contenu à coller dans ce fichier.
- **Logo** : remplacer `src/assets/digitalsub-logo.png` (logo complet, fond transparent) et `src/assets/digitalsub-icon.png` (symbole seul). Le logo d'origine utilise un logotype « DIGITAL » blanc ; il est donc présenté sur fond nuit à la scène 6.
- **Musique** : déposer `public/audio/music-custom.mp3` (ou `.wav`) ; elle remplace la musique synthétisée lors du rendu.
- **Voix off** : déposer `public/audio/voiceover.mp3` (ou `.wav`), synchronisée à partir de 0 s. La musique baisse automatiquement pendant les répliques (*ducking*), selon les plages définies dans `content.json` → `voiceover`.
- **Numéro WhatsApp** : `brand.whatsappNumber` dans `content.json` (vide par défaut : seul « Mifandraisa aminay » s'affiche).
- **Logos des outils** : les tracés proviennent de [Simple Icons](https://simpleicons.org) (`src/brand-paths.ts`). Pour une diffusion commerciale, vérifier les chartes d'utilisation des marques OpenAI, Google, Anthropic et Canva.

## Voix off en malagasy

Aucune synthèse vocale malgache fiable n'est disponible dans les navigateurs courants ni dans les services TTS grand public. La narration n'est donc pas remplacée par une autre langue. Le script ci-dessous, avec ses plages de temps, est prévu pour un enregistrement. Il doit être relu par une personne de langue maternelle malgache avant l'enregistrement.

| Temps | Texte |
| --- | --- |
| 0,5 – 3,7 s | Fantatrao ve fa afaka manampy anao isan'andro ny IA? |
| 4,4 – 9,4 s | Amin'ny ChatGPT dia afaka manoratra hafatra, mandamina ny asanao ary mianatra ianao. |
| 10,3 – 15,2 s | Ny Gemini kosa dia manampy anao amin'ny fikarohana sy ny fanazavana lesona. |
| 16,5 – 19,4 s | Ny Claude dia mamintina sy mandinika lahatsoratra. |
| 20,4 – 23,2 s | Ary ny Canva AI dia mamorona visuel ho anao. |
| 24,4 – 30,4 s | Tsarovy! Tsy marina foana izay avoakan'ny IA. Hamarino sy diniho aloha! Fitaovana ny IA, fa tsy misolo ny fisainanao. |
| 31,4 – 34,4 s | DigitalSub: ampiasao amim-pahendrena ny IA. Mifandraisa aminay! |

Si le navigateur dispose d'une voix malgache (`mg`), l'aperçu propose de l'utiliser. Sinon, il l'indique clairement.

## Storyboard

| Scène | Temps | Contenu | Sons |
| --- | --- | --- | --- |
| 1. Intro | 0 – 4 s | Particules → morphing des lettres « IA », titre et question | whoosh, chime, début de la musique |
| 2. ChatGPT | 4 – 10 s | Logo en rotation 3D, usages, conversation qui se compose | pop, clics, frappe clavier |
| 3. Gemini | 10 – 16 s | Transition lumineuse, halo, recherche, cartes successives | sparkle, notification |
| 4. Claude + Canva AI | 16 – 24 s | Feuilles qui se regroupent, analyse, résumé → morphing en logo Canva, affiche construite en rythme | papier, clics sur le temps |
| 5. Tsarovy | 24 – 31 s | Interfaces effacées, typographie cinétique, coche de vérification | baisse de la musique, impact, tonalité d'attention |
| 6. DigitalSub | 31 – 35 s | Logo d'origine, reflet lumineux, signature, barre WhatsApp, fondu | signature sonore, chime final |
