# Miarina Media — Publicité motion design (Remotion)

Publicité de **55 s** pour [Miarina Media](https://media.miarina.org/) — *Your media. Your freedom.*
Projet **Remotion 4 + React + TypeScript** : chaque image est calculée à partir du temps, sans
aucune interaction réelle de souris. Trois versions sont prêtes à l'export :

| Composition | Format | Usage |
|---|---|---|
| `MiarinaAd` | 1920 × 1080, 16:9, 30 fps, sous-titres incrustés | YouTube, site, présentation |
| `MiarinaAd-SansSousTitres` | 1920 × 1080, sans sous-titres incrustés | À diffuser avec `subtitles/miarina-media-ad.fr.srt` |
| `MiarinaAd-Vertical` | 1080 × 1920, 9:16, sous-titres incrustés | Reels, Shorts, TikTok, Stories |

Le découpage détaillé des neuf scènes est dans **[TIMELINE.md](TIMELINE.md)**.

---

## 1. Lancer le projet

Prérequis : **Node.js 18 ou plus récent** (testé avec Node 22). Remotion télécharge automatiquement
son navigateur de rendu au premier lancement.

```bash
npm install
```

```bash
npm run dev
```

La commande ouvre **Remotion Studio** dans le navigateur (prévisualisation animée, lecture avec le
son, timeline scène par scène, choix de la composition dans la colonne de gauche).

## 2. Exporter en MP4 (H.264 + AAC)

```bash
npm run render
```

```bash
npm run render:clean
```

```bash
npm run render:vertical
```

Ou les trois à la suite :

```bash
npm run render:all
```

Les fichiers sont écrits dans `out/` (`miarina-media-ad-16x9.mp4`, `…-16x9-clean.mp4`, `…-9x16.mp4`).
Réglages : H.264, CRF 18, yuv420p, AAC 192 kb/s (voir `package.json` et `remotion.config.ts`).

Une image fixe (affiche / miniature, frame « GRATUIT ! ») :

```bash
npm run still
```

Pour utiliser un Chrome déjà installé plutôt que celui que télécharge Remotion :

```bash
REMOTION_BROWSER=/chemin/vers/chrome npm run render
```

## 3. Sous-titres

- **Incrustés et animés** dans `MiarinaAd` et `MiarinaAd-Vertical` : surlignage mot à mot synchronisé
  sur la voix (`src/components/Subtitles.tsx`).
- **Fichier SRT** : `subtitles/miarina-media-ad.fr.srt`, régénéré par :

```bash
npm run srt
```

Texte et horodatage : `src/data/captions.json` (temps relatifs au début du fichier de voix off).

## 4. Remplacer les éléments

Tout se règle dans **`src/config/assets.ts`** et **`src/data/timeline.json`**.

### Captures d'écran — `public/captures/`

| Fichier | Capture du brief | Scènes |
|---|---|---|
| `accueil.png` | Capture 2 — Accueil Windows | 2, 4, 7 |
| `telechargements.png` | Capture 5 — Downloads | 6 |
| `site-web.png` | Capture 1 — media.miarina.org | 9 |
| `navigateur.png` *(absent)* | Capture 4 — Navigateur intégré | 3 |

Les captures fournies ont seulement été **recadrées** (onglets du navigateur, page web en arrière-plan
et barre des tâches retirés), jamais redimensionnées ni retouchées. Les originaux sont conservés dans
`assets/captures-originales/`. Les titres des vidéos tierces visibles dans les captures sont
légèrement floutés (`redact` dans `assets.ts`) pour ne pas les mettre en avant.

- **Version plus nette** : une capture 2× (même cadrage) peut remplacer un fichier sans toucher aux
  coordonnées ; elles sont exprimées dans la taille logique (`width`/`height`).
- **Capture du navigateur intégré** : déposez `public/captures/navigateur.png`, puis renseignez dans
  `BROWSER` sa taille et les zones `addressBar`, `shortcuts` et `tiles` (positions de YouTube et
  Facebook). Tant que le fichier est absent, la scène 3 affiche une illustration simplifiée,
  étiquetée comme telle.
- **Capture manquante ou renommée** : la fenêtre affiche un cadre « Capture manquante » au lieu de
  faire échouer le rendu.

### Logo

Le logo est reconstitué en vectoriel d'après l'icône de l'application (`LogoMark` dans
`src/components/brand.tsx`). Pour utiliser le fichier officiel : déposez par exemple
`public/brand/logo.svg` et indiquez `LOGO_SRC = "brand/logo.svg"` dans `assets.ts`.

### Voix off — `public/audio/voix-off.mp3`

La voix fournie (ElevenLabs, « Léo ») est intégrée, **normalisée à −16 LUFS**. L'original non
modifié est dans `assets/audio-originale/`.

Pour la remplacer :

1. déposez le nouveau fichier sous `public/audio/voix-off.mp3` ;
2. ajustez `voiceover.offsetSeconds` dans `timeline.json` si besoin ;
3. si le texte ou le rythme changent, mettez à jour `src/data/captions.json` (texte + temps des mots)
   puis `npm run srt`. Les animations clés lisent ces mêmes temps (fonction `vo()`), mais les
   instants propres à chaque scène sont notés dans `src/scenes/S*.tsx` (appels `at(…)`).

Sans fichier de voix, la vidéo se rend quand même (piste muette).

### Musique et effets sonores — `public/audio/`

`musique.wav` et `sfx/*.wav` (clic, whoosh, pop, succès, impact) sont **synthétisés par
`scripts/generate-audio.py`** (numpy uniquement, aucun échantillon externe) : ce sont des créations
originales, donc libres de droits. La musique suit la timeline : intro, groove 120 BPM, coupure avant
« GRATUIT », drop exactement sur le mot, outro et fondu. Pour la régénérer après un changement des
repères `music` de `timeline.json` :

```bash
npm run audio
```

Une musique sous licence peut remplacer `musique.wav` (même nom, ou modifier `AUDIO.music`).
Le mixage se règle dans `MIX` (`assets.ts`) : la musique descend automatiquement sous la voix
(ducking calculé à partir des sous-titres). Les effets sont placés dans `timeline.json → sfx`.

### Polices

Inter (variable) et JetBrains Mono sont **embarquées via npm** (`@fontsource`) : aucun accès réseau
n'est nécessaire au rendu. Repli automatique sur Manrope, Segoe UI, Roboto ou Arial.

## 5. Structure

```
src/
  Root.tsx              compositions (16:9, 16:9 sans sous-titres, 9:16)
  MiarinaAd.tsx         assemblage : fond, 9 scènes, sous-titres, voix, musique, SFX
  theme.ts              palette, polices, easing, conversion temps → frames
  config/assets.ts      captures, zones cliquables, logo, audio, mixage
  data/timeline.json    scènes, repères musicaux, effets sonores
  data/captions.json    sous-titres horodatés mot à mot
  components/           caméra + fenêtre de capture, curseur, surlignages, logo,
                        titres cinétiques, sous-titres, icônes, transitions
  scenes/S1…S9          une scène = un composant
scripts/                génération audio et SRT
subtitles/              fichier SRT
```

## 6. Points de vigilance (contenu)

- Le téléchargement est présenté **sans promettre que toutes les plateformes ou tous les contenus
  sont téléchargeables** (« plateformes compatibles »). Le message de l'application visible à l'écran
  — *Only download media you own or have permission to save* — reste lisible dans les scènes 2 et 4.
- La progression, la pause, la coche de réussite et le lien collé sont des **calques animés
  illustratifs** posés sur les vraies captures ; le navigateur de la scène 3 est une illustration.
- YouTube, Facebook, etc. sont cités par leur nom ; aucun logo de marque tierce n'est reproduit
  (pastilles à initiale).
