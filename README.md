# GSN 2.0 — Publicité motion design 40 s (Remotion)

Publicité B2B pour le **Grand Salon du Numérique 2.0** : du 3 au 5 décembre 2026, à l'Arena Toamasina (Madagascar).
Objectif : convaincre les entreprises d'Antananarivo de **réserver un stand**.

| Spécification | Valeur |
|---|---|
| Format | 1920 × 1080, 16:9 horizontal, sans bandes noires ni watermark |
| Cadence / durée | 25 fps, 1 000 frames = **40,00 s** exactes |
| Export | MP4 H.264 (yuv420p, CRF 16) + AAC 48 kHz stéréo |
| Rendu livré | `out/GSN2_40s_1080p.mp4` |

## Commandes

```bash
npm install                 # dépendances (Remotion 4.0.535, React 19)
npm run studio              # prévisualisation interactive des 40 s
npm run render              # → out/GSN2_40s_1080p.mp4
npm run render:4k           # → out/GSN2_40s_2160p.mp4 (3840×2160, --scale=2)
npm run render:v2           # → out/GSN2_40s_V2_1080p.mp4 (version 2 « Pop Kinetic »)
npm run render:v3           # → out/GSN2_40s_V3_1080p.mp4 (version 3 « Destination Toamasina »)
npm run typecheck           # contrôle TypeScript
npm run audio:build         # régénère musique + SFX originaux V1 (python3 + numpy)
python3 scripts/build_audio_v2.py   # idem pour la V2
node scripts/stills.mjs 0 250 500   # images de contrôle → out/stills/ (COMP=GSN40-V2 pour la V2)
```

Sur une machine sans Chrome Headless Shell téléchargeable, ajouter
`--browser-executable=/chemin/vers/headless_shell` (ou `REMOTION_BROWSER=…` pour `stills.mjs`).

## Trois versions

| | V1 — « Cinématique » (`GSN40`) | V2 — « Pop Kinetic » (`GSN40-V2`) | V3 — « Destination Toamasina » (`GSN40-V3`) |
|---|---|---|---|
| Ambiance | Nuit bleue, éditoriale | Aplats vifs, très rythmée | **Vraies photos** des lieux, promo d'événement |
| Couleurs | Charte + palette de travail | Charte + orange vif | **Charte stricte du logo** : #02426E, #0F9EDA, #F9AE2F, #F0592E, blanc |
| Typographie | Space Grotesk / Inter | Unbounded + Space Grotesk / Inter | Space Grotesk / Inter |
| Effets clés | Ligne → masque, carte, fenêtre hexagonale, plongée dans le « O » | Un mot par temps, carte 3D, grille bento 3D, anneau 3D, stickers | Photos en parallaxe 2,5D, iris bordé de l'arc du logo, cartes postales épinglées sur la silhouette de Madagascar, texte rempli par les photos, épingle « ARENA TOAMASINA » posée sur la salle |
| Musique | Électro cinématique 125 BPM (ré mineur) | Électro 150 BPM (mi mineur) | Pop lumineuse 125 BPM (ré majeur), cordes pincées Karplus-Strong, marimba |
| Fichiers | `src/scenes/`, `public/audio/` | `src/v2/`, `public/audio/v2/` | `src/v3/`, `public/audio/v3/`, `public/media/v3/` |

### Photos de la V3

Les photos d'Antananarivo et de l'Arena de Toamasina ont été **fournies par le client** (`public/media/v3/source-*`).
Elles ne font que 474 px de large. `scripts/prep_photos_v3.py` les agrandit ×3 (Lanczos) et découpe un calque de premier plan pour la parallaxe. Les photos ne sont ni recolorées ni retouchées.
- **Droits à vérifier :** la photo de l'Arena porte un filigrane (médaillon en bas à droite). Il faut obtenir l'autorisation de son auteur avant toute diffusion, ou la remplacer par une photo dont vous détenez les droits.
- **Qualité :** pour un rendu net en grand format, fournissez les originaux en haute définition (≥ 2 000 px). Remplacez ensuite les fichiers et relancez `python3 scripts/prep_photos_v3.py` après avoir mis les nouveaux fichiers sous les mêmes noms `source-*`.

Les deux versions utilisent la même voix off, le même logo officiel (jamais déformé) et les mêmes coordonnées.

## Architecture

```
src/
  index.ts / Root.tsx         Composition « GSN40 »
  GSN40.tsx                   Composition principale : fenêtres de scènes qui se chevauchent
  config/timeline.json        SOURCE UNIQUE du minutage (scènes, voix off, repères de diction, SFX, musique)
  config/theme.ts             Système graphique (couleurs relevées sur le logo officiel, polices, zone de sécurité)
  lib/motion.ts               Courbes de Bézier, interpolations, morph hexagone→rectangle
  lib/fonts.ts                Space Grotesk + Inter (Fontsource, licence OFL, embarquées hors ligne)
  components/Typography.tsx   CharRise, WordSync, WipeText, Tag, mesure typographique réelle
  components/Primitives.tsx   DirBlur (flou de mouvement directionnel), SegmentedArc, Hex, GsnLogo, grain, vignettage
  components/MediaSlot.tsx    Emplacements médias remplaçables (vidéo/photo sous licence)
  components/illustrations/   Illustrations originales (Antananarivo, stand, présentation, rencontre)
  audio/AudioController.tsx   Voix off découpée, musique avec ducking, SFX
  scenes/Scene01_Hook … Scene06_CTA, mapCamera.ts
  data/madagascar.ts          Silhouette exacte de Madagascar (Natural Earth 1:50m, domaine public)
  v2/                         VERSION 2 : GSN40_V2.tsx, kit.tsx (transitions, marquees, stickers, 3D), scenes/, timeline.json
  v3/                         VERSION 3 : GSN40_V3.tsx, kit3.tsx (photos 2,5D, ArcIris, PhotoType, PinDrop), scenes/, timeline.json
scripts/
  build_audio.py              Synthèse de la musique et des SFX V1 (créations originales)
  build_audio_v2.py           Synthèse de la musique et des SFX V2 (150 BPM)
  build_audio_v3.py           Synthèse de la musique et des SFX V3 (125 BPM, ré majeur)
  prep_photos_v3.py           Agrandissement des photos fournies + calques de parallaxe
  logo_alpha.py               Fond blanc du logo → transparence (rendu identique au pixel sur blanc)
  madagascar.mjs              Extraction de la silhouette + projection des villes
```

Toutes les animations sont déterministes : chaque valeur est calculée à partir du numéro de frame.

## Synchronisation avec la voix off

La voix off fournie (ElevenLabs, « Sophie », 29,23 s) est la **référence temporelle**.
Elle est découpée en six phrases, coupées dans les silences mesurés (`ffmpeg silencedetect`).
Chaque phrase est placée au début de sa scène. **La diction n'est jamais accélérée.**

| Scène | Fenêtre | Phrase (extrait source) | Départ dans la vidéo |
|---|---|---|---|
| 01 Accroche | 0–6 s | 0,00–4,75 s | 0,80 s |
| 02 Opportunité | 6–12 s | 4,75–8,20 s | 6,40 s |
| 03 Marque | 12–19 s | 8,20–12,52 s | 12,48 s |
| 04 Mots | 19–25 s | 12,52–16,25 s | 19,28 s |
| 05 Révélation | 25–33 s | 16,25–23,41 s | 25,28 s |
| 06 CTA | 33–40 s | 23,41–29,23 s | 33,52 s |

Les repères mot à mot (`words` dans `timeline.json`) sont **estimés** à partir des silences et du débit syllabique.
Aucune transcription automatique n'était disponible dans l'environnement.
Ajustez-les à l'écoute dans le Studio si une voix finale différente est intégrée.

## Les six scènes

1. **Accroche.** Une ligne de lumière accélère et se scinde en deux pour révéler Antananarivo. « AU-DELÀ » surgit de derrière une frontière verticale en s'élargissant, puis sort du cadre en prolongeant son mouvement.
2. **Opportunité.** La même ligne se courbe en trajectoire Antananarivo → Toamasina sur la silhouette réelle de l'île. La caméra recule. Un éclat issu de Toamasina s'ouvre en « NOUVELLES OPPORTUNITÉS », puis « DEVENEZ EXPOSANT » s'affiche.
3. **Marque.** Le point Toamasina devient un hexagone (motif du logo), qui se déploie en fenêtre : stand, présentation, rencontre. Le texte « FAITES RAYONNER VOTRE MARQUE » occupe la gauche, les images la droite : les deux ne se recouvrent jamais. La scène se termine par une poussée caméra à travers la fenêtre.
4. **Mots cinétiques.** RENCONTRES : les groupes de lettres se percutent. VISIBILITÉ : la jonction devient une fente lumineuse qui repousse le mot précédent. OPPORTUNITÉS : les lettres s'agrandissent, puis la caméra plonge dans le « O » ; son contre-poinçon sert de portail vers la scène suivante. Trois impacts sonores accompagnent ces mots.
5. **Révélation.** L'arc segmenté (dérivé du logo) entre en orbite. Les dates roulent sur la diction, puis se rangent dans la colonne d'informations. Un hexagone ambre devient la carte blanche qui accueille le **logo officiel, intact**.
6. **CTA.** La carte blanche s'étend à tout le cadre. « RÉSERVEZ VOTRE STAND » devient la priorité visuelle. Le téléphone et l'e-mail s'affichent à 34,9 s et restent à l'écran jusqu'à la dernière frame. Des hexagones « opportunités » passent ; l'un d'eux se verrouille au moment de « Prenez votre place ». La vidéo se termine sur une signature sonore.

## Médias : ce qui est intégré, ce qui manque

**Intégré (fourni par vous)**
- `public/brand/gsn-logo-original.png` : logo officiel (675 × 675, fond blanc).
- `public/brand/gsn-logo.png` : même logo, fond blanc rendu transparent (couleurs et proportions inchangées ; ratio verrouillé dans `GsnLogo`).
- `public/audio/voiceover_source.mp3` : voix off officielle.

**Créé pour ce projet (original, remplaçable)**
- `public/audio/music_bed.wav` : lit musical « cinematic electronic » de 40,00 s. Il est **entièrement synthétisé** par `scripts/build_audio.py`, sans aucun échantillon tiers. C'est une maquette de production, pas la musique d'un compositeur.
- `public/audio/sfx/*.wav` : whooshes, impacts, risers, pings, signature sonore. Ils sont aussi synthétisés.
- Illustrations vectorielles d'Antananarivo et de scènes de salon. Elles sont stylisées et ne présentent **pas** une édition passée du GSN.

**Manquant / recommandé**

| Besoin | Fichier à déposer | Effet |
|---|---|---|
| Logo vectoriel (SVG/PDF) ou PNG ≥ 2000 px | remplacer `public/brand/gsn-logo.png` (garder le ratio 517:392 ou mettre à jour `LOGO_RATIO`) | Netteté en 4K. Le PNG actuel ne fait que 517 px utiles. |
| Logo officiel « GSN 2.0 » (s'il existe) | idem | Le logo fourni porte seulement « GSN ». « 2.0 » est donc affiché séparément (badge « ÉDITION 2.0 », titre). |
| Photo ou vidéo d'Antananarivo sous licence | `public/media/antananarivo.jpg` ou `.mp4` | Remplace l'illustration (scène 01). |
| Vidéo de stand professionnel | `public/media/stand.mp4` | V1 scène 03 plan 1 ; V2 tuile « Stand d'exposition ». |
| Vidéo de présentation / pitch | `public/media/presentation.mp4` | Scène 03, plan 2. |
| Vidéo de rencontre d'affaires | `public/media/rencontre.mp4` | Scène 03, plan 3. |
| Musique de compositeur / banque licenciée | remplacer `public/audio/music_bed.wav` (40,00 s) | Le ducking reste automatique. |
| SFX sous licence | remplacer `public/audio/sfx/<nom>.wav` | Mêmes noms de fichiers. |

`MediaSlot` détecte automatiquement les fichiers de `public/media/`. Aucun code n'est à modifier.
Si vous ajoutez des images génériques (banques d'images), elles ne doivent pas être présentées comme des images d'une édition passée du GSN.

## Contrôle qualité

- [x] Durée : 1 000 frames à 25 fps = 40,00 s (vérifiée avec `ffprobe` sur le MP4).
- [x] Format 1920 × 1080, 16:9, H.264.
- [x] Textes dans la zone de sécurité (marges ≥ 120 px). Les tailles des titres sont ajustées par mesure réelle de la police (`textWidth`).
- [x] Lisibilité : CTA en 165–178 px, téléphone en 70 px, e-mail en 56 px, contraste bleu marine sur blanc.
- [x] Dates et coordonnées : « 3 – 5 DÉCEMBRE 2026 », « ARENA TOAMASINA », « +261 34 40 302 89 », « gsn@elitecommunication.mg ».
- [x] Logo jamais déformé : seules la translation et l'échelle uniforme sont animées, et le révélé se fait par masque.
- [x] Le CTA reste à l'écran de 33,5 s à 40 s ; les coordonnées de 34,9 s à 40 s.
- [x] Aucune image ne prétend montrer une édition passée du GSN.
- [ ] À valider par vous : ressenti final de la voix et de la musique, droits des médias ajoutés ultérieurement.

## Licences

- Polices : Space Grotesk, Inter et Unbounded, SIL Open Font License 1.1 (usage commercial autorisé).
- Carte : Natural Earth, domaine public (via le paquet `world-atlas`).
- Musique, SFX et illustrations : créations originales de ce dépôt.
- Remotion : vérifiez la [licence Remotion](https://www.remotion.dev/license). Une licence d'entreprise est requise pour les sociétés de plus de 3 personnes.
