# Les Escapades de Nanilina — Akanin’ny Nofy · Publicité motion design

Publicité verticale **1080 × 1920 (9:16)**, **35 s**, 30 i/s (version 60 i/s disponible), pour Facebook Ads, Instagram Reels et TikTok.
Projet [Remotion](https://www.remotion.dev) (React) : animation réelle, synchronisée sur la voix off, exportable en MP4.

**Vidéos :**
- **Version 2 (recommandée)** : [`out/escapade-akanin-ny-nofy-v2.mp4`](out/escapade-akanin-ny-nofy-v2.mp4). 33 s, montage plus rythmé, palette sobre, voix off seule.
- Version 1 : [`out/escapade-akanin-ny-nofy.mp4`](out/escapade-akanin-ny-nofy.mp4). 35 s, très colorée, avec musique et effets sonores.

## Version 2 : ce qui change

- **Montage plus dynamique** : coupes rapides en plein écran sur les photos, zooms « punch-in », photos qui défilent derrière l'accroche, mosaïque 2×2 sur « GOOD VIBES », pauses de la voix resserrées (33 s au lieu de 35).
- **Palette sobre, tirée des photos** : bleu nuit `#0E1A26`, sable `#F3E7D3`, lagon `#5CC8BC`, et une seule couleur d'accent, corail `#EE7B57`, réservée au prix et à l'urgence. Il n'y a plus de dégradés arc-en-ciel, de fuites de lumière ni de particules.
- **Typographie éditoriale** : Anton (titres condensés), Montserrat (libellés), Playfair Display italique (« Imaginez… »).
- **Son** : voix off seule, sans musique ni effets sonores. Pour ajouter un morceau de votre choix, renseignez `V2_MUSIC.file` dans `src/v2/timeline.ts`. Il baissera automatiquement sous la voix.
- Réglages (palette, minutage, voix) : `src/v2/timeline.ts`. Les textes restent dans `src/config.ts` et sont communs aux deux versions.

```bash
npm run render:v2        # → out/escapade-akanin-ny-nofy-v2.mp4
npm run render:v2-60fps  # version 60 i/s
```

Le tableau ci-dessous décrit la version 1.

## Déroulé (synchronisé sur la voix off)

| Temps | Scène | Visuel | Voix off |
|---|---|---|---|
| 0 – 4 s | Hook | Drone + viseur d'appareil photo, « VOTRE GALERIE MÉRITE UN NOUVEAU DÉCOR ! » mot à mot, trait de pinceau | « Votre galerie mérite un nouveau décor ! » |
| 4 – 8,7 s | Destination | Zoom depuis le flou, « AKANIN’NY NOFY » en lettres 3D, signature « LES ESCAPADES DE NANILINA », pastille 24 & 25 octobre | « Les 24 et 25 octobre… à Akanin’ny Nofy ! » |
| 8,7 – 18 s | Expériences | Flash photo, ambiance coucher de soleil, 4 Polaroid qui se « développent », SHOOTING PHOTO / SUNSET / GOOD VIBES | « Imaginez… des GOOD VIBES ! » |
| 18 – 26 s | Prix | Transition en panoramique filé, « 200 000 Ar » en chiffres défilants, prestations incluses, « Entrée Palmarium non incluse » | « Le week-end à 200 000 ariary… non incluse. » |
| 26 – 29 s | Dates | Ouverture en iris, calendriers 24 & 25 en 3D, OCTOBRE, trajet animé Toamasina → Akanin’ny Nofy | « Départ de Toamasina ! » |
| 29 – 35 s | Appel à l'action | Drop musical, PLACES TRÈS LIMITÉES, RÉSERVEZ MAINTENANT, bouton WhatsApp **+261 34 74 004 61** (visible 5 s), puis plan final « affiche » complet | « Les places sont très limitées ! Réservez maintenant sur WhatsApp ! » |

Les bornes des scènes s'écartent du brief de moins d'une seconde. Ce décalage permet de caler chaque scène sur la phrase correspondante de la voix off.

## Médias utilisés

- `public/photos/` : les 4 photos fournies, affichées sans déformation (recadrage uniquement).
- `public/video/drone-akanin-ny-nofy.mp4` : la vidéo drone fournie, recadrée en vertical avec mouvements de caméra 2.5D.
- `public/audio/voix-off.mp3` : la voix off ElevenLabs fournie, normalisée (l'original est dans `voix-off-originale.mp3`).
- `public/audio/musique-tropical-house.mp3` et `public/audio/sfx/` : musique tropical house (104 BPM) et effets sonores **créés par synthèse** avec `scripts/make_audio.py`. Ils ne reprennent aucun échantillon externe, donc aucun droit à gérer.
- `public/fonts/` : Montserrat, Pacifico et Caveat (licence SIL Open Font License), hébergées localement.

## Prérequis

- [Node.js](https://nodejs.org) 18 ou plus récent
- (facultatif, pour régénérer la musique) Python 3 + numpy + ffmpeg

```bash
npm install
```

## Prévisualiser

```bash
npm run studio
```

Ouvre Remotion Studio dans le navigateur : lecture avec le son, timeline image par image.

## Exporter en MP4

```bash
npm run render          # 30 i/s → out/escapade-akanin-ny-nofy.mp4
npm run render:60fps    # 60 i/s → out/escapade-akanin-ny-nofy-60fps.mp4 (rendu ~2× plus long)
```

Au premier rendu, Remotion télécharge automatiquement un navigateur headless. Pour utiliser un Chrome déjà installé :
`REMOTION_CHROME=/chemin/vers/chrome npm run render`.

## Modifier les textes

Tout est dans **`src/config.ts`** :

- `CONTENT` : tous les textes (prix, dates, numéro WhatsApp, mentions…).
- `CUES` : les instants d'apparition des éléments.
- `SCENES` : le début et la fin de chaque scène.
- `VOICE`, `SFX`, `MUSIC_VOLUME` : le placement de la voix off, les effets sonores et le volume de la musique (la musique baisse automatiquement sous la voix).

Pour changer les textes sans toucher au code, passer un fichier JSON :

```bash
npx remotion render EscapadeAd out/variante.mp4 --props=./mes-textes.json
```

## Ajouter l'affiche originale au plan final

1. Copier l'affiche dans `public/affiche.jpg`.
2. Dans `src/config.ts`, remplacer `affiche: null` par `affiche: 'affiche.jpg'`.

Le plan final affiche alors l'affiche originale, avec le bouton WhatsApp au premier plan.

## Remplacer la voix off

Remplacer `public/audio/voix-off-originale.mp3`, lancer `npm run audio` pour la normaliser, puis ajuster `VOICE` dans `src/config.ts`. Chaque entrée indique le passage du fichier à lire (`src`, en secondes) et son placement sur la timeline (`at`).

## Zones de sécurité réseaux sociaux

Les informations clés (prix, dates, numéro) restent entre 90 et 1 560 px de hauteur. Les ~350 px du bas restent libres, car l'interface TikTok, Reels et Facebook (légende, boutons) recouvre cette zone.
